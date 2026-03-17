import { SiteShell } from "@/components/site-shell";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Privacy policy</h1>
          <p className="mt-2 text-sm text-[#3B5A78]">Last updated: March 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-[#3B5A78]">

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Who we are</h2>
              <p className="mt-3">Flonancial is operated by Flonancial Ltd, a company registered in England and Wales. Company number: 17090724. Registered office: 104 Finborough Road, London, SW10 9ED.</p>
              <p className="mt-3">We build software to help self-employed individuals and businesses of all sizes meet their Making Tax Digital obligations. You can contact us at hello@flonancial.co.uk.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">What data we collect</h2>
              <p className="mt-3">When you use Flonancial, we collect:</p>
              <ul className="mt-3 space-y-2">
                <li>— Your email address, used to create and manage your account</li>
                <li>— Business details you enter, including business name, type, and start date</li>
                <li>— Quarterly financial figures you log, including turnover and expenses</li>
                <li>— Transaction records you enter, including date, amount, type, and description</li>
                <li>— HMRC OAuth tokens, stored securely in encrypted cookies to enable submissions on your behalf</li>
              </ul>
              <p className="mt-3">We do not store your HMRC username or password at any point.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">How we use your data</h2>
              <p className="mt-3">We use your data solely to provide the Flonancial service. This means:</p>
              <ul className="mt-3 space-y-2">
                <li>— Enabling you to log in and access your account</li>
                <li>— Storing your business and transaction records</li>
                <li>— Calculating quarterly summaries from your digital records</li>
                <li>— Submitting your quarterly updates to HMRC on your behalf when you choose to do so</li>
              </ul>
              <p className="mt-3">We do not sell your data. We do not share your data with third parties for marketing purposes. We do not use your data for advertising.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Our lawful basis</h2>
              <p className="mt-3">We process your personal data on the basis of contract — you provide your data in order for us to deliver the service you have signed up for. Where we have a legal obligation to retain certain data, we do so on that basis.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Data retention</h2>
              <p className="mt-3">We retain your transaction records and submission history for a minimum of five years after the 31 January Self Assessment filing deadline for the relevant tax year, in line with HMRC's digital record-keeping requirements. For example, records for the 2026–27 tax year will be retained until at least 31 January 2033.</p>
              <p className="mt-3">You may request export or deletion of your data at any time by contacting us, subject to our legal retention obligations.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Data storage and security</h2>
              <p className="mt-3">Your data is stored securely using Supabase, a cloud database provider. Data is encrypted in transit and at rest. Access to your data is restricted to your account only through row-level security policies. HMRC access tokens are stored in httpOnly cookies and are never exposed to the browser.</p>
              <p className="mt-3">Our application is hosted on Vercel. Server infrastructure is located within the European Economic Area.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Your rights</h2>
              <p className="mt-3">Under UK GDPR, you have the right to:</p>
              <ul className="mt-3 space-y-2">
                <li>— Access the personal data we hold about you</li>
                <li>— Request correction of inaccurate data</li>
                <li>— Request deletion of your data</li>
                <li>— Export your data in a portable format — your transaction records can be exported as CSV directly from the Flonancial app at any time</li>
                <li>— Withdraw consent at any time</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, email us at hello@flonancial.co.uk and we will respond within 30 days.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Cookies</h2>
              <p className="mt-3">Flonancial uses essential cookies only. These are required for login sessions and HMRC OAuth token storage. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Security disclosures</h2>
              <p className="mt-3">If you discover a security vulnerability or have concerns about the security of your data, please contact us immediately at <a href="mailto:hello@flonancial.co.uk" className="text-[#2E88D0] hover:opacity-75">hello@flonancial.co.uk</a> with the subject line "Security disclosure". We aim to respond within 24 hours.</p>
              <p className="mt-3">In the event of a data breach affecting your personal data, we will notify you and the Information Commissioner's Office within 72 hours as required by UK GDPR. We will also notify HMRC of any issues concerning the security of personal or customer data by raising a support ticket within 72 hours.</p>
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