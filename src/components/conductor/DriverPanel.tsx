"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, DollarSign, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { acceptTrip, updateTripStatus } from "@/services/trips";
import { useRealtimePendingTrips } from "@/hooks/useRealtimeTrips";
import { createClient } from "@/lib/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import type { Trip } from "@/types/trip";

const STATUS_ACTIONS: Partial<Record<Trip["status"], { label: string; next: Trip["status"] }>> = {
  ASSIGNED: { label: "Voy a recoger al pasajero", next: "ON_ROUTE" },
  ON_ROUTE: { label: "Pasajero a bordo", next: "STARTED" },
  STARTED: { label: "Finalizar viaje", next: "FINISHED" },
};

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Viaje asignado",
  ON_ROUTE: "En camino al pasajero",
  STARTED: "Viaje en curso",
  FINISHED: "Viaje completado",
};

export function DriverPanel() {
  const user = useAuthStore((s) => s.user);
  const { location } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cargar estado real del conductor desde la DB al montar
  useEffect(() => {
    if (!user) return;
    async function loadDriverState() {
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("driver_profiles")
        .select("is_online, is_approved")
        .eq("user_id", user!.id)
        .single();

      if (profile) {
        setHasProfile(true);
        const p = profile as { is_online: boolean; is_approved: boolean };
        setIsApproved(p.is_approved);
        setIsOnline(p.is_online);
        if (p.is_online && p.is_approved) await loadPendingTrips();
      }
      setProfileReady(true);

      // Buscar viaje activo asignado al conductor
      const { data: trip } = await supabase
        .from("trips")
        .select("*")
        .eq("driver_id", user!.id)
        .not("status", "in", '("FINISHED","CANCELLED")')
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (trip) setActiveTrip(trip as Trip);
    }
    loadDriverState();
  }, [user?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Actualizar ubicación en DB cada 5 segundos cuando está online
  useEffect(() => {
    if (!isOnline || !user || !location) return;

    async function updateLocation() {
      if (!user || !location) return;
      const supabase = createClient();
      await supabase
        .from("driver_profiles")
        .update({ current_lat: location.lat, current_lng: location.lng })
        .eq("user_id", user.id);
    }

    updateLocation();
    locationIntervalRef.current = setInterval(updateLocation, 5000);

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isOnline, user, location]);

  // Cargar viajes pendientes existentes desde DB
  async function loadPendingTrips() {
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });
    if (data && data.length > 0) setPendingTrips(data as Trip[]);
  }

  // Marcar online/offline en DB
  async function toggleOnline() {
    if (!user) return;
    const newState = !isOnline;
    const supabase = createClient();
    await supabase
      .from("driver_profiles")
      .update({ is_online: newState })
      .eq("user_id", user.id);
    setIsOnline(newState);
    if (newState) {
      await loadPendingTrips(); // Cargar viajes al activarse
    } else {
      setPendingTrips([]);
    }
  }

  const handleNewTrip = useCallback((trip: Trip) => {
    setPendingTrips((prev) => {
      if (prev.find((t) => t.id === trip.id)) return prev;

      // Sonido de notificación
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch { /* AudioContext no disponible */ }

      // Vibración en móvil
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      // Notificación del sistema si la app está en segundo plano
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("¡Nueva solicitud de viaje! 🏍️", {
          body: `${trip.origin_address ?? "Origen"} → ${trip.destination_address ?? "Destino"}`,
          icon: "/icons/icon-192x192.png",
        });
      }

      return [...prev, trip];
    });
  }, []);

  useRealtimePendingTrips(handleNewTrip, isOnline && !activeTrip);

  async function handleAccept(trip: Trip) {
    if (!user) return;
    try {
      setLoading(true);
      const accepted = await acceptTrip(trip.id, user.id);
      setActiveTrip(accepted);
      setPendingTrips([]);
    } catch (e) {
      console.error("Error aceptando viaje:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!activeTrip) return;
    const action = STATUS_ACTIONS[activeTrip.status];
    if (!action) return;
    try {
      setLoading(true);
      const updated = await updateTripStatus(activeTrip.id, action.next);
      setActiveTrip(updated);
      if (action.next === "FINISHED") {
        setTimeout(() => setActiveTrip(null), 3000);
      }
    } catch (e) {
      console.error("Error actualizando estado:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!profileReady) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1000] max-h-[65vh] overflow-y-auto">
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
      <div className="px-4 pb-6 pt-2 space-y-4">

        {/* Sin perfil: pedir que lo complete */}
        {!hasProfile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            <p className="font-medium">Completa tu perfil</p>
            <p className="text-xs mt-1">Debes registrar tu moto y licencia antes de recibir viajes.</p>
            <a href="/conductor/perfil" className="text-orange-500 font-semibold text-xs mt-2 block">
              Ir a Mi perfil →
            </a>
          </div>
        )}

        {/* Pendiente de aprobación */}
        {hasProfile && !isApproved && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            <p className="font-medium">⏳ Cuenta pendiente de aprobación</p>
            <p className="text-xs mt-1">Un administrador debe aprobar tu cuenta antes de que puedas recibir viajes.</p>
          </div>
        )}

        {/* Toggle online */}
        {!activeTrip && hasProfile && isApproved && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isOnline ? "Disponible" : "No disponible"}
              </p>
              <p className="text-xs text-gray-400">
                {isOnline ? "Recibirás solicitudes de viaje" : "Activa para recibir viajes"}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                isOnline ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  isOnline ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        )}

        {/* Viaje activo */}
        {activeTrip && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {STATUS_LABELS[activeTrip.status] ?? "Viaje activo"}
              </span>
              <Badge variant={activeTrip.status === "FINISHED" ? "success" : "warning"}>
                {activeTrip.status}
              </Badge>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span>
                  {activeTrip.origin_address ??
                    `${activeTrip.origin_lat.toFixed(5)}, ${activeTrip.origin_lng.toFixed(5)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span>
                  {activeTrip.destination_address ??
                    `${activeTrip.destination_lat.toFixed(5)}, ${activeTrip.destination_lng.toFixed(5)}`}
                </span>
              </div>
            </div>

            {activeTrip.price && (
              <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600">Ganancia</span>
                <span className="font-bold text-orange-500">
                  S/ {activeTrip.price.toFixed(2)}
                </span>
              </div>
            )}

            {activeTrip.status === "FINISHED" ? (
              <p className="text-center text-sm text-green-600 font-medium py-2">
                ¡Viaje completado exitosamente!
              </p>
            ) : STATUS_ACTIONS[activeTrip.status] ? (
              <Button
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={loading}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {STATUS_ACTIONS[activeTrip.status]!.label}
              </Button>
            ) : null}
          </div>
        )}

        {/* Solicitudes pendientes */}
        {isOnline && isApproved && !activeTrip && pendingTrips.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">
                Solicitudes disponibles
              </p>
              <span className="animate-pulse bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {pendingTrips.length}
              </span>
            </div>
            {pendingTrips.map((trip) => (
              <div
                key={trip.id}
                className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50"
              >
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 mt-0.5 shrink-0" />
                    <span className="truncate">
                      {trip.origin_address ??
                        `${trip.origin_lat.toFixed(4)}, ${trip.origin_lng.toFixed(4)}`}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 mt-0.5 shrink-0" />
                    <span className="truncate">
                      {trip.destination_address ??
                        `${trip.destination_lat.toFixed(4)}, ${trip.destination_lng.toFixed(4)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {trip.price && (
                    <span className="text-sm font-semibold text-orange-500">
                      S/ {trip.price.toFixed(2)}
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleAccept(trip)}
                    disabled={loading}
                  >
                    Aceptar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado sin solicitudes */}
        {isOnline && isApproved && !activeTrip && pendingTrips.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Esperando solicitudes...</span>
          </div>
        )}
      </div>
    </div>
  );
}
