import { SiteShell } from "@/components/site-shell";

export default function TermsPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-white">Terms of service</h1>
          <p className="mt-2 text-sm text-white/45">Last updated: March 2026</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-white/70">

            <div>
              <h2 className="text-base font-medium text-white">Who we are</h2>
              <p className="mt-3">
                Flonancial is operated by Flonancial Ltd, a company registered in England and Wales.
                Company number: 17090724. Registered office: 104 Finborough Road, London, SW10 9ED.
                By using Flonancial, you agree to these terms. If you do not agree, do not use the service.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">The service</h2>
              <p className="mt-3">
                Flonancial provides software to help individuals submit quarterly updates to HMRC
                under Making Tax Digital for Income Tax. The service is provided free of charge
                during beta. We reserve the right to introduce pricing in future with reasonable notice.
              </p>
              <p className="mt-3">
                Flonancial is currently in beta. We make no guarantees of uptime, availability,
                or fitness for any particular purpose during this period.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Your responsibilities</h2>
              <p className="mt-3">You are responsible for:</p>
              <ul className="mt-3 space-y-2">
                <li>— Providing accurate and complete financial figures when logging quarterly updates</li>
                <li>— Ensuring your submissions to HMRC are correct before submitting</li>
                <li>— Keeping your account credentials secure</li>
                <li>— Understanding your own tax obligations and deadlines</li>
                <li>— Verifying that submitted updates have been accepted by HMRC directly through your HMRC online account</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Not tax advice</h2>
              <p className="mt-3">
                Flonancial is a software tool, not a tax advisory service. Nothing within the
                application or on this website constitutes tax advice. If you are uncertain about
                your tax obligations, you should consult a qualified accountant or tax adviser.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Acceptable use</h2>
              <p className="mt-3">You must not use Flonancial to:</p>
              <ul className="mt-3 space-y-2">
                <li>— Submit false or fraudulent information to HMRC</li>
                <li>— Attempt to access another user's account or data</li>
                <li>— Interfere with or disrupt the service</li>
                <li>— Use the service in any way that violates applicable law</li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that breach these terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Intellectual property</h2>
              <p className="mt-3">
                All content, design, and code within Flonancial is owned by Flonancial Ltd.
                You may not copy, reproduce, or distribute any part of the service without
                our written permission.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Limitation of liability</h2>
              <p className="mt-3">
                To the fullest extent permitted by law, Flonancial Ltd shall not be liable for
                any loss or damage arising from your use of the service, including penalties,
                interest, or charges imposed by HMRC as a result of late, incorrect, or missing
                submissions. Use of Flonancial is at your own risk.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Termination</h2>
              <p className="mt-3">
                You may stop using Flonancial at any time. You can request deletion of your
                account and data by emailing hello@flonancial.co.uk. We reserve the right to
                suspend or terminate access to the service at any time, with or without notice.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Governing law</h2>
              <p className="mt-3">
                These terms are governed by the laws of England and Wales. Any disputes shall
                be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Changes to these terms</h2>
              <p className="mt-3">
                We may update these terms from time to time. Changes will be posted on this page
                with an updated date. Continued use of Flonancial after changes constitutes
                acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Contact</h2>
              <p className="mt-3">
                For any questions about these terms, contact us at hello@flonancial.co.uk.
              </p>
            </div>

          </div>
        </div>
      </section>
    </SiteShell>
  );
}