import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get or create anonymous session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Read the uploaded file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const businessName = formData.get("businessName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file content
    const fileText = await file.text();
    const fileName = file.name.toLowerCase();

    // For XLSX we need different handling — for now accept CSV and TSV
    // XLSX support can be added later with the xlsx package
    if (!fileName.endsWith(".csv") && !fileName.endsWith(".tsv") && !fileName.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Please upload a CSV file. Excel support coming soon." },
        { status: 400 }
      );
    }

    // Truncate if massive — Claude has context limits
    const truncated = fileText.length > 50000 ? fileText.slice(0, 50000) + "\n[truncated]" : fileText;

    // Call Claude API to parse the file
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `You are a UK tax data extraction assistant. I am going to give you the raw contents of a spreadsheet or CSV file belonging to a UK sole trader or landlord. Your job is to extract every financial transaction from it.

For each transaction, extract:
- date: in YYYY-MM-DD format. If only a month/year is given, use the last day of that month. If no year is given, assume the most recent plausible tax year (April 2025 - April 2026).
- amount: a positive number, no currency symbols, 2 decimal places
- type: either "income" or "expense". Use context clues — payments received, invoices, sales, rent received = income. Purchases, costs, subscriptions, utilities, supplies = expense. If genuinely unclear, default to "expense".
- description: a short clean description, max 100 characters. Use the original description if available, clean it up if messy.

Rules:
- Skip header rows, total rows, blank rows, or anything that is not a transaction
- Skip rows with zero or negative amounts
- Skip rows that are clearly balance carried forward or opening balance entries
- If a row has a credit and debit column, a value in credit = income, a value in debit = expense
- Return ONLY a valid JSON object with no markdown, no explanation, no preamble
- The JSON must have this exact structure:
{
  "transactions": [
    { "date": "2025-06-15", "amount": 1250.00, "type": "income", "description": "Invoice - web design" },
    { "date": "2025-06-20", "amount": 45.00, "type": "expense", "description": "Office supplies" }
  ],
  "summary": "Brief 1-2 sentence summary of what this file appears to contain"
}

Here is the file contents:

${truncated}`,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content
      ?.filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("") ?? "";

    // Parse the JSON response
    let parsed: { transactions: { date: string; amount: number; type: "income" | "expense"; description: string }[]; summary: string };
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("Failed to parse Claude response:", rawText);
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
    }

    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return NextResponse.json({ error: "No transactions found in file" }, { status: 400 });
    }

    // Filter out any malformed transactions
    const validTransactions = parsed.transactions.filter(
      (t) =>
        t.date &&
        typeof t.amount === "number" &&
        t.amount > 0 &&
        (t.type === "income" || t.type === "expense") &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.date)
    );

    if (validTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions could be found in your file. Please check the format." },
        { status: 400 }
      );
    }

    // Find or create demo business for this user
    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let businessId: number;

    if (existingBusiness) {
      businessId = existingBusiness.id;
      // Update name if provided
      if (businessName?.trim()) {
        await supabase
          .from("businesses")
          .update({ name: businessName.trim() })
          .eq("id", existingBusiness.id)
          .eq("user_id", user.id);
      }
    } else {
      const { data: newBusiness, error: insertError } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: businessName?.trim() || "My Business",
          business_type: "sole_trader",
          accounting_year_end: "04-05",
        })
        .select("id")
        .single();

      if (insertError || !newBusiness) {
        return NextResponse.json({ error: "Could not create demo business" }, { status: 500 });
      }
      businessId = newBusiness.id;
    }

    // Delete any existing transactions for this business (fresh upload replaces all)
    await supabase
      .from("transactions")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", user.id);

    // Insert all valid transactions
    const toInsert = validTransactions.map((t) => ({
      user_id: user.id,
      business_id: businessId,
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description || null,
    }));

    const { error: txInsertError } = await supabase
      .from("transactions")
      .insert(toInsert);

    if (txInsertError) {
      return NextResponse.json({ error: txInsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactionCount: validTransactions.length,
      summary: parsed.summary,
      businessId,
    });

  } catch (err) {
    console.error("Parse route error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}