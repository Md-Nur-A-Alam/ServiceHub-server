"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pusherService = void 0;
const pusher_1 = __importDefault(require("pusher"));
const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || "mt1";
let pusher = null;
if (appId && key && secret) {
    pusher = new pusher_1.default({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
    });
    console.log("[Pusher]: Configured Pusher client using environment variables.");
}
else {
    console.log("[Pusher]: Missing Pusher environment variables. Operating in fallback/mock mode.");
}
exports.pusherService = {
    triggerEvent: async (channel, event, data) => {
        try {
            if (pusher) {
                await pusher.trigger(channel, event, data);
                console.log(`[Pusher]: Event "${event}" triggered on channel "${channel}"`);
            }
            else {
                console.log(`[MOCK Pusher Event on channel "${channel}"]: "${event}":`, JSON.stringify(data));
            }
        }
        catch (error) {
            console.error(`[Pusher]: Failed to trigger event "${event}" on channel "${channel}"`, error);
        }
    },
};
