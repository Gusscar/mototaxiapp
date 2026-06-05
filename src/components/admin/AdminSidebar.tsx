"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Car, Map, TrendingUp, Tag, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/services/auth";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/conductores", label: "Conductores", icon: Car },
  { href: "/admin/viajes", label: "Viajes", icon: Map },
  { href: "/admin/tarifas", label: "Tarifas", icon: TrendingUp },
  { href: "/admin/cupones", label: "Cupones", icon: Tag },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex w-64 bg-white border-r min-h-screen flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-orange-500">🏍️ MotoTaxi</h1>
          <p className="text-xs text-gray-400 mt-0.5">Panel de administración</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── TOP BAR (móvil) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-base font-bold text-orange-500">🏍️ MotoTaxi Admin</h1>
        <button
          onClick={handleSignOut}
          className="text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ── BOTTOM NAV (móvil) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                pathname === href
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
