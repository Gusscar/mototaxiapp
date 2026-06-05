"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

/** Componente invisible que inicializa las push notifications */
export function PushNotificationInit() {
  usePushNotifications();
  return null;
}
