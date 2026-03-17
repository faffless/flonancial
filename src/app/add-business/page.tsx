"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

const businessTypeOptions = [
  { value: "", label: "Select business type" },
  { value: "sole_trader", label: "Sole trader (self-employment)" },
  { value: "uk_property", label: "UK property" },
  { value: "overseas_property", label: "Overseas property" },
];

const accountingYearEndOptions = [
  { value: "04-05", label: "5 April (standard tax year)" },
  { value: "03-31", label: "31 March" },
  { value: "12-31", label: "31 December" },
];

export default function AddBusinessPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [accountingYearEnd, setAccountingYearEnd] = useState("04-05");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) { setMessage("Enter a business name"); return; }
    if (!businessType) { setMessage("Select a business type"); return; }

    setSaving(true);
    setMessage("Saving...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage("You need to log in");
      setSaving(false);
      router.push("/login");
      return;
    }

    // Enforce one UK property business rule
    if (businessType === "uk_property") {
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_type", "uk_property")
        .maybeSingle();

      if (existing) {
        setMessage("You can only have one UK property business under MTD. All UK property income must be grouped into a single business.");
        setSaving(false);
        return;
      }
    }

    // Enforce one overseas property business rule
    if (businessType === "overseas_property") {
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_type", "overseas_property")
        .maybeSingle();

      if (existing) {
        setMessage("You can only have one overseas property business under MTD. All overseas property income must be grouped into a single business.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("businesses").insert({
      name: trimmedName,
      business_type: businessType,
      accounting_year_end: accountingYearEnd,
      user_id: user.id,
    });

    if (error) { setMessage(error.message); setSaving(false); return; }

    router.refresh();
    router.push("/dashboard?business_added=1");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">
                Add business
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#3B5A78]">
                Add a business to start keeping records. Make sure you have registered this business for MTD with HMRC first — once you connect your HMRC account, Flonancial will confirm and match the details automatically.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-[#3B5A78] underline underline-offset-4 transition hover:text-[#0F1C2E]"
            >
              Back to dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-[#0F1C2E]">
                Business nickname
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Plumbing Business"
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]"
              />
              <p className="mt-1.5 text-xs text-[#3B5A78]">
                This is just for your reference in Flonancial. It does not need to match your official business name.
              </p>
            </div>

            <div>
              <label htmlFor="businessType" className="mb-2 block text-sm text-[#0F1C2E]">
                Business type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
              >
                {businessTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {businessType === "uk_property" || businessType === "overseas_property" ? (
                <p className="mt-1.5 text-xs text-[#3B5A78]">
                  Under MTD, all {businessType === "uk_property" ? "UK" : "overseas"} property income must be grouped into a single business.
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="accountingYearEnd" className="mb-2 block text-sm text-[#0F1C2E]">
                Accounting year end
              </label>
              <select
                id="accountingYearEnd"
                value={accountingYearEnd}
                onChange={(e) => setAccountingYearEnd(e.target.value)}
                className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
              >
                {accountingYearEndOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[#3B5A78]">
                Most sole traders use 5 April. This will be confirmed automatically when you connect your HMRC account.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save business"}
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
              >
                Cancel
              </Link>
            </div>

            {message ? (
              <p className="text-sm text-[#3B5A78]">{message}</p>
            ) : null}
          </form>
        </div>
      </section>
    </SiteShell>
  );
}