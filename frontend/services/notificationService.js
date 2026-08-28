import api from "./api";
import {
  getFirebaseMessaging,
  isConfigured,
} from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";

export const enableAppNotifications = async () => {
  if (typeof window === "undefined") {
    throw new Error("Notifications can only be enabled in the browser");
  }

  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  if (!isConfigured) {
    throw new Error("Firebase is not configured");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    throw new Error("Firebase messaging is not supported in this browser");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!vapidKey) {
    throw new Error("Firebase VAPID key is missing");
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Unable to obtain a push token");
  }

  await api.post("/notifications/devices", {
    token,
    platform: "web",
    deviceName: navigator.userAgent,
  });

  return token;
};

export const listenForForegroundNotifications = async (
  callback
) => {
  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    return null;
  }

  return onMessage(messaging, callback);
};
