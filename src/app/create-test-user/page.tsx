"use client";

import { useState } from "react";

export default function CreateTestUserPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Create HMRC Sandbox Test User</h1>
      <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#3B5A78" }}>
        Creates a new sandbox individual with MTD Income Tax enrolled, including both sole trader and UK property businesses.
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

      {result ? (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>✅ New Test User Created</h2>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <tbody>
              {[
                ["User ID", result.userId],
                ["Password", result.password],
                ["NINO", result.nino],
                ["Individual ID", result.individualId],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold", width: "40%" }}>{label}</td>
                  <td style={{ padding: "0.75rem" }}>{value ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>Businesses</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(result.mtdItSaDetails ?? result, null, 2)}
          </pre>

          <div style={{ marginTop: "2rem", background: "#e8f4e8", padding: "1rem", borderRadius: "6px" }}>
            <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Next step:</p>
            <p>Copy the NINO above and set it in your <code>.env.local</code> file:</p>
            <pre style={{ background: "#fff", padding: "0.75rem", borderRadius: "4px", marginTop: "0.5rem" }}>
              HMRC_TEST_NINO={result.nino}
            </pre>
            <p style={{ marginTop: "0.5rem" }}>Then restart your dev server and connect HMRC using the new user ID and password.</p>
          </div>

          <h3 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>Full response</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "0.8rem" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}