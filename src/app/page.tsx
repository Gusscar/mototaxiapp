import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as unknown as { data: { role: string } | null };

  if (!profile) {
    redirect("/auth/login");
  }

  switch (profile.role) {
    case "ADMIN":
      redirect("/admin");
    case "DRIVER":
      redirect("/conductor");
    case "CLIENT":
    default:
      redirect("/cliente");
  }
}
