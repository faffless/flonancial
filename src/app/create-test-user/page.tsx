"use client";

import { useState } from "react";

type TestUserResult = {
  userId?: string;
  password?: string;
  nino?: string;
  mtdItId?: string;
  saUtr?: string;
  [key: string]: unknown;
};

export default function CreateTestUserPage() {
  const [result, setResult] = useState<TestUserResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [bizLoading, setBizLoading] = useState(false);
  const [bizResult, setBizResult] = useState<unknown>(null);
  const [bizError, setBizError] = useState("");

  async function handleCreate() {
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/hmrc/create-test-user", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(JSON.stringify(data, null, 2));
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  async function handleAddBusiness(typeOfBusiness: string) {
    setBizLoading(true);
    setBizError("");
    setBizResult(null);

    const res = await fetch("/api/hmrc/create-test-business", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeOfBusiness }),
    });

    const data = await res.json();

    if (!res.ok) {
      setBizError(JSON.stringify(data, null, 2));
    } else {
      setBizResult(data);
    }
    setBizLoading(false);
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Create HMRC Sandbox Test User</h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#3B5A78" }}>
        Creates a new sandbox individual with MTD Income Tax, Self Assessment and NI enrolments. HMRC sandbox auto-stubs business data.
      </p>
      <button
        onClick={handleCreate}
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
        {loading ? "Creating..." : "Create Test User"}
      </button>

      {error ? (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ color: "red" }}>Error</h2>
          <pre style={{ background: "#fee", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap" }}>
            {error}
          </pre>
        </div>
      ) : null}

      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #B8D0EB", borderRadius: "6px", background: "#EAF2FB" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Add a Business to the logged-in user&apos;s NINO</h2>
        <p style={{ fontSize: "0.85rem", color: "#3B5A78", marginBottom: "0.75rem" }}>
          Requires: you are logged in to Flonancial, your NINO is set in /settings, and you&apos;ve clicked Connect HMRC (so we have an access token).
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleAddBusiness("uk-property")}
            disabled={bizLoading}
            style={{ background: "#2E88D0", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: bizLoading ? "not-allowed" : "pointer" }}
          >
            {bizLoading ? "Adding..." : "Add UK Property"}
          </button>
          <button
            onClick={() => handleAddBusiness("self-employment")}
            disabled={bizLoading}
            style={{ background: "#556C85", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: bizLoading ? "not-allowed" : "pointer" }}
          >
            {bizLoading ? "Adding..." : "Add another Self-Employment"}
          </button>
        </div>
        {bizError ? (
          <pre style={{ background: "#fee", padding: "0.75rem", borderRadius: "4px", marginTop: "0.75rem", whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>{bizError}</pre>
        ) : null}
        {bizResult ? (
          <pre style={{ background: "#e8f4e8", padding: "0.75rem", borderRadius: "4px", marginTop: "0.75rem", whiteSpace: "pre-wrap", fontSize: "0.75rem" }}>{JSON.stringify(bizResult, null, 2)}</pre>
        ) : null}
        <p style={{ fontSize: "0.8rem", color: "#3B5A78", marginTop: "0.75rem" }}>
          After success, go back to /dashboard and click <strong>Connect HMRC</strong> again — Flonancial will re-sync your business list and pick up the new business.
        </p>
      </div>

      {result ? (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>✅ New Test User Created</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <tbody>
              {[
                ["User ID", result.userId],
                ["Password", result.password],
                ["NINO", result.nino],
                ["MTD IT ID", result.mtdItId],
                ["SA UTR", result.saUtr],
              ].map(([label, value]) => (
                <tr key={label as string} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold", width: "40%" }}>{label as string}</td>
                  <td style={{ padding: "0.75rem" }}>{(value as string) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>Full response</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
