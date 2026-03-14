const { error: saveError } = await supabase
  .from("quarterly_updates")
  .update({ status: "submitted", submitted_at: submittedAt })
  .eq("id", update.id)
  .eq("user_id", user.id);

if (saveError) {
  const response = NextResponse.json(
    { error: "hmrc_submission_succeeded_but_local_save_failed" },
    { status: 500 }
  );
  return applyHmrcCookieMutations(response, hmrcResult.cookieMutations);
}

// Send confirmation email — fire and forget, don't block the response
if (user.email) {
  sendSubmissionConfirmation({
    toEmail: user.email,
    businessName: business.name,
    quarterStart: update.quarter_start,
    quarterEnd: update.quarter_end,
    turnover: Number(update.turnover),
    expenses: Number(update.expenses),
    taxYear,
    submittedAt,
  }).catch(() => {
    // Email failed silently — submission still succeeded
  });
}