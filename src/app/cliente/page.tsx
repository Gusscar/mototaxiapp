"use client";

import { useState, useCallback } from "react";
import { MapView } from "@/components/maps/MapView";
import { TripRequestPanel } from "@/components/viajes/TripRequestPanel";
import { ClientHeader } from "@/components/cliente/ClientHeader";

export default function ClientePage() {
  const [selectingDestination, setSelectingDestination] = useState(false);
  const [destinationCallback, setDestinationCallback] = useState<
    ((lat: number, lng: number) => void) | undefined
  >(undefined);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | undefined>(undefined);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSelectingDestinationChange = useCallback(
    (selecting: boolean, onSelect?: (lat: number, lng: number) => void) => {
      setSelectingDestination(selecting);
      setDestinationCallback(selecting && onSelect ? () => onSelect : undefined);
    },
    []
  );

  return (
    <div className="relative h-screen flex flex-col">
      <ClientHeader />
      <div className="flex-1 relative">
        <MapView
          selectingDestination={selectingDestination}
          onDestinationSelect={destinationCallback}
          routeCoords={routeCoords}
          driverLocation={driverLocation}
        />
        {selectingDestination && (
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-3 text-sm text-orange-600 font-medium text-center pointer-events-none">
            Toca el mapa para elegir tu destino
          </div>
        )}
        <TripRequestPanel
          onSelectingDestinationChange={handleSelectingDestinationChange}
          onRouteChange={setRouteCoords}
          onDriverLocationChange={setDriverLocation}
        />
      </div>
    </div>
  );
}
