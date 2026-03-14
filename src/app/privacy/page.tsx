import { SiteShell } from "@/components/site-shell";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Privacy policy</h1>
          <p className="mt-2 text-sm text-[#5A7896]">Last updated: March 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-[#5A7896]">

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
                <li>— HMRC OAuth tokens, stored securely in encrypted cookies to enable submissions on your behalf</li>
              </ul>
              <p className="mt-3">We do not store your HMRC username or password at any point.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">How we use your data</h2>
              <p className="mt-3">We use your data solely to provide the Flonancial service. This means:</p>
              <ul className="mt-3 space-y-2">
                <li>— Enabling you to log in and access your account</li>
                <li>— Storing your business and quarterly update records</li>
                <li>— Submitting your quarterly updates to HMRC on your behalf when you choose to do so</li>
              </ul>
              <p className="mt-3">We do not sell your data. We do not share your data with third parties for marketing purposes. We do not use your data for advertising.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Our lawful basis</h2>
              <p className="mt-3">We process your personal data on the basis of contract — you provide your data in order for us to deliver the service you have signed up for. Where we have a legal obligation to retain certain data, we do so on that basis.</p>
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
                <li>— Export your data in a portable format</li>
                <li>— Withdraw consent at any time</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, email us at hello@flonancial.co.uk and we will respond within 30 days.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Cookies</h2>
              <p className="mt-3">Flonancial uses essential cookies only. These are required for login sessions and HMRC OAuth token storage. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Security incidents</h2>
              <p className="mt-3">In the event of a data breach affecting your personal data, we will notify you and the Information Commissioner's Office within 72 hours as required by UK GDPR. To report a security concern, email hello@flonancial.co.uk immediately.</p>
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