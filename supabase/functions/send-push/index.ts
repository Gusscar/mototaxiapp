import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FCM_URL = "https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send";

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

async function sendFCM(token: string, title: string, body: string, data?: Record<string, string>) {
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!;
  const serviceAccount = JSON.parse(serviceAccountJson);

  // Obtener access token de Firebase Admin via JWT
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Encode JWT
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const signingInput = `${enc(header)}.${enc(payload)}`;

  // Import RSA key
  const privateKey = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const keyData = Uint8Array.from(atob(privateKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signingInput}.${sigB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await tokenRes.json();

  // Send FCM message
  const fcmRes = await fetch(FCM_URL.replace("{PROJECT_ID}", projectId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: data ?? {},
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      },
    }),
  });

  return fcmRes.ok;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, title, body, data } = (await req.json()) as PushPayload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: user } = await supabase
      .from("users")
      .select("fcm_token")
      .eq("id", userId)
      .single();

    const token = (user as { fcm_token?: string } | null)?.fcm_token;
    if (!token) {
      return new Response(JSON.stringify({ sent: false, reason: "no_token" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const sent = await sendFCM(token, title, body, data);
    return new Response(JSON.stringify({ sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
