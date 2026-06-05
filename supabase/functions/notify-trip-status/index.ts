import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Este endpoint es llamado por el trigger de DB cuando cambia el status de un viaje
// Se puede invocar también manualmente desde el cliente

const EDGE_FUNCTION_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const STATUS_MESSAGES: Record<string, { clientTitle: string; clientBody: string; driverTitle?: string; driverBody?: string }> = {
  ASSIGNED: {
    clientTitle: "¡Conductor en camino!",
    clientBody: "Un mototaxista aceptó tu viaje. Pronto llegará.",
  },
  ON_ROUTE: {
    clientTitle: "Conductor en camino",
    clientBody: "Tu conductor está dirigiéndose a recogerte.",
  },
  STARTED: {
    clientTitle: "Viaje iniciado",
    clientBody: "¡Buen viaje! Ya estás en camino a tu destino.",
  },
  FINISHED: {
    clientTitle: "¡Llegaste!",
    clientBody: "Tu viaje ha finalizado. ¿Cómo estuvo el servicio?",
    driverTitle: "Viaje completado",
    driverBody: "El viaje fue completado exitosamente. ¡Bien hecho!",
  },
  CANCELLED: {
    clientTitle: "Viaje cancelado",
    clientBody: "Tu viaje fue cancelado.",
    driverTitle: "Viaje cancelado",
    driverBody: "El viaje fue cancelado por el cliente.",
  },
};

async function sendPush(userId: string, title: string, body: string, url?: string) {
  await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ userId, title, body, data: url ? { url } : undefined }),
  });
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json();

  // Puede venir del webhook de Supabase o de una llamada directa
  const record = body.record ?? body;
  const { status, client_id, driver_id } = record;

  const msg = STATUS_MESSAGES[status];
  if (!msg) return new Response(JSON.stringify({ skipped: true }), { status: 200 });

  const promises: Promise<void>[] = [];

  // Notificar al cliente
  if (client_id) {
    promises.push(sendPush(client_id, msg.clientTitle, msg.clientBody, "/cliente"));
  }

  // Notificar al conductor si corresponde
  if (driver_id && msg.driverTitle && msg.driverBody) {
    promises.push(sendPush(driver_id, msg.driverTitle, msg.driverBody, "/conductor"));
  }

  await Promise.allSettled(promises);

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
