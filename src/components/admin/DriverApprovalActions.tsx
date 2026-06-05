"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DriverApprovalActionsProps {
  driverProfileId: string;
  isApproved: boolean;
}

export function DriverApprovalActions({ driverProfileId, isApproved }: DriverApprovalActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("driver_profiles")
      .update({ is_approved: !isApproved })
      .eq("id", driverProfileId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={isApproved ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {loading ? "..." : isApproved ? "Suspender" : "Aprobar"}
    </Button>
  );
}
