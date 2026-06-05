import { createClient } from "@/lib/supabase/server";
import { Users, Car, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/PageTransition";

export async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalDrivers },
    { count: activeTrips },
    { count: totalTrips },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "DRIVER"),
    supabase.from("trips").select("*", { count: "exact", head: true }).not("status", "in", '("FINISHED","CANCELLED")'),
    supabase.from("trips").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Clientes", value: totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Conductores", value: totalDrivers ?? 0, icon: Car, color: "text-green-500", bg: "bg-green-50" },
    { label: "Viajes activos", value: activeTrips ?? 0, icon: MapPin, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Total viajes", value: totalTrips ?? 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <FadeIn>
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </FadeIn>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <FadeIn key={label} delay={i * 0.08}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
