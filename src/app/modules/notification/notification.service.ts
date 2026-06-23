/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "../../shared/prisma";
import { INotificationData, NotificationType } from "./notification.interface";
import { sendPushToTokens } from "../../../utils/sendPushNotification";

const NOTI_ROOM = (userId: string) => `notification_${userId}`;

// Safe local socket wrapper since socket.store is not configured
const getIo = () => {
  return {
    to: (room: string) => ({
      emit: (event: string, data: any) => {
        // Safe dummy implementation
      }
    })
  } as any;
};

// socket emit to notification room

const createInApp = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  data?: INotificationData,
) => {
  if (!userIds.length) return [];

  const createdNotifications = await prisma.$transaction(
    userIds.map((id) =>
      prisma.notification.create({
        data: {
          userId: id,
          type,
          title,
          body,
          data: data as any,
        },
      })
    )
  );

  return createdNotifications;
};

const pushToUserIds = async (
  userIds: string[],
  title: string,
  body: string,
  data?: INotificationData,
) => {
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      NotificationsEnabled: true,
    },
    select: {
      id: true,
    },
  });

  const tokens: string[] = [];
  users.forEach((u: any) => {
    if (u.fcmTokens && Array.isArray(u.fcmTokens)) {
      tokens.push(...u.fcmTokens.filter(Boolean));
    } else if (u.fcmToken) {
      tokens.push(u.fcmToken);
    }
  });

  if (!tokens.length) return { successCount: 0, failureCount: 0 };
  return sendPushToTokens(tokens, title, body, data);
};

const notifyChatMessage = async (
  receiverId: string,
  sender: any,
  messageDoc: any,
) => {
  const senderId = String(sender?.id ?? sender);

  // Prevent self-notification
  if (receiverId === senderId) {
    return { inAppCount: 0, successCount: 0, failureCount: 0 };
  }

  const title = "New message received";
  const senderName = sender?.fullName || "Someone";
  const body = `${senderName} sent you a message`;

  const data: INotificationData = {
    senderId,
    receiverId,
    chatId: String(messageDoc?.id),
  };

  // Save in-app notification
  const saved = await createInApp(
    [receiverId],
    NotificationType.CHAT_MESSAGE,
    title,
    body,
    data,
  );

  // Push notification
  const pushed = await pushToUserIds([receiverId], title, body, data);

  // Emit via socket
  const io = getIo();
  io.to(`notification_${receiverId}`).emit("notification", {
    type: NotificationType.CHAT_MESSAGE,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

const getMyNotifications = async (
  userId: string,
  query: Record<string, string>,
) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId },
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data,
  };
};

const markAsRead = async (userId: string, notificationId: string) => {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  return null;
};

const deleteNotification = async (notificationId: string) => {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
};

const markAllRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return {
    matchedCount: result.count,
    modifiedCount: result.count,
  };
};

const notifyAdminsFeedbackSubmitted = async (feedback: any) => {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
    },
  });

  const adminIds = admins.map((a) => a.id);

  if (!adminIds.length)
    return { inAppCount: 0, successCount: 0, failureCount: 0 };

  const title = "New Feedback Submitted";
  const body = `"${feedback.title}" has been submitted by a user.`;

  const data: INotificationData = {
    feedbackId: String(feedback.id),
    deepLink: `/feedback/${feedback.id}`,
  };

  const saved = await createInApp(
    adminIds,
    NotificationType.FEEDBACK_SUBMITTED,
    title,
    body,
    data,
  );
  const pushed = await pushToUserIds(adminIds, title, body, data);

  
  return { inAppCount: saved.length, ...pushed };
};

const getAllNotifications = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count(),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};



const sendTestPush = async () => {
  const token = "c0B6k3_ARjWTolXR50hPcr:APA91bF8r1U9_X0G9bdNiJkCoE230edj5n3kIyjHJAdkljLFB4ZLVSKndXH0KWu4ILuLETbcz7mAqlElBadm5fsG8UoZywO2pShIsD7cITkmZnD7odPzgBA";

  const message = {
    notification: {
      title: "Test Push",
      body: "This is a test notification from NotificationService"
    },
    data: { test: "value" },
    token: token
  };

  try {
    const adminModule = require('firebase-admin');
    const response = await adminModule.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};




export const NotificationService = {
  notifyAdminsFeedbackSubmitted,
  notifyChatMessage,
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  getAllNotifications,

  sendTestPush,

  createInApp,
  pushToUserIds
};
