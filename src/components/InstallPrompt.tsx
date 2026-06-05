"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalada
    if (isInStandaloneMode()) return;

    // No mostrar si el usuario ya la descartó recientemente
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      // En iOS mostramos instrucciones manuales después de 3 segundos
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: escuchar el evento nativo
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleDismiss() {
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
    setShowPrompt(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Modal bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl shadow-2xl p-6 pb-10"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              {/* Ícono app */}
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <span className="text-3xl">🏍️</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Instalar MotoTaxi</h2>
                <p className="text-sm text-gray-500">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </div>

            {/* Beneficios */}
            <ul className="space-y-2 mb-6">
              {[
                "Abre al instante, sin navegador",
                "Funciona sin conexión",
                "Notificaciones en tiempo real",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* iOS: instrucciones manuales */}
            {isIOSDevice ? (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-orange-800">Para instalar en iPhone:</p>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <span>1. Toca</span>
                  <Share className="w-4 h-4 shrink-0" />
                  <span>en Safari</span>
                </div>
                <p className="text-sm text-orange-700">
                  2. Selecciona <strong>"Agregar a pantalla de inicio"</strong>
                </p>
                <Button variant="outline" className="w-full mt-2" onClick={handleDismiss}>
                  Entendido
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleDismiss}>
                  Ahora no
                </Button>
                <Button className="flex-1" onClick={handleInstall}>
                  <Download className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
