import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { DeleteUpdateButton } from "@/components/delete-update-button";
import { createClient } from "@/utils/supabase/server";

type Business = {
  id: number;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  start_date: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
  created_at: string;
};

type QuarterlyUpdate = {
  id: number;
  business_id: number;
  user_id: string;
  period_key: string | null;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  status: "draft" | "submitted";
  submitted_at: string | null;
  created_at: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBusinessType(value: string | null) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  return null;
}

function getCurrentTaxYear(accountingYearEnd: string | null): {
  label: string;
  start: Date;
  end: Date;
} {
  const yearEnd = accountingYearEnd ?? "04-05";
  const parts = yearEnd.split("-").map(Number);
  const endMonth = parts[0];
  const endDay = parts[1];

  if (
    !Number.isFinite(endMonth) ||
    !Number.isFinite(endDay) ||
    endMonth < 1 ||
    endMonth > 12 ||
    endDay < 1 ||
    endDay > 31
  ) {
    const now = new Date();
    const aprilEnd =
      now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() <= 5)
        ? new Date(now.getFullYear(), 3, 5)
        : new Date(now.getFullYear() + 1, 3, 5);
    const aprilStart = new Date(aprilEnd.getFullYear() - 1, 3, 6);
    return {
      label: `${aprilStart.getFullYear()}–${String(aprilEnd.getFullYear()).slice(2)}`,
      start: aprilStart,
      end: aprilEnd,
    };
  }

  const now = new Date();
  const yearEndThisYear = new Date(now.getFullYear(), endMonth - 1, endDay);
  const taxYearEndDate =
    now <= yearEndThisYear
      ? yearEndThisYear
      : new Date(now.getFullYear() + 1, endMonth - 1, endDay);
  const taxYearStartDate = new Date(taxYearEndDate);
  taxYearStartDate.setFullYear(taxYearStartDate.getFullYear() - 1);
  taxYearStartDate.setDate(taxYearStartDate.getDate() + 1);

  return {
    label: `${taxYearStartDate.getFullYear()}–${String(taxYearEndDate.getFullYear()).slice(2)}`,
    start: taxYearStartDate,
    end: taxYearEndDate,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: businessesData } = await supabase
    .from("businesses")
    .select("id, name, trading_name, business_type, start_date, accounting_year_end, hmrc_business_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: updatesData } = await supabase
    .from("quarterly_updates")
    .select("id, business_id, user_id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at, created_at")
    .eq("user_id", user.id)
    .order("quarter_start", { ascending: false });

  const businesses: Business[] = businessesData ?? [];
  const updates: QuarterlyUpdate[] = updatesData ?? [];

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#5A7896]">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/add-business"
              className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90"
            >
              Add business
            </Link>
            <Link
              href="/account"
              className="rounded-xl border border-[#B8D0EB] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
            >
              Account
            </Link>
          </div>
        </div>

        {/* No businesses state */}
        {businesses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-8 text-center">
            <p className="text-base font-medium text-[#0F1C2E]">No businesses yet</p>
            <p className="mt-2 text-sm text-[#5A7896]">Add your first business to get started with MTD submissions.</p>
            <div className="mt-6">
              <Link href="/add-business" className="rounded-xl bg-[#2E88D0] px-5 py-3 text-sm text-white transition hover:opacity-90">
                Add business
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {businesses.map((business) => {
              const taxYear = getCurrentTaxYear(business.accounting_year_end);
              const businessUpdates = updates.filter((u) => u.business_id === business.id);
              const thisYearUpdates = businessUpdates.filter((u) => {
                const qs = new Date(`${u.quarter_start}T00:00:00`);
                return qs >= taxYear.start && qs <= taxYear.end;
              });
              const submittedCount = thisYearUpdates.filter((u) => u.status === "submitted").length;
              const isHmrcLinked = Boolean(business.hmrc_business_id);
              const businessType = formatBusinessType(business.business_type);

              return (
                <div key={business.id} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5]">

                  {/* Business header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-medium text-[#0F1C2E]">{business.name}</h2>
                      {businessType ? (
                        <span className="text-sm text-[#5A7896]">{businessType}</span>
                      ) : null}
                      {isHmrcLinked ? (
                        <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                          HMRC linked
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-600/20 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                          Not linked to HMRC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-[#5A7896]">
                        {taxYear.label} · <span className="text-emerald-700">{submittedCount} of 4 submitted</span>
                      </p>
                      <Link href={`/edit-business/${business.id}`} className="text-sm text-[#5A7896] transition hover:text-[#0F1C2E]">
                        Edit
                      </Link>
                      <Link
                        href={`/add-update?businessId=${business.id}`}
                        className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-3 py-1.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]"
                      >
                        + Add update
                      </Link>
                    </div>
                  </div>

                  {/* Updates for this business */}
                  {businessUpdates.length > 0 ? (
                    <div className="border-t border-[#B8D0EB] px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="mt-4 space-y-3">
                        {businessUpdates.map((update) => (
                          <div key={update.id} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[#0F1C2E]">
                                  {formatDate(update.quarter_start)} to {formatDate(update.quarter_end)}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-[#5A7896]">
                                  <span>Turnover: <span className="text-[#0F1C2E]">{formatCurrency(Number(update.turnover))}</span></span>
                                  <span>Expenses: <span className="text-[#0F1C2E]">{formatCurrency(Number(update.expenses))}</span></span>
                                </div>
                                {update.submitted_at ? (
                                  <p className="mt-1 text-xs text-[#5A7896]">
                                    Submitted {formatDate(update.submitted_at.slice(0, 10))}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <span className={`rounded-full border px-3 py-1 text-xs ${
                                  update.status === "submitted"
                                    ? "border-emerald-600/20 bg-emerald-50 text-emerald-700"
                                    : "border-amber-600/20 bg-amber-50 text-amber-700"
                                }`}>
                                  {update.status === "submitted" ? "Submitted" : "Draft"}
                                </span>

                                {update.status === "draft" ? (
                                  <>
                                    <Link href={`/edit-update/${update.id}`} className="text-sm text-[#5A7896] transition hover:text-[#0F1C2E]">
                                      Edit
                                    </Link>
                                    {isHmrcLinked ? (
                                      <Link href={`/hmrc-submit?updateId=${update.id}`} className="text-sm font-medium text-[#2E88D0] transition hover:opacity-75">
                                        Submit to HMRC
                                      </Link>
                                    ) : null}
                                    <DeleteUpdateButton updateId={update.id} />
                                  </>
                                ) : isHmrcLinked ? (
                                  <Link href={`/hmrc-submit?updateId=${update.id}`} className="text-sm text-[#5A7896] transition hover:text-[#0F1C2E]">
                                    Amend
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-[#B8D0EB] p-5 sm:p-6">
                      <p className="text-sm text-[#5A7896]">No quarterly updates yet for this business.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
