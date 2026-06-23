/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotificationType } from "../../../../prisma/generated/prisma/enums";

export { NotificationType };

export interface INotificationData {
  chatId?: string;
  senderId?: string;
  receiverId?: string;
  deepLink?: string;
  matchId?: string;
  [key: string]: any;
}

export interface INotification {
  id?: string;
  userId: string; // receiver user id
  type: NotificationType;
  title: string;
  body: string;
  data?: INotificationData;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
