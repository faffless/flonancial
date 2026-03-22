import { SiteShell } from "@/components/site-shell";

export default function DisclaimerPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-8">
          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Disclaimer</h1>
          <p className="mt-2 text-sm text-[#2E4A63]">Last updated: March 2026</p>
          <div className="mt-8 space-y-8 text-sm leading-7 text-[#2E4A63]">
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Not tax advice</h2>
              <p className="mt-3">Flonancial is a software tool that helps you submit quarterly updates to HMRC under Making Tax Digital for Income Tax. It is not a tax advisory service and nothing on this website or within the application constitutes tax advice.</p>
              <p className="mt-3">If you are unsure about your tax obligations, whether MTD applies to you, or how to calculate your figures, you should consult a qualified accountant or tax adviser.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Accuracy of submissions</h2>
              <p className="mt-3">Flonancial submits the figures you provide to HMRC on your behalf. You are responsible for ensuring that the figures you enter are accurate and complete. Flonancial Ltd accepts no liability for submissions made using incorrect or incomplete information provided by the user.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Beta software</h2>
              <p className="mt-3">Flonancial is currently in beta. While we work hard to ensure the service is reliable, beta software may contain bugs or limitations. You should always verify that your submissions have been accepted by HMRC directly through your HMRC online account.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">HMRC recognition</h2>
              <p className="mt-3">Flonancial is currently working toward full HMRC recognition as an approved MTD software provider. Until recognition is confirmed, you should satisfy yourself that using Flonancial meets your obligations. We will update this page when full recognition is achieved.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">External links</h2>
              <p className="mt-3">This website may contain links to HMRC or other government websites. Flonancial Ltd is not responsible for the content or availability of external websites.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Limitation of liability</h2>
              <p className="mt-3">To the fullest extent permitted by law, Flonancial Ltd shall not be liable for any loss or damage arising from your use of this service, including but not limited to penalties, interest, or other charges imposed by HMRC as a result of late, incorrect, or missing submissions.</p>
            </div>
            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Contact</h2>
              <p className="mt-3">If you have any questions about this disclaimer, contact us at hello@flonancial.co.uk.</p>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}