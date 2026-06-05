import { createClient } from "@/lib/supabase/server";
import { TariffManager } from "@/components/admin/TariffManager";

export default async function TarifasPage() {
  const supabase = await createClient();
  const { data: tariffs } = await supabase
    .from("tariffs")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tarifas</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configura las tarifas base, precio por km y multiplicadores de hora pico.
        </p>
      </div>
      <TariffManager initialTariffs={(tariffs ?? []) as Parameters<typeof TariffManager>[0]["initialTariffs"]} />
    </div>
  );
}
