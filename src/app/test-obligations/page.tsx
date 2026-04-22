"use client";

import { useState } from "react";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

type TestResponse = {
  requestUrl: string;
  scenarioHeader: string;
  status: number;
  correlationId: string | null;
  body: unknown;
};

type Preset = {
  label: string;
  typeOfBusiness: "uk-property" | "self-employment" | "foreign-property";
  businessId: string;
  scenario: string;
};

const PRESETS: Preset[] = [
  { label: "UK Property — OPEN", typeOfBusiness: "uk-property", businessId: "XPIS12345678903", scenario: "OPEN" },
  { label: "UK Property — FULFILLED", typeOfBusiness: "uk-property", businessId: "XPIS12345678903", scenario: "FULFILLED" },
  { label: "Self-Employment — OPEN", typeOfBusiness: "self-employment", businessId: "XBIS12345678901", scenario: "OPEN" },
];

export default function TestObligationsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResponse | null>(null);
  const [error, setError] = useState("");

  async function handleRun(preset: Preset) {
    setLoading(true);
    setError("");
    setResult(null);

    const fraudData = collectFraudData();

    const res = await fetch("/api/hmrc/test-obligations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        fraudData,
        typeOfBusiness: preset.typeOfBusiness,
        businessId: preset.businessId,
        scenario: preset.scenario,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(JSON.stringify(data, null, 2));
    } else {
      setResult(data as TestResponse);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Obligations v3 — Gov-Test-Scenario probes</h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#3B5A78" }}>
        Calls the Obligations v3 endpoint with HMRC&apos;s documented sandbox test business IDs and the
        <strong> Gov-Test-Scenario</strong> header to capture canned 200 responses for the UK Property branch.
      </p>
      <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#3B5A78" }}>
        Requires: logged in, NINO set, HMRC connected.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleRun(preset)}
            disabled={loading}
            style={{
              background: "#2E88D0",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Running..." : preset.label}
          </button>
        ))}
      </div>

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
            <p style={{ fontSize: "0.9rem", color: "#3B5A78" }}>
              x-correlationid: <strong>{result.correlationId}</strong>
            </p>
          ) : null}
          <p style={{ fontSize: "0.85rem", color: "#3B5A78" }}>
            Gov-Test-Scenario: <strong>{result.scenarioHeader}</strong>
          </p>
          <p style={{ fontSize: "0.75rem", color: "#3B5A78", wordBreak: "break-all" }}>
            URL: {result.requestUrl}
          </p>

          <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem", fontSize: "1rem" }}>Response body</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
