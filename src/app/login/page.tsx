"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Working...");

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Account created. You can now log in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Logged in");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMessage("Signed out");
  }

  return (
    <main style={{ padding: "24px", maxWidth: "420px" }}>
      <h1>{mode === "login" ? "Log in" : "Sign up"}</h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button type="button" onClick={() => setMode("login")}>
          Log in
        </button>
        <button type="button" onClick={() => setMode("signup")}>
          Sign up
        </button>
        <button type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: "16px" }}>{message}</p>
    </main>
  );
}