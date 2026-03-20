"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function formatNino(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

function isValidNino(nino: string): boolean {
  const formatted = formatNino(nino);
  return /^[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/.test(formatted);
}

export function NinoPrompt({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [nino, setNino] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nino.trim()) {
      setMessage("Please enter your National Insurance number");
      return;
    }

    const formatted = formatNino(nino);
    if (!isValidNino(formatted)) {
      setMessage("Please enter a valid National Insurance number (e.g. QQ 12 34 56 C)");
      return;
    }

    setWorking(true);
    setMessage("Saving...");

    const { error } = await supabase
      .from("user_profiles")
      .insert({ user_id: userId, nino: formatted });

    if (error) {
      setMessage("Failed to save — please try again. If this keeps happening, contact support.");
      setWorking(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
      <h2 className="text-lg font-medium text-[#0F1C2E]">Before you connect to HMRC</h2>
      <p className="mt-2 text-sm text-[#3B5A78]">
        HMRC requires your National Insurance number to link your tax account.
        You can find it on your payslip, P60, or in your{" "}
        <a
          href="https://www.gov.uk/personal-tax-account"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Personal Tax Account
        </a>
        .
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="nino" className="mb-2 block text-sm text-[#0F1C2E]">
            National Insurance number
          </label>
          <input
            id="nino"
            type="text"
            autoComplete="off"
            placeholder="QQ 12 34 56 C"
            value={nino}
            onChange={(e) => setNino(e.target.value)}
            className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]"
          />
        </div>
        <button
          type="submit"
          disabled={working}
          className="rounded-xl bg-[#2E88D0] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {working ? "Saving..." : "Save"}
        </button>
      </form>

      {message ? (
        <p className="mt-3 text-sm text-[#3B5A78]">{message}</p>
      ) : null}
    </div>
  );
}
