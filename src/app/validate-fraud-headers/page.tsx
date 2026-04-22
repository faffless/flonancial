"use client";

import { useState } from "react";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

type ValidateResponse = {
  status: number;
  correlationId: string | null;
  headersSent: Record<string, string>;
  report: unknown;
};

export default function ValidateFraudHeadersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState("");

  async function handleValidate() {
    setLoading(true);
    setError("");
    setResult(null);

    const fraudData = collectFraudData();

    const res = await fetch("/api/hmrc/validate-fraud-headers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fraudData }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(JSON.stringify(data, null, 2));
    } else {
      setResult(data as ValidateResponse);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Validate HMRC Fraud Prevention Headers</h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#3B5A78" }}>
        Sends the exact same fraud headers your real submissions send to HMRC&apos;s
        <strong> Test Fraud Prevention Headers</strong> validator. Report this back to SDST as evidence.
      </p>

      <button
        onClick={handleValidate}
        disabled={loading}
        style={{
          background: "#2E88D0",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "1rem",
        }}
      >
        {loading ? "Validating..." : "Validate Headers"}
      </button>

      {error ? (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ color: "red" }}>Error</h2>
          <pre style={{ background: "#fee", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {error}
          </pre>
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>HTTP {result.status}</h2>
          {result.correlationId ? (
            <p style={{ fontSize: "0.85rem", color: "#3B5A78" }}>
              x-correlationid: <strong>{result.correlationId}</strong>
            </p>
          ) : null}

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", fontSize: "1rem" }}>Validator report</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(result.report, null, 2)}
          </pre>

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", fontSize: "1rem" }}>Headers sent</h3>
          <pre style={{ background: "#eef4fb", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>
            {JSON.stringify(result.headersSent, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
