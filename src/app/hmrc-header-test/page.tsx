"use client";
import { useState } from "react";

export default function HmrcHeaderTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    setResult(null);

    // Get device ID from cookie
    const deviceId = document.cookie
      .split("; ")
      .find((c) => c.startsWith("flo_device_id="))
      ?.split("=")[1] ?? "unknown";

    const clientData = {
      browserJSUserAgent: navigator.userAgent,
      deviceId,
      screens: `width=${screen.width}&height=${screen.height}&scaling-factor=${window.devicePixelRatio}&colour-depth=${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      windowSize: `width=${window.innerWidth}&height=${window.innerHeight}`,
    };

    const res = await fetch("/api/hmrc/test-headers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>HMRC Fraud Prevention Header Test</h1>
      <button
        onClick={runTest}
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
        {loading ? "Testing..." : "Run Validation"}
      </button>

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>HMRC Response (HTTP {result.status})</h2>
          <pre style={{
            background: "#f4f4f4",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.8rem",
            whiteSpace: "pre-wrap",
          }}>
            {JSON.stringify(result.hmrc_response, null, 2)}
          </pre>

          <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>Headers Sent</h2>
          <pre style={{
            background: "#f4f4f4",
            padding: "1rem",
            borderRadius: "6px",
            overflow: "auto",
            fontSize: "0.8rem",
            whiteSpace: "pre-wrap",
          }}>
            {JSON.stringify(result.headers_sent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}