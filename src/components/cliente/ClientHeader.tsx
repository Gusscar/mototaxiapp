"use client";

import Link from "next/link";
import { LogOut, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function ClientHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-10">
      <div>
        <h1 className="text-xl font-bold text-orange-500">MotoTaxi</h1>
        {user && (
          <p className="text-xs text-gray-400">Hola, {user.name.split(" ")[0]}</p>
        )}
      </div>
      <div className="flex gap-1">
        <Link href="/cliente/historial">
          <Button variant="ghost" size="icon" title="Mis viajes">
            <History className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/cliente/perfil">
          <Button variant="ghost" size="icon" title="Mi perfil">
            <User className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Cerrar sesión">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
