import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>Account</h1>
      <p>Logged in</p>
      <p>{data.user.email}</p>
    </main>
  );
}