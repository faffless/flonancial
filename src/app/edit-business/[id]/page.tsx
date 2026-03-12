"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const businessId = Number(params.id);

  const [name, setName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [accountingYearEnd, setAccountingYearEnd] = useState("");
  const [hmrcBusinessId, setHmrcBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    async function loadBusiness() {
      if (!Number.isFinite(businessId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(
          "id, name, trading_name, business_type, start_date, accounting_year_end, hmrc_business_id, user_id"
        )
        .eq("id", businessId)
        .eq("user_id", user.id)
        .single();

      if (businessError || !businessData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { count, error: countError } = await supabase
        .from("quarterly_updates")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("user_id", user.id);

      if (countError) {
        setMessage(countError.message);
        setLoading(false);
        return;
      }

      setName(businessData.name ?? "");
      setTradingName(businessData.trading_name ?? "");
      setBusinessType(businessData.business_type ?? "");
      setStartDate(businessData.start_date ?? "");
      setAccountingYearEnd(businessData.accounting_year_end ?? "");
      setHmrcBusinessId(businessData.hmrc_business_id ?? "");
      setUpdateCount(count ?? 0);
      setLoading(false);
    }

    loadBusiness();
  }, [businessId, router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedTradingName = tradingName.trim();
    const trimmedHmrcBusinessId = hmrcBusinessId.trim();

    if (!trimmedName) {
      setMessage("Enter a business name");
      return;
    }

    setSaving(true);
    setMessage("Saving...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        name: trimmedName,
        trading_name: trimmedTradingName || null,
        business_type: businessType || null,
        start_date: startDate || null,
        accounting_year_end: accountingYearEnd || null,
        hmrc_business_id: trimmedHmrcBusinessId || null,
      })
      .eq("id", businessId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  async function handleDelete() {
    if (updateCount > 0) {
      setMessage("You cannot delete a business that has quarterly updates");
      return;
    }

    const confirmed = window.confirm(
      "Delete this business? This cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("Deleting...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setDeleting(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", businessId)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Private tester
              </p>
              <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">
                Edit business
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Update a business saved to your account.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="text-sm text-white/70 underline underline-offset-4 transition hover:text-white"
            >
              Back to dashboard
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-white/70">Loading business...</p>
          ) : notFound ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/80">
                Business not found, or you do not have access to it.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Quarterly updates linked
                </p>
                <p className="mt-2 text-sm text-white">{updateCount}</p>
                <p className="mt-2 text-xs text-white/45">
                  A business can only be deleted when it has no quarterly updates.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="mb-2 block text-sm text-white/80">
                  Business name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cale Design Services"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                />
              </div>

              <div>
                <label htmlFor="tradingName" className="mb-2 block text-sm text-white/80">
                  Trading name
                </label>
                <input
                  id="tradingName"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="mb-2 block text-sm text-white/80">
                  Business type
                </label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
                >
                  {businessTypeOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0D1115] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="mb-2 block text-sm text-white/80">
                  Start date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
                />
              </div>

              <div>
                <label htmlFor="accountingYearEnd" className="mb-2 block text-sm text-white/80">
                  Accounting year end
                </label>
                <select
                  id="accountingYearEnd"
                  value={accountingYearEnd}
                  onChange={(e) => setAccountingYearEnd(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-white/25"
                >
                  {accountingYearEndOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#0D1115] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/45">
                  Most sole traders use 5 April. HMRC requires this to generate correct periods.
                </p>
              </div>

              <div>
                <label htmlFor="hmrcBusinessId" className="mb-2 block text-sm text-white/80">
                  HMRC business ID
                </label>
                <input
                  id="hmrcBusinessId"
                  value={hmrcBusinessId}
                  onChange={(e) => setHmrcBusinessId(e.target.value)}
                  placeholder="e.g. XBIS12345678901"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
                />
                <p className="mt-2 text-xs text-white/45">
                  For your tester setup, paste the HMRC business ID here to link this Flonancial business.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving || updateCount > 0}
                  className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete business"}
                </button>

                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Cancel
                </Link>
              </div>

              {message ? (
                <p className="text-sm text-white/70">{message}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}