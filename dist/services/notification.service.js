"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const pusher_service_1 = require("./pusher.service");
exports.notificationService = {
    sendNotification: async ({ userId, type, message, link, }) => {
        try {
            const notification = new Notification_1.default({
                userId,
                type,
                message,
                link,
                read: false,
            });
            await notification.save();
            // Trigger Pusher event
            await pusher_service_1.pusherService.triggerEvent(`notifications-${userId}`, "new-notification", {
                id: notification._id,
                userId,
                type,
                message,
                link,
                read: false,
                createdAt: notification.createdAt,
            });
            return notification;
        }
        catch (error) {
            console.error(`[NotificationService]: Failed to send notification to ${userId}`, error);
            throw error;
        }
    },
};
