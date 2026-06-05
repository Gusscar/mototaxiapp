import { createClient } from "@/lib/supabase/server";
import { Users, Car, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    { label: "Clientes", value: totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Conductores", value: totalDrivers ?? 0, icon: Car, color: "text-green-500" },
    { label: "Viajes activos", value: activeTrips ?? 0, icon: MapPin, color: "text-orange-500" },
    { label: "Total viajes", value: totalTrips ?? 0, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
