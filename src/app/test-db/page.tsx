import { createClient } from "@/utils/supabase/server";

export default async function TestDbPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("businesses").select();

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}