import { getFirebaseMessaging } from "./config";
import { getToken, onMessage, MessagePayload } from "firebase/messaging";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// ─── Request notification permission & get FCM token ─────────────────
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// ─── Foreground message listener ──────────────────────────────────────
export const onForegroundMessage = async (
  callback: (payload: MessagePayload) => void
) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  return onMessage(messaging, callback);
};
