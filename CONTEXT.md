# Flonancial — Project Context

## What it is
Flonancial (flonancial.co.uk) — free MTD Income Tax bridging software for UK sole traders and landlords. Reads turnover + expenses from user's spreadsheet, submits cumulative quarterly updates to HMRC. Goal: get listed on HMRC's Software Choices page.

## Tech stack
- **Framework:** Next.js 16.1.6 with Turbopack, App Router, `src/` directory
- **Hosting:** Vercel (US East iad1)
- **Database:** Supabase (Postgres with RLS)
- **Auth:** Supabase email/password auth
- **HMRC Integration:** OAuth 2.0 + REST APIs (sandbox complete, awaiting production credentials)
- **Styling:** Tailwind CSS

## HMRC Application
- Application ID: `949ec4c8-fb66-42f5-8a0b-d4c414792799`
- Sandbox testing complete (20 March 2026)
- Email sent to SDSTeam@hmrc.gov.uk requesting Production Approvals Checklist
- Awaiting response (expect 2-4 weeks)

## HMRC APIs Used
- Business Details (MTD) v2.0 — List All Businesses, Retrieve Business Details
- Obligations (MTD) v3.0 — Retrieve Income & Expenditure Obligations
- Self Employment Business (MTD) v5.0 — Create/Amend + Retrieve Cumulative Period Summary
- Property Business (MTD) v6.0 — Create/Amend + Retrieve UK Property Cumulative Period Summary

## Fraud Prevention Headers
- 13 of 16 headers implemented and validated via Test Fraud Prevention Headers API
- 3 missing (HMRC notified 14 March 2026):
  - Gov-Client-Public-Port (Vercel limitation)
  - Gov-Client-Multi-Factor (no MFA)
  - Gov-Vendor-License-IDs (web app, no licenses)
- Browser fraud data collected via `collectFraudData()` in `utils/hmrc/collect-fraud-data.ts`
- GET routes: fraud data sent as `X-Fraud-Data` base64 header
- PUT routes: fraud data sent in POST body as `fraudData`
- OAuth callback: fraud data stored in `flo_fraud_data` cookie (10 min TTL)

## Database Tables (Supabase)
- `user_profiles` — user_id, nino (RLS: select, insert, update, delete by own user_id)
- `businesses` — user_id, name, business_type, hmrc_business_id, accounting_year_end, address fields
- `quarterly_updates` — user_id, business_id, quarter_start, quarter_end, turnover, expenses, other_income, status, submitted_at, hmrc_correlation_id
- `submission_history` — user_id, business_id, period_key, quarter_start, quarter_end, turnover, expenses, other_income, tax_year, action, submitted_at, hmrc_correlation_id

## Key Files

### API Routes (all in `src/app/api/`)
- `hmrc/obligations/route.ts` — GET obligations from HMRC
- `hmrc/submit-quarterly/route.ts` — PUT cumulative submission to HMRC
- `hmrc/submit-business/route.ts` — PUT property business submission
- `hmrc/retrieve-cumulative/route.ts` — GET what HMRC holds
- `hmrc/callback/route.ts` — OAuth callback, syncs businesses to DB
- `hmrc/submit-update/[id]/route.ts` — Dead code, kept but unused
- `hmrc/start/route.ts` — Redirects to HMRC OAuth
- `hmrc/create-test-user/route.ts` — Creates sandbox test users
- `hmrc/test-headers/route.ts` — Validates fraud headers against HMRC Test API
- `auth/signout/route.ts` — Signs out user
- `auth/delete-account/route.ts` — Server-side account deletion (uses admin client)

### Utils
- `utils/hmrc/server.ts` — Token management, `getNinoForUser()`, `getValidHmrcAccessToken()`
- `utils/hmrc/fraud-prevention.ts` — `buildFraudPreventionHeaders()`, `parseFraudDataFromHeader()`, `parseFraudDataFromCookie()`
- `utils/hmrc/collect-fraud-data.ts` — Client-side fraud data collection
- `utils/supabase/server.ts` — Server-side Supabase client
- `utils/supabase/client.ts` — Client-side Supabase client

### Pages (all in `src/app/`)
- `page.tsx` — Landing page with spreadsheet upload, cell picker, preview flow
- `login/page.tsx` — Login
- `signup/page.tsx` — Signup with `emailRedirectTo` to dashboard
- `dashboard/page.tsx` — Shows NINO prompt if missing, businesses list, connect HMRC button
- `business/[id]/page.tsx` — Quarter cards, upload & submit, submission history, HMRC held data
- `preview/page.tsx` — Preview dashboard for unauthenticated users
- `settings/page.tsx` — Email/password/NINO change, download data, delete account
- `privacy/page.tsx` — Privacy policy
- `terms/page.tsx` — Terms and conditions
- `about/page.tsx` — About page
- `disclaimer/page.tsx` — Disclaimer

### Components
- `components/site-header.tsx` — Main header with countdown, business info, auth links
- `components/site-shell.tsx` — Page wrapper with header + footer
- `components/spreadsheet-upload.tsx` — Upload, cell picker, confirmation with checkbox
- `components/nino-prompt.tsx` — NINO entry prompt on dashboard
- `components/connect-hmrc-button.tsx` — Collects fraud data, stores in cookie, redirects to HMRC OAuth

## Environment Variables
### Required on Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HMRC_CLIENT_ID`
- `HMRC_CLIENT_SECRET`
- `HMRC_REDIRECT_URI` — `https://flonancial.co.uk/api/hmrc/callback`
- `NEXT_PUBLIC_SITE_URL` — `https://flonancial.co.uk`
- `VENDOR_PUBLIC_IP` — Vercel's public IP

### Sandbox only (can be deleted for production):
- `HMRC_TEST_NINO` — No longer read by any code

## Important Notes
- `Gov-Test-Scenario: BUSINESS_AND_PROPERTY` header in callback — MUST remove before production
- HMRC API base URL hardcoded as `test-api.service.hmrc.gov.uk` — must find-and-replace to `api.service.hmrc.gov.uk` for production
- NINO stored as plain text in Supabase — encryption at rest recommended
- Supabase Site URL set to `https://flonancial.co.uk`
- Email confirmation redirects to `/dashboard` via `emailRedirectTo` option

## Outstanding Work (Priority Order)

### Blocking for Production Approval:
1. Accessibility audit (WCAG AA) — run Lighthouse, fix issues
2. ~~Cookie banner~~ — NOT NEEDED. All cookies are strictly necessary (Supabase auth, HMRC OAuth tokens, fraud prevention). No consent required under UK PECR. Privacy policy already lists all cookies with purposes.
3. Terms and conditions page content — HMRC checks this URL
4. Breach notification procedure — written document for HMRC checklist
5. Penetration testing — OWASP ZAP basic scan
6. Remove `Gov-Test-Scenario: BUSINESS_AND_PROPERTY` from callback
7. Switch API base URL to production when credentials received

### Important but not blocking:
8. NINO encryption at rest (pgcrypto)
9. OAuth denial handling (`?error=access_denied` in callback)
10. Token expiry — "Reconnect to HMRC" prompt when refresh token dies
11. Error handling — map HMRC error codes to human-readable messages
12. Cumulative figure validation — warn if turnover goes down between quarters
13. Mobile testing of entire flow
14. Add MFA via Supabase TOTP (removes one missing fraud header)

### Nice to have:
15. Landing page design refinements
16. Downloadable submission receipt (PDF)
17. Tax year rollover edge case (6 April)
18. Negative turnover/expenses server-side rejection
