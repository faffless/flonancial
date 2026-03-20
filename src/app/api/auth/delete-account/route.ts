import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const userId = user.id;

  // Delete user data in dependency order
  await supabase.from("submission_history").delete().eq("user_id", userId);
  await supabase.from("quarterly_updates").delete().eq("user_id", userId);
  await supabase.from("businesses").delete().eq("user_id", userId);
  await supabase.from("user_profiles").delete().eq("user_id", userId);

  // Delete auth user via admin client
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json({ error: "failed_to_delete_auth_user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
