import { SiteShell } from "@/components/site-shell";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Privacy policy</h1>
          <p className="mt-2 text-sm text-[#2E4A63]">Last updated: 20 March 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-[#2E4A63]">

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Who we are</h2>
              <p className="mt-3">Flonancial is operated by Flonancial Ltd, a company registered in England and Wales. Company number: 17090724. Registered office: 104 Finborough Road, London, SW10 9ED.</p>
              <p className="mt-3">Flonancial is bridging software for Making Tax Digital. We help sole traders and landlords submit their quarterly updates to HMRC. You can contact us at <a href="mailto:hello@flonancial.co.uk" className="text-[#2E88D0] hover:opacity-75">hello@flonancial.co.uk</a>.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">How Flonancial works</h2>
              <p className="mt-3">When you upload a spreadsheet to Flonancial, the file is parsed entirely in your web browser using client-side JavaScript. Your spreadsheet file is never transmitted to our servers, never stored by us, and is discarded from browser memory once you navigate away or close the page.</p>
              <p className="mt-3">Flonancial reads two numbers from your spreadsheet — your turnover and your expenses — and displays them for you to review before submission. Only the summary figures you choose to submit are sent to HMRC and stored by us.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">What data we collect and store</h2>
              <p className="mt-3">When you use Flonancial, we collect and store:</p>
              <ul className="mt-3 space-y-2">
                <li>— Your email address, used to create and manage your account</li>
                <li>— Your National Insurance number (NINO), stored in our database and used in API calls to HMRC to identify your tax account</li>
                <li>— Business details retrieved from HMRC after you connect your account, including business name, type, address, and HMRC business ID</li>
                <li>— Quarterly submission records: the turnover, expenses, and other business income figures submitted to HMRC, along with the submission date, tax year, quarter period, and HMRC correlation ID</li>
                <li>— HMRC OAuth tokens, stored securely in encrypted httpOnly cookies to enable submissions on your behalf</li>
                <li>— A device identifier (UUID stored in a persistent browser cookie) used for HMRC fraud prevention headers</li>
              </ul>
              <p className="mt-3 font-medium text-[#0F1C2E]">We do not collect or store:</p>
              <ul className="mt-3 space-y-2">
                <li>— Your spreadsheet files or any data within them beyond the summary figures you submit</li>
                <li>— Individual transaction records (dates, descriptions, amounts)</li>
                <li>— Your HMRC Government Gateway username or password</li>
                <li>— Any tracking, advertising, or analytics data</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">How we use your data</h2>
              <p className="mt-3">We use your data solely to provide the Flonancial service:</p>
              <ul className="mt-3 space-y-2">
                <li>— Enabling you to log in and access your account</li>
                <li>— Using your NINO to make API calls to HMRC on your behalf (retrieving business details, obligations, and submitting quarterly updates)</li>
                <li>— Keeping a record of what was submitted, when, and the HMRC confirmation reference</li>
              </ul>
              <p className="mt-3">We do not sell your data. We do not share your data with third parties for marketing purposes. We do not use your data for advertising.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">HMRC fraud prevention headers</h2>
              <p className="mt-3">HMRC requires all Making Tax Digital software to submit fraud prevention header data with each API call. This is a legal requirement. The data we collect for this purpose includes your browser type, screen dimensions, timezone, device identifier, window size, IP address, and your Flonancial user identifiers (email and internal account ID).</p>
              <p className="mt-3">This data is sent directly to HMRC as part of the API request. We do not store fraud prevention data beyond the duration of the request, with one exception: during the HMRC connection process, we temporarily store fraud prevention data in a browser cookie (<code className="text-[#0F1C2E]">flo_fraud_data</code>) for up to 10 minutes to carry it through the OAuth redirect. This cookie is deleted immediately after use.</p>
              <p className="mt-3">For more information, see HMRC&apos;s guidance on <a href="https://developer.service.hmrc.gov.uk/guides/fraud-prevention/" target="_blank" rel="noopener noreferrer" className="text-[#2E88D0] hover:opacity-75">fraud prevention data</a>.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Our lawful basis</h2>
              <p className="mt-3">We process your personal data on the basis of contract — you provide your data in order for us to deliver the service you have signed up for. For HMRC fraud prevention headers, we process data on the basis of legal obligation, as this is required by law for all MTD-compatible software.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Record keeping — your responsibility</h2>
              <p className="mt-3">Flonancial is bridging software. We do not store your transaction records or spreadsheet files. The legal obligation to maintain digital records of each transaction (date, amount, and category) and to retain those records for at least five years sits with you, the taxpayer.</p>
              <p className="mt-3">Your spreadsheet is your digital record. Keep it safe.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Data retention</h2>
              <p className="mt-3">We retain your submission history (the summary figures sent to HMRC, submission dates, and HMRC references) for a minimum of five years after the 31 January Self Assessment filing deadline for the relevant tax year, so that you have a record of what was submitted.</p>
              <p className="mt-3">Your account details (email address and NINO) are retained for as long as your account is active. You may delete your account at any time from the Settings page, or by contacting us.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Data storage and security</h2>
              <p className="mt-3">Account and submission data is stored securely using Supabase, a cloud database provider with servers in the EU. Data is encrypted in transit via TLS. Access to your data is restricted to your account only through row-level security policies enforced at the database level.</p>
              <p className="mt-3">HMRC OAuth access and refresh tokens are stored in httpOnly cookies and are never exposed to client-side JavaScript.</p>
              <p className="mt-3">Our application is hosted on Vercel, with servers in the United States (US East). Your spreadsheet files are never uploaded to any server — they are processed entirely within your web browser.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Your rights</h2>
              <p className="mt-3">Under UK GDPR, you have the right to:</p>
              <ul className="mt-3 space-y-2">
                <li>— Access the personal data we hold about you</li>
                <li>— Request correction of inaccurate data (including your email, password, and NINO via the Settings page)</li>
                <li>— Request deletion of your account and all associated data</li>
                <li>— Download a copy of your data in a portable format (JSON export available from the Settings page)</li>
                <li>— Withdraw consent at any time</li>
              </ul>
              <p className="mt-3">You can exercise most of these rights directly from your <a href="/settings" className="text-[#2E88D0] hover:opacity-75">Settings page</a>. For any other requests, email us at <a href="mailto:hello@flonancial.co.uk" className="text-[#2E88D0] hover:opacity-75">hello@flonancial.co.uk</a> and we will respond within 30 days.</p>
            </div>

            <div id="cookies">
              <h2 className="text-base font-medium text-[#0F1C2E]">Cookies</h2>
              <p className="mt-3">Flonancial uses essential cookies only:</p>
              <ul className="mt-3 space-y-2">
                <li>— <strong className="text-[#0F1C2E]">Login session cookies</strong> — Supabase authentication tokens that keep you logged in</li>
                <li>— <strong className="text-[#0F1C2E]">HMRC OAuth token cookies</strong> — httpOnly cookies storing your HMRC access and refresh tokens, used for API authentication</li>
                <li>— <strong className="text-[#0F1C2E]">Device identifier cookie</strong> (<code className="text-[#0F1C2E]">flo_device_id</code>) — a UUID used for HMRC fraud prevention headers, expires after 10 years</li>
                <li>— <strong className="text-[#0F1C2E]">Fraud data cookie</strong> (<code className="text-[#0F1C2E]">flo_fraud_data</code>) — temporary cookie used during HMRC connection only, expires after 10 minutes and is deleted after use</li>
              </ul>
              <p className="mt-3">We do not use tracking cookies, advertising cookies, or third-party analytics cookies. Because every cookie we use is strictly essential, no cookie consent banner is needed — and you won&apos;t see one.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Security disclosures</h2>
              <p className="mt-3">If you discover a security vulnerability or have concerns about the security of your data, please contact us immediately at <a href="mailto:hello@flonancial.co.uk" className="text-[#2E88D0] hover:opacity-75">hello@flonancial.co.uk</a> with the subject line &quot;Security disclosure&quot;. We aim to respond within 24 hours.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Data breaches</h2>
              <p className="mt-3">In the event of a data breach affecting your personal data, we will:</p>
              <ul className="mt-3 space-y-2">
                <li>— Notify the Information Commissioner&apos;s Office (ICO) within 72 hours of becoming aware of the breach, as required by UK GDPR</li>
                <li>— Notify HMRC by logging a ticket within 72 hours, providing a breach contact name and telephone number</li>
                <li>— Notify affected users without undue delay, explaining what happened, what data was affected, and what steps we are taking</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Changes to this policy</h2>
              <p className="mt-3">We may update this privacy policy from time to time. Changes will be posted on this page with an updated date. Continued use of Flonancial after changes constitutes acceptance of the updated policy.</p>
            </div>

          </div>
        </div>
      </section>
    </SiteShell>
  );
}
