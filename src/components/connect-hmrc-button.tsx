"use client";

import { useState } from "react";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

// ── PRODUCTION TOGGLE ────────────────────────────────────────────────────────
// Set to true when HMRC production credentials are received.
// This will restore the real OAuth connection flow.
const HMRC_LIVE = true;
// ─────────────────────────────────────────────────────────────────────────────

export function ConnectHmrcButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [showNotice, setShowNotice] = useState(false);

  function handleClick() {
    if (HMRC_LIVE) {
      const fraudData = collectFraudData();
      document.cookie = `flo_fraud_data=${encodeURIComponent(JSON.stringify(fraudData))}; max-age=600; path=/; SameSite=Lax`;
      window.location.href = "/api/hmrc/start";
      return;
    }
    setShowNotice(true);
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>
      {showNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] p-6 shadow-xl">
            <h2 className="text-lg font-medium text-[#0F1C2E]">Not quite ready yet</h2>
            <p className="mt-3 text-sm leading-6 text-[#2E4A63]">
              Flonancial is awaiting HMRC production approval. We can&apos;t connect to
              HMRC or submit real tax data just yet.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#2E4A63]">
              Your account is safe — as soon as we&apos;re approved, you&apos;ll be able to
              connect and start submitting straight away.
            </p>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="mt-5 w-full rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
