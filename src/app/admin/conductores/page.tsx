import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverApprovalActions } from "@/components/admin/DriverApprovalActions";

export default async function ConductoresPage() {
  const supabase = await createClient();
  const { data: drivers } = await supabase
    .from("driver_profiles")
    .select(`
      *,
      users (name, email, phone)
    `)
    .order("user_id");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Conductores</h2>
      <div className="grid gap-4">
        {drivers?.map((driver) => {
          const user = driver.users as { name: string; email: string; phone: string | null } | null;
          return (
            <Card key={driver.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user?.name ?? "Sin nombre"}</p>
                      <Badge variant={driver.is_approved ? "success" : "warning"}>
                        {driver.is_approved ? "Aprobado" : "Pendiente"}
                      </Badge>
                      {driver.is_online && (
                        <Badge variant="default">En línea</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm text-gray-600">
                      {driver.motorcycle_model} · {driver.license_plate}
                    </p>
                    <p className="text-xs text-gray-400">
                      Licencia: {driver.license_number}
                    </p>
                  </div>
                  <DriverApprovalActions
                    driverProfileId={driver.id}
                    isApproved={driver.is_approved}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!drivers || drivers.length === 0) && (
          <p className="text-gray-500 text-sm">No hay conductores registrados.</p>
        )}
      </div>
    </div>
  );
}
