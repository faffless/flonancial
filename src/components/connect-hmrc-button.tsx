"use client";

import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

export function ConnectHmrcButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  function handleClick() {
    const fraudData = collectFraudData();
    document.cookie = `flo_fraud_data=${encodeURIComponent(JSON.stringify(fraudData))}; max-age=600; path=/; SameSite=Lax`;
    window.location.href = "/api/hmrc/start";
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
