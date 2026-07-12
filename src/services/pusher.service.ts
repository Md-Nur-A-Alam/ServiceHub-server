import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || "mt1";

let pusher: Pusher | null = null;

if (appId && key && secret) {
  pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  console.log("[Pusher]: Configured Pusher client using environment variables.");
} else {
  console.log("[Pusher]: Missing Pusher environment variables. Operating in fallback/mock mode.");
}

export const pusherService = {
  triggerEvent: async (channel: string, event: string, data: any) => {
    try {
      if (pusher) {
        await pusher.trigger(channel, event, data);
        console.log(`[Pusher]: Event "${event}" triggered on channel "${channel}"`);
      } else {
        console.log(`[MOCK Pusher Event on channel "${channel}"]: "${event}":`, JSON.stringify(data));
      }
    } catch (error) {
      console.error(`[Pusher]: Failed to trigger event "${event}" on channel "${channel}"`, error);
    }
  },
};

