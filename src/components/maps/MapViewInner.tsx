"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/hooks/useLocation";
import { useTripStore } from "@/store/tripStore";

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeColorIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

const originIcon = makeColorIcon("green");
const destinationIcon = makeColorIcon("red");
const driverIcon = makeColorIcon("orange");

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function RecenterOnce({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      map.setView([lat, lng], 15);
      done.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [points, map]);
  return null;
}

export interface MapViewInnerProps {
  selectingDestination?: boolean;
  onDestinationSelect?: (lat: number, lng: number) => void;
  routeCoords?: [number, number][];
  driverLocation?: { lat: number; lng: number } | null;
}

export default function MapViewInner({
  selectingDestination = false,
  onDestinationSelect,
  routeCoords,
  driverLocation,
}: MapViewInnerProps) {
  const { location } = useLocation();
  const { origin, destination } = useTripStore();

  return (
    <MapContainer
      center={[-12.0464, -77.0428]}
      zoom={15}
      className="w-full h-full"
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {location && (
        <>
          <RecenterOnce lat={location.lat} lng={location.lng} />
          <Marker position={[location.lat, location.lng]}>
            <Popup>Tu ubicación</Popup>
          </Marker>
        </>
      )}

      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>Origen</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Destino</Popup>
        </Marker>
      )}

      {driverLocation && (
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
          <Popup>Tu conductor</Popup>
        </Marker>
      )}

      {routeCoords && routeCoords.length > 1 && (
        <Polyline positions={routeCoords} color="#f97316" weight={4} />
      )}

      {!routeCoords && origin && destination && (
        <Polyline
          positions={[
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ]}
          color="#f97316"
          dashArray="8"
          weight={3}
        />
      )}

      {/* Encuadrar mapa para mostrar conductor + ruta */}
      {driverLocation && routeCoords && routeCoords.length > 1 && (
        <FitBounds points={[
          [driverLocation.lat, driverLocation.lng],
          ...routeCoords.slice(0, 1),
          ...routeCoords.slice(-1),
        ]} />
      )}

      {selectingDestination && onDestinationSelect && (
        <MapClickHandler onMapClick={onDestinationSelect} />
      )}
    </MapContainer>
  );
}
