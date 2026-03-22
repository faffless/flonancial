import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/server";
import { NinoPrompt } from "@/components/nino-prompt";
import { ConnectHmrcButton } from "@/components/connect-hmrc-button";

type Business = {
  id: number;
  name: string;
  business_type: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
  created_at: string;
};

type LastSubmission = {
  business_id: number;
  submitted_at: string | null;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
};

function formatBusinessType(value: string | null) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return null;
}

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

function formatYearEnd(mmdd: string) {
  const map: Record<string, string> = {
    "04-05": "5 April",
    "03-31": "31 March",
    "12-31": "31 December",
  };
  return map[mmdd] ?? mmdd;
}

function formatTypeLabel(type: string) {
  if (type === "sole_trader") return "sole trader";
  if (type === "uk_property") return "UK property";
  if (type === "overseas_property") return "overseas property";
  return type;
}

function parseNotifications(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("nino")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasNino = Boolean(profile?.nino);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("hmrc_access_token")?.value;
  const refreshToken = cookieStore.get("hmrc_refresh_token")?.value;
  const expiresAt = Number(cookieStore.get("hmrc_token_expires_at")?.value);
  const hmrcConnected =
    !!refreshToken &&
    !!accessToken &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now();

  const { data: businessesData } = await supabase
    .from("businesses")
    .select("id, name, business_type, accounting_year_end, hmrc_business_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: submissionsData } = await supabase
    .from("quarterly_updates")
    .select("business_id, submitted_at, quarter_start, quarter_end, turnover, expenses")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  const businesses: Business[] = businessesData ?? [];
  const submissions: LastSubmission[] = submissionsData ?? [];

  const lastSubmissionMap = new Map<number, LastSubmission>();
  for (const s of submissions) {
    if (!lastSubmissionMap.has(s.business_id)) {
      lastSubmissionMap.set(s.business_id, s);
    }
  }

  const params = await searchParams;
  const rawNotifications = params.hmrc_notifications as string | undefined;
  const notifications = parseNotifications(rawNotifications);
  const businessAdded = params.business_added === "1";
  const hmrcError = params.hmrc_error as string | undefined;

  let hmrcErrorMessage = "";
  if (hmrcError === "access_denied") {
    hmrcErrorMessage = "You chose not to grant Flonancial access to your HMRC account. You can try again whenever you're ready.";
  } else if (hmrcError === "missing_code") {
    hmrcErrorMessage = "HMRC did not return an authorisation code. Please try connecting again.";
  } else if (hmrcError === "invalid_state") {
    hmrcErrorMessage = "The connection request expired or was invalid. Please try connecting again.";
  } else if (hmrcError) {
    hmrcErrorMessage = `Something went wrong connecting to HMRC (${hmrcError}). Please try again.`;
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#2E4A63]">{user.email}</p>
          </div>
          <Link href="/history" className="text-sm font-medium text-[#2E4A63] transition hover:text-[#0F1C2E]">
            Submission history
          </Link>
        </div>

        {hmrcErrorMessage ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-red-400" />
            <p className="text-sm text-red-700">{hmrcErrorMessage}</p>
          </div>
        ) : null}

        {!hasNino ? (
          <div className="mt-6">
            <NinoPrompt userId={user.id} />
          </div>
        ) : (
          <>
            {businessAdded ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-emerald-700">Business added. Connect your HMRC account to match it and fetch your obligations.</p>
              </div>
            ) : null}

            {notifications.length > 0 ? (
              <div className="mt-4 space-y-2">
                {notifications.map((n, i) => {
                  const parts = n.split(":");
                  const type = parts[0];
                  const businessName = parts[1] ?? "Your business";
                  const value = parts[2] ?? "";

                  let message = "";
                  if (type === "year_end_changed") {
                    message = `Your accounting period for "${businessName}" has been updated to match your HMRC records (${formatYearEnd(value)}). Your transaction history has been adjusted automatically.`;
                  } else if (type === "type_changed") {
                    message = `The business type for "${businessName}" has been updated to ${formatTypeLabel(value)} to match your HMRC records.`;
                  }

                  if (!message) return null;

                  return (
                    <div key={i} className="flex items-start gap-2 rounded-xl border border-blue-600/20 bg-blue-50 px-4 py-3">
                      <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                      <p className="text-sm text-blue-700">{message}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {hmrcConnected ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-emerald-700">Connected to HMRC</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  <p className="text-sm text-amber-700">Not connected to HMRC — connect your account to submit quarterly updates</p>
                </div>
                <ConnectHmrcButton className="rounded-xl bg-[#2E88D0] px-4 py-2 text-sm text-white transition hover:opacity-90">
                  Connect HMRC
                </ConnectHmrcButton>
              </div>
            )}

            {businesses.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-8 text-center">
                <p className="text-base font-medium text-[#0F1C2E]">No businesses yet</p>
                <p className="mt-2 text-sm text-[#2E4A63]">
                  Connect your HMRC account to import your businesses automatically.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <ConnectHmrcButton className="rounded-xl bg-[#2E88D0] px-5 py-3 text-sm text-white transition hover:opacity-90">
                    Connect HMRC to import your businesses
                  </ConnectHmrcButton>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-8 space-y-4">
                  {businesses.map((business) => {
                    const businessType = formatBusinessType(business.business_type);
                    const isHmrcReady = Boolean(business.hmrc_business_id);
                    const lastSub = lastSubmissionMap.get(business.id);

                    let badge = null;
                    if (hmrcConnected) {
                      if (isHmrcReady) {
                        badge = (
                          <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                            HMRC ready
                          </span>
                        );
                      } else {
                        badge = (
                          <span className="rounded-full border border-amber-600/20 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                            Not matched to HMRC
                          </span>
                        );
                      }
                    }

                    return (
                      <div key={business.id} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-medium text-[#0F1C2E]">{business.name}</h2>
                            {businessType ? <span className="text-sm text-[#2E4A63]">{businessType}</span> : null}
                            {badge}
                          </div>
                          <div className="flex items-center gap-4">
                            <Link href={`/edit-business/${business.id}`} className="text-sm text-[#2E4A63] transition hover:text-[#0F1C2E]">
                              Edit
                            </Link>
                            <Link href={`/business/${business.id}`} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-3 py-1.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                              View
                            </Link>
                          </div>
                        </div>

                        {lastSub ? (
                          <div className="mt-4 border-t border-[#B8D0EB] pt-4">
                            <p className="text-xs text-[#2E4A63]">
                              Last submission —{" "}
                              <span className="text-[#0F1C2E]">{formatDate(lastSub.quarter_start)} to {formatDate(lastSub.quarter_end)}</span>
                              {" · "}Turnover: <span className="text-[#0F1C2E]">{formatCurrency(Number(lastSub.turnover))}</span>
                              {" · "}Expenses: <span className="text-[#0F1C2E]">{formatCurrency(Number(lastSub.expenses))}</span>
                              {lastSub.submitted_at ? <> · Submitted {formatDate(lastSub.submitted_at.slice(0, 10))}</> : null}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 border-t border-[#B8D0EB] pt-4">
                            <p className="text-xs text-[#2E4A63]">No submissions yet.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {!hmrcConnected ? (
                    <ConnectHmrcButton className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                      Connect HMRC to add businesses
                    </ConnectHmrcButton>
                  ) : null}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </SiteShell>
  );
}
