import { create } from "zustand";
import type { Trip, Location } from "@/types/trip";

interface TripState {
  activeTrip: Trip | null;
  origin: Location | null;
  destination: Location | null;
  setActiveTrip: (trip: Trip | null) => void;
  setOrigin: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  origin: null,
  destination: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setOrigin: (location) => set({ origin: location }),
  setDestination: (destination) => set({ destination }),
}));
