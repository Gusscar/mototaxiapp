"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, DollarSign, Clock, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTripStore } from "@/store/tripStore";
import { useAuthStore } from "@/store/authStore";
import { createTrip, getActiveTripForClient } from "@/services/trips";
import { getRoute, reverseGeocode } from "@/services/maps";
import { useLocation } from "@/hooks/useLocation";
import { useRealtimeTrips } from "@/hooks/useRealtimeTrips";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useTariff, calculateDynamicPrice } from "@/hooks/useTariff";
import { notifyTripStatus } from "@/hooks/usePushNotifications";
import { createClient } from "@/lib/supabase/client";
import { getWalletBalance } from "@/services/payments";
import { applyCoupon } from "@/services/coupons";
import { PaymentSelector } from "@/components/viajes/PaymentSelector";
import type { Trip } from "@/types/trip";
import type { PaymentMethod, CouponValidation } from "@/types/payment";

type PanelStep =
  | "idle"
  | "selecting_destination"
  | "calculating"
  | "confirming"
  | "payment"
  | "waiting"
  | "active"
  | "rating";

const STATUS_INFO: Record<string, { label: string; color: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  PENDING:   { label: "Buscando conductor...", color: "secondary" },
  ASSIGNED:  { label: "Conductor asignado",   color: "warning"   },
  ON_ROUTE:  { label: "Conductor en camino",  color: "warning"   },
  STARTED:   { label: "Viaje en curso",        color: "default"   },
  FINISHED:  { label: "Viaje finalizado",      color: "success"   },
  CANCELLED: { label: "Cancelado",             color: "destructive"},
};

interface DriverInfo {
  name: string;
  phone: string | null;
  motorcycle_model: string;
  license_plate: string;
}

interface TripRequestPanelProps {
  onSelectingDestinationChange: (
    selecting: boolean,
    onSelect?: (lat: number, lng: number) => void
  ) => void;
  onRouteChange: (coords: [number, number][] | undefined) => void;
  onDriverLocationChange: (loc: { lat: number; lng: number } | null) => void;
}

