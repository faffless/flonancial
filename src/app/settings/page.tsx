"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

function formatNinoDisplay(raw: string): string {
  if (!raw) return "";
  return `${raw.slice(0, 2)} ${raw.slice(2, 4)} ${raw.slice(4, 6)} ${raw.slice(6, 8)} ${raw.slice(8)}`;
}

function formatNinoInput(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

function isValidNino(nino: string): boolean {
  return /^[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/.test(nino);
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [nino, setNino] = useState("");
  const [userId, setUserId] = useState("");

  // Change email
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailWorking, setEmailWorking] = useState(false);

  // Change password
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordWorking, setPasswordWorking] = useState(false);

  // Change NINO
  const [editingNino, setEditingNino] = useState(false);
  const [newNino, setNewNino] = useState("");
  const [ninoMessage, setNinoMessage] = useState("");
  const [ninoWorking, setNinoWorking] = useState(false);

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Download
  const [downloading, setDownloading] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.replace("/login"); return; }

      setEmail(user.email ?? "");
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("nino")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.nino) {
        setNino(profile.nino);
      }

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  // ── Change email ──────────────────────────────────────────────────────────

  async function handleChangeEmail() {
    if (!newEmail.trim()) { setEmailMessage("Please enter a new email address"); return; }
    setEmailWorking(true);
    setEmailMessage("");

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      setEmailMessage(error.message);
      setEmailWorking(false);
      return;
    }

    setEmailMessage("Confirmation email sent to your new address. Please check your inbox and confirm to complete the change.");
    setEmailWorking(false);
    setEditingEmail(false);
    setNewEmail("");
  }

  // ── Change password ───────────────────────────────────────────────────────

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) { setPasswordMessage("Please fill in both fields"); return; }
    if (newPassword.length < 6) { setPasswordMessage("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage("Passwords don't match"); return; }

    setPasswordWorking(true);
    setPasswordMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage(error.message);
      setPasswordWorking(false);
      return;
    }

    setPasswordMessage("Password updated.");
    setPasswordWorking(false);
    setEditingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  }

  // ── Change NINO ───────────────────────────────────────────────────────────

  async function handleChangeNino() {
    const formatted = formatNinoInput(newNino);
    if (!isValidNino(formatted)) {
      setNinoMessage("Please enter a valid National Insurance number (e.g. QQ 12 34 56 C)");
      return;
    }

    setNinoWorking(true);
    setNinoMessage("");

    if (nino) {
      // Update existing
      const { error } = await supabase
        .from("user_profiles")
        .update({ nino: formatted })
        .eq("user_id", userId);

      if (error) {
        setNinoMessage("Failed to update. Please try again.");
        setNinoWorking(false);
        return;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from("user_profiles")
        .insert({ user_id: userId, nino: formatted });

      if (error) {
        setNinoMessage("Failed to save. Please try again.");
        setNinoWorking(false);
        return;
      }
    }

    setNino(formatted);
    setNinoMessage("National Insurance number updated. You may need to reconnect to HMRC if your businesses don't load.");
    setNinoWorking(false);
    setEditingNino(false);
    setNewNino("");
  }

  // ── Download data ─────────────────────────────────────────────────────────

  async function handleDownloadData() {
    setDownloading(true);
    setMessage("");

    try {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, name, business_type, hmrc_business_id, accounting_year_end, created_at")
        .eq("user_id", userId);

      const { data: submissions } = await supabase
        .from("submission_history")
        .select("period_key, quarter_start, quarter_end, turnover, expenses, other_income, tax_year, action, submitted_at, hmrc_correlation_id, business_id")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false });

      const exportData = {
        exported_at: new Date().toISOString(),
        email,
        businesses: businesses ?? [],
        submission_history: submissions ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flonancial-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Data downloaded.");
    } catch {
      setMessage("Failed to download data. Please try again.");
    }

    setDownloading(false);
  }

  // ── Delete account ────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    setDeleting(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setMessage("Failed to delete account. Please contact hello@flonancial.co.uk for assistance.");
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SiteShell>
        <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
          <p className="text-sm text-[#2E4A63]">Loading...</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">

        <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Settings</h1>

        {/* ── Account info ────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <h2 className="text-base font-medium text-[#0F1C2E]">Your account</h2>

          <div className="mt-4 space-y-3">

            {/* Email */}
            <div className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#2E4A63]">Email</p>
                  <p className="mt-0.5 text-sm text-[#0F1C2E]">{email}</p>
                </div>
                {!editingEmail ? (
                  <button type="button" onClick={() => { setEditingEmail(true); setEmailMessage(""); }} className="text-xs text-[#2E88D0] hover:opacity-75">Change</button>
                ) : null}
              </div>
              {editingEmail ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor="new-email" className="sr-only">New email address</label>
                  <input
                    id="new-email"
                    type="email"
                    placeholder="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#B8D0EB] px-3 py-2 text-sm text-[#0F1C2E] outline-none focus:border-[#2E88D0]"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleChangeEmail} disabled={emailWorking} className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-60">
                      {emailWorking ? "Sending..." : "Update email"}
                    </button>
                    <button type="button" onClick={() => { setEditingEmail(false); setNewEmail(""); setEmailMessage(""); }} className="rounded-lg border border-[#B8D0EB] px-3 py-1.5 text-xs text-[#2E4A63] hover:bg-[#DEE9F8]">Cancel</button>
                  </div>
                </div>
              ) : null}
              {emailMessage ? <p className="mt-2 text-xs text-[#2E4A63]">{emailMessage}</p> : null}
            </div>

            {/* Password */}
            <div className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#2E4A63]">Password</p>
                  <p className="mt-0.5 text-sm text-[#0F1C2E]">••••••••</p>
                </div>
                {!editingPassword ? (
                  <button type="button" onClick={() => { setEditingPassword(true); setPasswordMessage(""); }} className="text-xs text-[#2E88D0] hover:opacity-75">Change</button>
                ) : null}
              </div>
              {editingPassword ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor="new-password" className="sr-only">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#B8D0EB] px-3 py-2 text-sm text-[#0F1C2E] outline-none focus:border-[#2E88D0]"
                  />
                  <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#B8D0EB] px-3 py-2 text-sm text-[#0F1C2E] outline-none focus:border-[#2E88D0]"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleChangePassword} disabled={passwordWorking} className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-60">
                      {passwordWorking ? "Updating..." : "Update password"}
                    </button>
                    <button type="button" onClick={() => { setEditingPassword(false); setNewPassword(""); setConfirmPassword(""); setPasswordMessage(""); }} className="rounded-lg border border-[#B8D0EB] px-3 py-1.5 text-xs text-[#2E4A63] hover:bg-[#DEE9F8]">Cancel</button>
                  </div>
                </div>
              ) : null}
              {passwordMessage ? <p className="mt-2 text-xs text-[#2E4A63]">{passwordMessage}</p> : null}
            </div>

            {/* NINO */}
            <div className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#2E4A63]">National Insurance number</p>
                  <p className="mt-0.5 text-sm font-mono text-[#0F1C2E]">{nino ? formatNinoDisplay(nino) : "Not set"}</p>
                </div>
                {!editingNino ? (
                  <button type="button" onClick={() => { setEditingNino(true); setNinoMessage(""); }} className="text-xs text-[#2E88D0] hover:opacity-75">Change</button>
                ) : null}
              </div>
              {editingNino ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor="new-nino" className="sr-only">National Insurance number</label>
                  <input
                    id="new-nino"
                    type="text"
                    placeholder="QQ 12 34 56 C"
                    autoComplete="off"
                    value={newNino}
                    onChange={(e) => setNewNino(e.target.value)}
                    className="w-full rounded-lg border border-[#B8D0EB] px-3 py-2 text-sm text-[#0F1C2E] outline-none focus:border-[#2E88D0]"
                  />
                  <p className="text-[11px] text-[#2E4A63]">Your NINO must match the Government Gateway account you connect to HMRC with. If you change it, you may need to reconnect to HMRC.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleChangeNino} disabled={ninoWorking} className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-60">
                      {ninoWorking ? "Saving..." : "Update NINO"}
                    </button>
                    <button type="button" onClick={() => { setEditingNino(false); setNewNino(""); setNinoMessage(""); }} className="rounded-lg border border-[#B8D0EB] px-3 py-1.5 text-xs text-[#2E4A63] hover:bg-[#DEE9F8]">Cancel</button>
                  </div>
                </div>
              ) : null}
              {ninoMessage ? <p className="mt-2 text-xs text-[#2E4A63]">{ninoMessage}</p> : null}
            </div>

          </div>
        </div>

        {/* ── Download data ───────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <h2 className="text-base font-medium text-[#0F1C2E]">Download your data</h2>
          <p className="mt-2 text-sm text-[#2E4A63]">
            Download a copy of your businesses and submission history as a JSON file. This includes all figures submitted to HMRC, dates, and correlation IDs.
          </p>
          <button
            type="button"
            onClick={handleDownloadData}
            disabled={downloading}
            className="mt-4 rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {downloading ? "Downloading..." : "Download my data"}
          </button>
        </div>

        {/* ── Delete account ──────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
          <h2 className="text-base font-medium text-red-900">Delete your account</h2>
          <p className="mt-2 text-sm text-red-700">
            This permanently deletes your Flonancial account, all business records, and submission history. Figures already submitted to HMRC are not affected — HMRC retains their own copy.
          </p>
          <p className="mt-2 text-sm text-red-700">
            We recommend downloading your data first so you have a record of your submissions.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-100"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-red-300 bg-white p-4">
              <p className="text-sm font-medium text-red-900">Are you sure? This cannot be undone.</p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Yes, delete everything"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[#2E4A63]">{message}</p>
        ) : null}

      </section>
    </SiteShell>
  );
}
