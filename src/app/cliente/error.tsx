"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ClienteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cliente page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-5xl mb-4">🏍️</div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">Algo salió mal</h2>
      <p className="text-sm text-gray-500 mb-6">
        Hubo un error al cargar la página. Intenta de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
