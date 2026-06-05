"use client";

import dynamic from "next/dynamic";
import type { MapViewInnerProps } from "./MapViewInner";

const MapViewInner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando mapa...</p>
    </div>
  ),
});

export function MapView(props: MapViewInnerProps) {
  return (
    <div className="absolute inset-0">
      <MapViewInner {...props} />
    </div>
  );
}
