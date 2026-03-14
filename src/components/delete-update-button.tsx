"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function DeleteUpdateButton({ updateId }: { updateId: number }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [working, setWorking] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this draft quarterly update?");
    if (!confirmed) return;
    setWorking(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setWorking(false); router.push("/login"); return; }

    const { error } = await supabase
      .from("quarterly_updates").delete()
      .eq("id", updateId).eq("user_id", user.id).eq("status", "draft");

    setWorking(false);
    if (error) { window.alert(error.message); return; }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={working}
      className="text-sm text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {working ? "Deleting..." : "Delete"}
    </button>
  );
}