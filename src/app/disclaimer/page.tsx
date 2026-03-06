export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-10 text-white sm:px-8 lg:px-10">
      <h1 className="text-2xl font-normal">Disclaimer</h1>

      <p className="mt-4 text-sm leading-6 text-white/75">
        The information on this website is provided for general informational
        purposes only.
      </p>

      <p className="mt-4 text-sm leading-6 text-white/75">
        It is not tax advice, legal advice, accounting advice, or financial
        advice, and should not be relied on as a substitute for professional
        advice tailored to your circumstances.
      </p>

      <p className="mt-4 text-sm leading-6 text-white/75">
        While we aim to keep information accurate and up to date, we make no
        guarantees or warranties about completeness, accuracy, or suitability.
      </p>

      <p className="mt-4 text-sm leading-6 text-white/75">
        You should always check current HMRC guidance and, where appropriate,
        seek professional advice.
      </p>
    </main>
  );
}