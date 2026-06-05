"use client";

import { MapView } from "@/components/maps/MapView";
import { DriverPanel } from "@/components/conductor/DriverPanel";
import { DriverHeader } from "@/components/conductor/DriverHeader";

export default function ConductorPage() {
  return (
    <div className="relative h-screen flex flex-col">
      <DriverHeader />
      <div className="flex-1 relative">
        <MapView />
        <DriverPanel />
      </div>
    </div>
  );
}
