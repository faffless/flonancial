"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

type SA = "yes" | "no" | "not_sure";
type Exempt = "yes" | "no" | "not_sure";

const THRESHOLD_2026 = 50000;
const THRESHOLD_2027 = 30000;
const THRESHOLD_2028 = 20000;

function parseMoney(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomePage() {
  const [selfEmploymentIncome, setSelfEmploymentIncome] = useState("");
  const [propertyIncome, setPropertyIncome] = useState("");
  const [sa, setSa] = useState<SA | null>(null);
  const [exempt, setExempt] = useState<Exempt | null>(null);

  const selfEmployment = parseMoney(selfEmploymentIncome);
  const property = parseMoney(propertyIncome);
  const total = selfEmployment + property;

  const result = useMemo(() => {
    const noAnswers =
      selfEmploymentIncome === "" &&
      propertyIncome === "" &&
      !sa &&
      !exempt;

    if (noAnswers) {
      return {
        label: "Start answering the questions",
        summary:
          "Enter your gross self-employment and property income to get an immediate indication.",
        bullets: [
          "Use gross income before expenses and before tax.",
          "No login needed for the checker.",
          "Informational only — not tax advice.",
        ],
      };
    }

    if (exempt === "yes") {
      return {
        label: "You may be exempt",
        summary:
          "You may not need to use Making Tax Digital for Income Tax if an HMRC exemption applies.",
        bullets: [
          "Check HMRC’s exemption rules.",
          "Do not rely on the income result alone if you think you may be exempt.",
          "You may still need to deal with Self Assessment in the usual way.",
        ],
      };
    }

    if (total === 0) {
      return {
        label: "Not currently in scope",
        summary:
          "Based on the figures entered, this checker does not show qualifying self-employment or property income.",
        bullets: [
          "Use gross self-employment income and gross property income only.",
          "Re-check if your income sources change.",
          "Use your latest tax-year figures for the best result.",
        ],
      };
    }

    if (total > THRESHOLD_2026) {
      return {
        label: "In scope from 6 April 2026",
        summary: `Your qualifying income is ${formatGBP(
          total
        )}. Based on current published thresholds, that puts you into Making Tax Digital for Income Tax from 6 April 2026.`,
        bullets: [
          "You’ll need digital records.",
          "You’ll need compatible software.",
          "You’ll need to send updates through the year and complete the year-end process digitally.",
        ],
      };
    }

    if (total > THRESHOLD_2027) {
      return {
        label: "In scope from 6 April 2027",
        summary: `Your qualifying income is ${formatGBP(
          total
        )}. You are below the 2026 entry threshold, but above the published threshold for 6 April 2027.`,
        bullets: [
          "You are below £50,000.",
          "You are above £30,000.",
          "This is a good time to get your records and software ready.",
        ],
      };
    }

    if (total > THRESHOLD_2028) {
      return {
        label: "In scope from 6 April 2028",
        summary: `Your qualifying income is ${formatGBP(
          total
        )}. You are below the first two thresholds, but above the published threshold for 6 April 2028.`,
        bullets: [
          "You are below £30,000.",
          "You are above £20,000.",
          "Keep an eye on HMRC updates and start preparing early.",
        ],
      };
    }

    return {
      label: "Not currently in scope on published thresholds",
      summary: `Your qualifying income is ${formatGBP(
        total
      )}. Based on current published thresholds, you are below the announced mandatory entry points.`,
      bullets: [
        "You are at or below £20,000.",
        "Keep records tidy in case your income increases.",
        "Re-check after each tax year.",
      ],
    };
  }, [selfEmploymentIncome, propertyIncome, sa, exempt, total]);

  const practicalNote =
    sa === "no"
      ? "You may still need to register for Self Assessment depending on your circumstances."
      : sa === "not_sure"
      ? "Check whether you already file Self Assessment, because your latest return may help you confirm the right figures."
      : "Use your latest submitted Self Assessment figures where possible.";

  return (
    <main className="min-h-screen text-white">
      <SiteHeader
        navItems={[
          { href: "/about", label: "About" },
          { href: "/mtd-guide", label: "MTD Guide" },
          { href: "/tax-news", label: "UK Tax News" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/login", label: "Login" },
        ]}
      />

      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              MTD quick check
            </p>

            <h1 className="mx-auto mt-4 max-w-4xl text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.05em] text-white sm:text-[2.9rem] lg:text-[3.5rem]">
              Making Tax Digital<br />Does it apply to you?
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
              A simple UK checker for self-employment and property income,<br /> with
              a practical path toward MTD-ready record keeping.
            </p>

            <div className="mt-7 flex justify-center">
              <a
                href="#checker"
                className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                Start the check
              </a>
            </div>

            <div className="mt-5 text-center text-sm text-white/55">
              Takes about 30 seconds
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ValueCard
            title="Check your likely position"
            text="Get a quick indication based on gross self-employment and property income."
          />
          <ValueCard
            title="Understand what changes next"
            text="See the likely timing and what MTD may require in practice."
          />
          <ValueCard
            title="Move toward digital readiness"
            text="Use Flonancial as a simple early step toward compatible record keeping."
          />
        </div>

        <div
          id="checker"
          className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.03] p-4 sm:p-5"
        >
          <div className="border-b border-white/10 pb-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Checker
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-white">
              Start with your gross income figures
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/65">
              This gives you a practical first view before you think about
              software, record keeping, or later MTD steps.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <QuestionCard title="1. Gross self-employment income">
              <MoneyInput
                id="self-employment-income"
                value={selfEmploymentIncome}
                onChange={setSelfEmploymentIncome}
                placeholder="e.g. 42000"
                hint="Use gross income before expenses and before tax."
              />
            </QuestionCard>

            <QuestionCard title="2. Gross property income">
              <MoneyInput
                id="property-income"
                value={propertyIncome}
                onChange={setPropertyIncome}
                placeholder="e.g. 12000"
                hint="Enter your share of gross property income before expenses."
              />
            </QuestionCard>

            <QuestionCard title="3. Do you currently file a Self Assessment tax return?">
              <OptionGrid<SA>
                value={sa}
                onChange={setSa}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "not_sure", label: "Not sure" },
                ]}
              />
              <p className="mt-2 text-xs leading-5 text-white/45">
                This does not change the threshold, but it helps with the next
                practical step.
              </p>
            </QuestionCard>

            <QuestionCard title="4. Do you think you may be exempt?">
              <OptionGrid<Exempt>
                value={exempt}
                onChange={setExempt}
                options={[
                  { value: "no", label: "No" },
                  { value: "yes", label: "Yes" },
                  { value: "not_sure", label: "Not sure" },
                ]}
              />
              <p className="mt-2 text-xs leading-5 text-white/45">
                Some people may qualify for exemption in specific circumstances.
              </p>
            </QuestionCard>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Live result
                </p>

                <h3 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-white">
                  {result.label}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/72">
                  {result.summary}
                </p>
              </div>

              <div className="min-w-[180px] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/75">
                <div>Qualifying income</div>
                <div className="mt-2 text-2xl text-white">{formatGBP(total)}</div>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-white/82">
              {result.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {(sa || selfEmploymentIncome || propertyIncome) && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Practical note
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  {practicalNote}
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/45">
          Informational only — not tax advice. Always check current HMRC
          guidance.
        </p>
      </section>

      <footer className="mt-10 border-t border-white/10">
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flonancial</p>

            <div className="flex flex-wrap gap-6">
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>

              <Link href="/about" className="hover:text-white">
                About
              </Link>

              <Link href="/disclaimer" className="hover:text-white">
                Disclaimer
              </Link>

              <a href="mailto:hello@flonancial.co.uk" className="hover:text-white">
                hello@flonancial.co.uk
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ValueCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className="text-base font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
    </div>
  );
}

function QuestionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="px-4 py-3 text-center">
        <div className="text-base font-medium text-white">{title}</div>
      </div>

      <div className="border-t border-white/10 px-4 py-3">{children}</div>
    </div>
  );
}

function OptionGrid<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((o) => {
        const active = value === o.value;

        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              active
                ? "border-sky-400 bg-sky-400 text-black"
                : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {id}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
          £
        </span>

        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-8 pr-4 text-white outline-none transition placeholder:text-white/25 focus:border-white/25"
        />
      </div>

      <p className="mt-2 text-center text-xs leading-5 text-white/45">{hint}</p>
    </div>
  );
}