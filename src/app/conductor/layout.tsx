import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConductorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as unknown as { data: { role: string } | null };

  if (profile?.role !== "DRIVER") redirect("/");

  return <div className="min-h-screen bg-background">{children}</div>;
}
