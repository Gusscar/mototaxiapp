import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const roleLabel: Record<string, string> = {
    CLIENT: "Cliente",
    DRIVER: "Conductor",
    ADMIN: "Admin",
  };

  const roleVariant: Record<string, "default" | "secondary" | "success"> = {
    CLIENT: "secondary",
    DRIVER: "default",
    ADMIN: "success",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Usuarios</h2>
      <div className="grid gap-3">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={roleVariant[user.role] ?? "secondary"}>
                      {roleLabel[user.role] ?? user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-gray-400">{user.phone}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString("es-PE")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!users || users.length === 0) && (
          <p className="text-gray-500 text-sm">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
