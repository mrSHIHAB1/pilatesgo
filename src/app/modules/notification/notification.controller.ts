import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { NotificationService } from "./notification.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

const myNotifications = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await NotificationService.getMyNotifications(userId, req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notifications fetched",
    meta: result.meta,
    data: result.data,
  });
});

const markRead = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;
  const { notificationId } = req.params;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  await NotificationService.markAsRead(userId, notificationId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notification marked as read",
    data: null,
  });
});

const markAllRead = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Unauthorized',
      data: null,
    });
  }

  const result = await NotificationService.markAllRead(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All notifications marked as read",
    data: result,
  });
});

const deleteNotificationController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await NotificationService.deleteNotification(id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification deleted successfully",
      data: null,
    });
  },
);

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "20" } = req.query;

  const result = await NotificationService.getAllNotifications({
    page: Number(page),
    limit: Number(limit),
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All notifications fetched",
    meta: result.meta,
    data: result.data,
  });
});

const sendTestPush = catchAsync(async (_req: Request, res: Response) => {
  const result = await NotificationService.sendTestPush();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Test push notification sent",
    data: result,
  });
});

export const NotificationController = {
  myNotifications,
  markRead,
  markAllRead,
  deleteNotificationController,
  getAllNotifications,
  sendTestPush
};
