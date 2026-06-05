"use client";

import { useEffect, useRef } from "react";
import { requestNotificationPermission, getFirebaseMessaging, onMessage } from "@/lib/firebase";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

function showLocalNotification({ title, body, url }: NotificationPayload) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "mototaxi",
  });
  if (url) n.onclick = () => window.focus();
}

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);
  const tokenSaved = useRef(false);

  useEffect(() => {
    if (!user || tokenSaved.current) return;

    async function init() {
      // Registrar service worker de Firebase
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          // Enviar config al SW
          const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
          if (reg?.active) {
            reg.active.postMessage({
              type: "FIREBASE_CONFIG",
              config: {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
              },
            });
          }
        } catch (err) {
          console.warn("SW registration failed:", err);
        }
      }

      const token = await requestNotificationPermission();
      if (!token || !user) return;

      // Guardar token en DB
      const supabase = createClient();
      await supabase
        .from("users")
        .update({ fcm_token: token } as Record<string, unknown>)
        .eq("id", user.id);

      tokenSaved.current = true;

      // Escuchar mensajes en foreground
      const messaging = getFirebaseMessaging();
      if (messaging) {
        onMessage(messaging, (payload) => {
          showLocalNotification({
            title: payload.notification?.title ?? "MotoTaxi",
            body: payload.notification?.body ?? "",
            url: payload.data?.url,
          });
        });
      }
    }

    init();
  }, [user]);
}

// Helper para mostrar notificación local sin FCM (para cambios de estado via Realtime)
export function notifyTripStatus(status: string, role: "CLIENT" | "DRIVER") {
  const messages: Record<string, Record<string, { title: string; body: string }>> = {
    CLIENT: {
      ASSIGNED:  { title: "Conductor asignado",   body: "Un conductor aceptó tu viaje. ¡Ya viene!" },
      ON_ROUTE:  { title: "Conductor en camino",   body: "Tu conductor está en camino a recogerte." },
      STARTED:   { title: "Viaje iniciado",        body: "¡Buen viaje! Ya estás en camino." },
      FINISHED:  { title: "Llegaste a tu destino", body: "Califica tu experiencia." },
      CANCELLED: { title: "Viaje cancelado",       body: "El viaje fue cancelado." },
    },
    DRIVER: {
      PENDING:   { title: "Nueva solicitud",       body: "Hay un nuevo viaje disponible cerca de ti." },
    },
  };

  const msg = messages[role]?.[status];
  if (msg) showLocalNotification(msg);
}