export function TripRequestPanel({
  onSelectingDestinationChange,
  onRouteChange,
  onDriverLocationChange,
}: TripRequestPanelProps) {
  const { location } = useLocation();
  const { origin, destination, setOrigin, setDestination, activeTrip, setActiveTrip } =
    useTripStore();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<PanelStep>("idle");
  const [price, setPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const { data: tariff } = useTariff();

  // Recuperar viaje activo al montar (por si el usuario recargó la página)
  useEffect(() => {
    if (!user) return;
    async function restoreActiveTrip() {
      const existing = await getActiveTripForClient(user!.id);
      if (!existing) return;
      setActiveTrip(existing);
      setOrigin({
        lat: existing.origin_lat,
        lng: existing.origin_lng,
        address: existing.origin_address ?? undefined,
      });
      setDestination({
        lat: existing.destination_lat,
        lng: existing.destination_lng,
        address: existing.destination_address ?? undefined,
      });
      setPrice(existing.price ?? null);

      if (existing.status === "PENDING") setStep("waiting");
      else if (
        existing.status === "ASSIGNED" ||
        existing.status === "ON_ROUTE" ||
        existing.status === "STARTED"
      ) {
        setStep("active");
        if (existing.driver_id) fetchDriverInfo(existing.driver_id);
      }
    }
    restoreActiveTrip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Tracking en tiempo real del conductor
  const driverLocation = useDriverLocation(
    activeTrip?.driver_id &&
    (activeTrip.status === "ASSIGNED" || activeTrip.status === "ON_ROUTE" || activeTrip.status === "STARTED")
      ? activeTrip.driver_id
      : null
  );

  // Pasar ubicación del conductor al mapa
  useEffect(() => {
    onDriverLocationChange(driverLocation);
  }, [driverLocation, onDriverLocationChange]);

  // Realtime del viaje
  useRealtimeTrips(activeTrip?.id ?? null);
  const trip = useTripStore((s) => s.activeTrip);

  // Detectar cambios de estado del viaje
  useEffect(() => {
    if (!trip) return;
    const notify = (status: string) => {
      try { notifyTripStatus(status as Parameters<typeof notifyTripStatus>[0], "CLIENT"); } catch { /* ignored */ }
    };

    if (trip.status === "ASSIGNED" && step === "waiting") {
      setStep("active");
      fetchDriverInfo(trip.driver_id!);
      notify("ASSIGNED");
    }
    if (trip.status === "ON_ROUTE" && step === "active") notify("ON_ROUTE");
    if (trip.status === "STARTED" && step === "active") notify("STARTED");
    if (trip.status === "FINISHED" && step === "active") {
      notify("FINISHED");
      setStep("rating");
    }
    if (trip.status === "CANCELLED") {
      notify("CANCELLED");
      setError("El viaje fue cancelado.");
      handleCancel();
    }
  }, [trip?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchDriverInfo(driverId: string) {
    try {
      const supabase = createClient();
      const [{ data }, { data: dp }] = await Promise.all([
        supabase.from("users").select("name, phone").eq("id", driverId).single(),
        supabase.from("driver_profiles").select("motorcycle_model, license_plate").eq("user_id", driverId).single(),
      ]);
      if (data) {
        setDriverInfo({
          name: (data as { name: string; phone: string | null }).name,
          phone: (data as { name: string; phone: string | null }).phone,
          motorcycle_model: (dp as { motorcycle_model: string; license_plate: string } | null)?.motorcycle_model ?? "",
          license_plate: (dp as { motorcycle_model: string; license_plate: string } | null)?.license_plate ?? "",
        });
      }
    } catch { /* ignorar si RLS bloquea */ }
  }

  async function handleCancel() {
    // Cancelar el viaje en DB si existe y está en estado cancelable
    if (activeTrip && (activeTrip.status === "PENDING" || activeTrip.status === "ASSIGNED")) {
      const supabase = createClient();
      await supabase
        .from("trips")
        .update({ status: "CANCELLED" })
        .eq("id", activeTrip.id);
    }
    setStep("idle");
    setOrigin(null);
    setDestination(null);
    setPrice(null);
    setDistanceKm(null);
    setDurationMin(null);
    setActiveTrip(null);
    setError(null);
    setRating(0);
    setDriverInfo(null);
    onSelectingDestinationChange(false);
    onRouteChange(undefined);
    onDriverLocationChange(null);
  }

  async function handleSetOrigin() {
    if (!location) return;
    setLoading(true);
    try {
      const address = await reverseGeocode(location.lat, location.lng);
      const newOrigin = { lat: location.lat, lng: location.lng, address };
      setOrigin(newOrigin);
      setStep("selecting_destination");

      // Se crea la función con newOrigin en el closure para evitar estado obsoleto
      const handleDestClick = async (lat: number, lng: number) => {
        onSelectingDestinationChange(false);
        setStep("calculating");
        setError(null);
        try {
          const destAddress = await reverseGeocode(lat, lng);
          const dest = { lat, lng, address: destAddress };
          setDestination(dest);
          const route = await getRoute(newOrigin, dest);
          const calculatedPrice = tariff
            ? calculateDynamicPrice(tariff, route.distanceKm, route.durationMin)
            : Math.max(2.0, 2.0 + route.distanceKm * 1.5);
          setPrice(calculatedPrice);
          setDistanceKm(route.distanceKm);
          setDurationMin(route.durationMin);
          onRouteChange(route.coordinates);
          setStep("confirming");
        } catch {
          setError("No se pudo calcular la ruta. Elige otro destino.");
          setStep("selecting_destination");
          onSelectingDestinationChange(true, handleDestClick);
        }
      };

      onSelectingDestinationChange(true, handleDestClick);
    } catch {
      setError("No se pudo obtener tu ubicación");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoToPayment() {
    if (!user) return;
    const balance = await getWalletBalance(user.id);
    setWalletBalance(balance);
    setStep("payment");
  }

  async function handleConfirmTrip(method: PaymentMethod, coupon: CouponValidation | null) {
    if (!user || !origin || !destination) return;
    try {
      setLoading(true);
      const finalPrice = coupon?.valid ? coupon.finalPrice : (price ?? undefined);
      const discount = coupon?.discount ?? 0;

      const newTrip = await createTrip(user.id, origin, destination, finalPrice);

      // Registrar cupón si se aplicó
      if (coupon?.valid && coupon.coupon) {
        await applyCoupon(coupon.coupon.id, user.id, newTrip.id, discount);
      }

      // Actualizar viaje con método de pago y precio final
      const supabase = createClient();
      await supabase.from("trips").update({
        payment_method: method,
        final_price: finalPrice,
        discount_amount: discount,
        coupon_id: coupon?.coupon?.id ?? null,
        payment_status: method === "CASH" ? "PENDING" : "PAID",
      }).eq("id", newTrip.id);

      setActiveTrip(newTrip);
      setStep("waiting");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al solicitar viaje");
      setStep("confirming");
    } finally {
      setLoading(false);
    }
  }

  async function handleRateTrip() {
    if (!activeTrip) return;
    try {
      const supabase = createClient();
      if (rating > 0) {
        await supabase.from("trips").update({ rating }).eq("id", activeTrip.id);
      }
    } finally {
      handleCancel();
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1000]">
      {/* Drag handle */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
      <div className="px-4 pb-6 pt-1 space-y-3">

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg p-2 text-center">{error}</p>
        )}

        {/* IDLE */}
        {step === "idle" && (
          <div className="space-y-3">
            <p className="text-base font-semibold">¿A dónde vas?</p>
            <Button
              className="w-full"
              onClick={handleSetOrigin}
              disabled={!location || loading}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
            </Button>
          </div>
        )}

        {/* SELECTING DESTINATION */}
        {step === "selecting_destination" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 shrink-0" />
              <p className="text-gray-600 truncate">{origin?.address}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 font-medium text-center">
              Toca el mapa para elegir tu destino
            </div>
            <Button variant="outline" className="w-full" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        )}

        {/* CALCULATING */}
        {step === "calculating" && (
          <div className="flex items-center gap-3 py-3 justify-center">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Calculando ruta...</span>
          </div>
        )}

        {/* CONFIRMING */}
        {step === "confirming" && price !== null && (
          <div className="space-y-3">
            {/* Origen → Destino */}
            <div className="space-y-1 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 shrink-0" />
                <span className="text-gray-600 line-clamp-1">{origin?.address}</span>
              </div>
              <div className="ml-[4px] w-0.5 h-3 bg-gray-200" />
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                <span className="text-gray-600 line-clamp-1">{destination?.address}</span>
              </div>
            </div>

            {/* Info del viaje */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {distanceKm !== null && <span>{distanceKm.toFixed(1)} km</span>}
                {durationMin !== null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {durationMin} min
                    </span>
                  </>
                )}
              </div>
              <span className="text-orange-500 font-bold text-xl">
                S/ {price.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleGoToPayment}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* PAYMENT */}
        {step === "payment" && price !== null && user && (
          <PaymentSelector
            tripPrice={price}
            userId={user.id}
            walletBalance={walletBalance}
            loading={loading}
            onCancel={() => setStep("confirming")}
            onConfirm={handleConfirmTrip}
          />
        )}

        {/* WAITING */}
        {step === "waiting" && activeTrip && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Buscando conductor</span>
              <Badge variant="secondary">Pendiente</Badge>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Esperando conductor disponible...</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleCancel}>
              Cancelar solicitud
            </Button>
          </div>
        )}

        {/* ACTIVE TRIP */}
        {step === "active" && (trip ?? activeTrip) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {STATUS_INFO[(trip ?? activeTrip)!.status]?.label}
              </span>
              <Badge variant={STATUS_INFO[(trip ?? activeTrip)!.status]?.color ?? "default"}>
                {(trip ?? activeTrip)!.status}
              </Badge>
            </div>

            {/* Info del conductor */}
            {driverInfo && (
              <div className="bg-orange-50 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{driverInfo.name}</p>
                    <p className="text-xs text-gray-500">
                      {driverInfo.motorcycle_model} · {driverInfo.license_plate}
                    </p>
                  </div>
                  {driverInfo.phone && (
                    <a
                      href={`tel:${driverInfo.phone}`}
                      className="flex items-center gap-1 text-orange-500 text-sm font-medium"
                    >
                      <Phone className="w-4 h-4" />
                      Llamar
                    </a>
                  )}
                </div>
              </div>
            )}

            {price && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-gray-500">Precio del viaje</span>
                <span className="font-bold text-orange-500">S/ {price.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* RATING */}
        {step === "rating" && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-base font-semibold">¡Llegaste a tu destino!</p>
              <p className="text-sm text-gray-400 mt-1">¿Cómo estuvo el servicio?</p>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Omitir
              </Button>
              <Button className="flex-1" onClick={handleRateTrip} disabled={rating === 0}>
                Enviar calificación
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
