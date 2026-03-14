"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

const businessTypeOptions = [
  { value: "", label: "Select business type" },
  { value: "sole_trader", label: "Sole trader" },
  { value: "uk_property", label: "UK property" },
  { value: "overseas_property", label: "Overseas property" },
  { value: "other", label: "Other" },
];

const accountingYearEndOptions = [
  { value: "", label: "Select accounting year end" },
  { value: "04-05", label: "5 April (standard tax year)" },
  { value: "03-31", label: "31 March" },
  { value: "12-31", label: "31 December" },
  { value: "other", label: "Other" },
];

export default function AddBusinessPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [accountingYearEnd, setAccountingYearEnd] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedTradingName = tradingName.trim();

    if (!trimmedName) { setMessage("Enter a business name"); return; }

    setSaving(true);
    setMessage("Saving...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You need to log in");
      setSaving(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("businesses").insert({
      name: trimmedName,
      trading_name: trimmedTradingName || null,
      business_type: businessType || null,
      start_date: startDate || null,
      accounting_year_end: accountingYearEnd || null,
      user_id: user.id,
    });

    if (error) { setMessage(error.message); setSaving(false); return; }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Add business</h1>
              <p className="mt-3 text-sm leading-6 text-[#5A7896]">Create a business record before adding quarterly updates.</p>
            </div>
            <Link href="/dashboard" className="text-sm text-[#5A7896] underline underline-offset-4 transition hover:text-[#0F1C2E]">
              Back to dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-[#0F1C2E]">Business name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cale Design Services"
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#5A7896] focus:border-[#2E88D0]"
              />
            </div>

            <div>
              <label htmlFor="tradingName" className="mb-2 block text-sm text-[#0F1C2E]">Trading name</label>
              <input
                id="tradingName"
                value={tradingName}
                onChange={(e) => setTradingName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#5A7896] focus:border-[#2E88D0]"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="mb-2 block text-sm text-[#0F1C2E]">Business type</label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
              >
                {businessTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="mb-2 block text-sm text-[#0F1C2E]">Start date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
              />
            </div>

            <div>
              <label htmlFor="accountingYearEnd" className="mb-2 block text-sm text-[#0F1C2E]">Accounting year end</label>
              <select
                id="accountingYearEnd"
                value={accountingYearEnd}
                onChange={(e) => setAccountingYearEnd(e.target.value)}
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
              >
                {accountingYearEndOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#5A7896]">Most sole traders use 5 April. HMRC requires this to generate correct periods.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save business"}
              </button>
              <Link href="/dashboard" className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                Cancel
              </Link>
            </div>

            {message ? <p className="text-sm text-[#5A7896]">{message}</p> : null}
          </form>
        </div>
      </section>
    </SiteShell>
  );
}