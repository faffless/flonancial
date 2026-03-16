"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

const accountingYearEndOptions = [
  { value: "04-05", label: "5 April (standard tax year)" },
  { value: "03-31", label: "31 March" },
  { value: "12-31", label: "31 December" },
];

function formatBusinessType(value: string | null) {
  if (value === "sole_trader") return "Sole trader (self-employment)";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return value ?? "Unknown";
}

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const businessId = Number(params.id);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [accountingYearEnd, setAccountingYearEnd] = useState("04-05");
  const [tradingName, setTradingName] = useState<string | null>(null);
  const [hmrcBusinessId, setHmrcBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    async function loadBusiness() {
      if (!Number.isFinite(businessId)) { setNotFound(true); setLoading(false); return; }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.replace("/login"); return; }

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, trading_name, business_type, accounting_year_end, hmrc_business_id, user_id")
        .eq("id", businessId)
        .eq("user_id", user.id)
        .single();

      if (businessError || !businessData) { setNotFound(true); setLoading(false); return; }

      const { count } = await supabase
        .from("quarterly_updates")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("user_id", user.id);

      setName(businessData.name ?? "");
      setBusinessType(businessData.business_type ?? null);
      setAccountingYearEnd(businessData.accounting_year_end ?? "04-05");
      setTradingName(businessData.trading_name ?? null);
      setHmrcBusinessId(businessData.hmrc_business_id ?? null);
      setSubmissionCount(count ?? 0);
      setLoading(false);
    }
    loadBusiness();
  }, [businessId, router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setMessage("Enter a business name"); return; }
    setSaving(true);
    setMessage("Saving...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setSaving(false); router.push("/login"); return; }

    const { error } = await supabase
      .from("businesses")
      .update({
        name: trimmedName,
        accounting_year_end: accountingYearEnd,
      })
      .eq("id", businessId)
      .eq("user_id", user.id);

    if (error) { setMessage(error.message); setSaving(false); return; }
    router.refresh();
    router.push("/dashboard");
  }

  async function handleDelete() {
    if (submissionCount > 0) {
      setMessage("You cannot delete a business that has quarterly submissions.");
      return;
    }
    const confirmed = window.confirm("Delete this business? This cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setMessage("Deleting...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setDeleting(false); router.push("/login"); return; }

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId)
      .eq("user_id", user.id);

    if (error) { setMessage(error.message); setDeleting(false); return; }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">
                Edit business
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#5A7896]">
                Update your business details.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-[#5A7896] underline underline-offset-4 transition hover:text-[#0F1C2E]"
            >
              Back to dashboard
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#5A7896]">Loading...</p>
          ) : notFound ? (
            <div className="mt-6 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
              <p className="text-sm text-[#0F1C2E]">Business not found.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">

              {/* Business nickname — user editable */}
              <div>
                <label htmlFor="name" className="mb-2 block text-sm text-[#0F1C2E]">
                  Business nickname
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Plumbing Business"
                  className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#5A7896] focus:border-[#2E88D0]"
                />
                <p className="mt-1.5 text-xs text-[#5A7896]">
                  This is just for your reference in Flonancial.
                </p>
              </div>

              {/* HMRC registered name — read only */}
              {tradingName ? (
                <div>
                  <label className="mb-2 block text-sm text-[#0F1C2E]">
                    Registered with HMRC as
                  </label>
                  <input
                    type="text"
                    value={tradingName}
                    disabled
                    className="w-full rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3 text-[#5A7896] outline-none cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[#5A7896]">
                    Populated from your HMRC account. Cannot be changed here.
                  </p>
                </div>
              ) : null}

              {/* Business type — read only */}
              <div>
                <label className="mb-2 block text-sm text-[#0F1C2E]">
                  Business type
                </label>
                <input
                  type="text"
                  value={formatBusinessType(businessType)}
                  disabled
                  className="w-full rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3 text-[#5A7896] outline-none cursor-not-allowed"
                />
                <p className="mt-1.5 text-xs text-[#5A7896]">
                  Business type cannot be changed after creation.
                </p>
              </div>

              {/* Accounting year end — editable with warning if submissions exist */}
              <div>
                <label htmlFor="accountingYearEnd" className="mb-2 block text-sm text-[#0F1C2E]">
                  Accounting year end
                </label>
                {hmrcBusinessId ? (
                  <>
                    <input
                      type="text"
                      value={accountingYearEndOptions.find((o) => o.value === accountingYearEnd)?.label ?? accountingYearEnd}
                      disabled
                      className="w-full rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3 text-[#5A7896] outline-none cursor-not-allowed"
                    />
                    <p className="mt-1.5 text-xs text-[#5A7896]">
                      Locked to your HMRC accounting period.
                    </p>
                  </>
                ) : (
                  <>
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
                    {submissionCount > 0 ? (
                      <p className="mt-1.5 text-xs text-amber-700">
                        You have existing submissions. Changing the accounting year end will affect how your quarters are calculated. Connect your HMRC account to confirm the correct period.
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-[#5A7896]">
                        This will be confirmed automatically when you connect your HMRC account.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* HMRC Business ID — read only, shown when available */}
              {hmrcBusinessId ? (
                <div>
                  <label className="mb-2 block text-sm text-[#0F1C2E]">
                    HMRC Business ID
                  </label>
                  <input
                    type="text"
                    value={hmrcBusinessId}
                    disabled
                    className="w-full rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3 font-mono text-sm text-[#5A7896] outline-none cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-[#5A7896]">
                    Quote this reference if you ever need to contact HMRC about this business.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-600/20 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    This business has not been matched to your HMRC account yet.{" "}
                    <a href="/api/hmrc/start" className="underline hover:opacity-75">
                      Connect HMRC
                    </a>{" "}
                    to match it automatically.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving || submissionCount > 0}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete business"}
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
                >
                  Cancel
                </Link>
              </div>

              {message ? (
                <p className="text-sm text-[#5A7896]">{message}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}