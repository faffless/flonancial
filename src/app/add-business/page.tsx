"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AddBusinessPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving...");

    const supabase = createClient();

    const { error } = await supabase.from("businesses").insert({
      name,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Saved");
    setName("");
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>Add business</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "12px", maxWidth: "400px" }}
      >
        <input
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit">Save</button>
      </form>

      <p>{message}</p>
    </main>
  );
}