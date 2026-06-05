"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    VANTA: any;
  }
}

export function VantaBackground({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaRef = useRef<any>(null);

  useEffect(() => {
    async function initVanta() {
      if (!ref.current || vantaRef.current) return;
      const VANTA = await import("vanta/dist/vanta.waves.min");
      vantaRef.current = VANTA.default({
        el: ref.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xf97316,
        shininess: 50,
        waveHeight: 15,
        waveSpeed: 0.75,
        zoom: 0.65,
      });
    }
    initVanta();
    return () => {
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={ref} className="min-h-screen w-full relative">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
