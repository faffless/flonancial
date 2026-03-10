"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Business = {
  id: number;
  name: string;
};

export default function AddUpdatePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [quarterStart, setQuarterStart] = useState("");
  const [quarterEnd, setQuarterEnd] = useState("");
  const [turnover, setTurnover] = useState("");
  const [expenses, setExpenses] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadBusinesses() {
      const supabase = createClient();
      const { data, error } = await supabase.from("businesses").select("id, name");

      if (error) {
        setMessage(error.message);
        return;
      }

      setBusinesses(data || []);

      if (data && data.length > 0) {
        setBusinessId(String(data[0].id));
      }
    }

    loadBusinesses();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving...");

    const supabase = createClient();

    const { error } = await supabase.from("quarterly_updates").insert({
      business_id: Number(businessId),
      quarter_start: quarterStart,
      quarter_end: quarterEnd,
      turnover: Number(turnover),
      expenses: Number(expenses),
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Saved");
    setQuarterStart("");
    setQuarterEnd("");
    setTurnover("");
    setExpenses("");
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>Add update</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px", maxWidth: "400px" }}>
        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={quarterStart}
          onChange={(e) => setQuarterStart(e.target.value)}
        />

        <input
          type="date"
          value={quarterEnd}
          onChange={(e) => setQuarterEnd(e.target.value)}
        />

        <input
          type="number"
          placeholder="Turnover"
          value={turnover}
          onChange={(e) => setTurnover(e.target.value)}
        />

        <input
          type="number"
          placeholder="Expenses"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
        />

        <button type="submit">Save</button>
      </form>

      <p>{message}</p>
    </main>
  );
}