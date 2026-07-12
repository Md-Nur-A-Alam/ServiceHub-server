import Notification from "../models/Notification";
import { pusherService } from "./pusher.service";

export const notificationService = {
  sendNotification: async ({
    userId,
    type,
    message,
    link,
  }: {
    userId: string;
    type: string;
    message: string;
    link?: string;
  }) => {
    try {
      const notification = new Notification({
        userId,
        type,
        message,
        link,
        read: false,
      });
      await notification.save();

      // Trigger Pusher event
      await pusherService.triggerEvent(`notifications-${userId}`, "new-notification", {
        id: notification._id,
        userId,
        type,
        message,
        link,
        read: false,
        createdAt: notification.createdAt,
      });

      return notification;
    } catch (error) {
      console.error(`[NotificationService]: Failed to send notification to ${userId}`, error);
      throw error;
    }
  },
};

