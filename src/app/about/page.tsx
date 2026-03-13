import { SiteShell } from "@/components/site-shell";

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-white">About Flonancial</h1>
          <p className="mt-3 text-sm text-white/45"></p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-white/70">

            <div>
              <h2 className="text-base font-medium text-white">What Flonancial is</h2>
              <p className="mt-3">
                Flonancial is a simple, modern Making Tax Digital service primarily built for 		self-employed people and landlords but eventually it will be for businesses of every size. We created it to make MTD easier, more accessible, and 		genuinely affordable, because the real cost of building and running a digital service like this can be 			kept low. That is why we are able to offer our core service for free, while we continue developing 			optional extras and premium features for the future. Our goal is straightforward: earn trust by delivering 		a reliable service first, then give customers the choice to upgrade only if they want more.
                It lets you connect directly to HMRC, log your quarterly income and expenses, and submit
                your MTD updates without needing an accountant or expensive software. The name comes from the idea of finances that just flow — simple, friction-free, and
                straightforward. That's what we're building.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Why we built it</h2>
              <p className="mt-3">
                Making Tax Digital for Income Tax is coming for millions of self-employed people in the UK.
                From April 2026, sole traders earning over £50,000 are legally required to submit quarterly
                updates to HMRC digitally. More will follow in 2027 and 2028.
              </p>
              <p className="mt-3">
                Most existing MTD software is added on to old systems, built for accountants or businesses with complex needs.
                It's expensive, complicated, and overkill for a freelancer, sole trader, landlord or business with straightforward
                income. We think that's wrong. Flonancial is built specifically for people who just want to
                meet their obligations simply, quickly, and without paying through the nose.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">Where we are now</h2>
              <p className="mt-3">
                Flonancial is currently in beta. The core MTD submission flow is built and working —
                you can connect your HMRC account, log quarterly figures, and submit updates directly
                to HMRC. We are actively working toward full HMRC recognition and production API access.
              </p>
              <p className="mt-3">
                Flonancial is completely free to use. We plan to introduce simple,
                low-cost upgrades and optional additional services in future.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">What makes us different</h2>
              <p className="mt-3">
                We are not trying to replace your accountant or become a full accounting suite.
                Flonancial currently does one thing — MTD quarterly submissions.
                No bloat, no faff, no confusing dashboards. Just connect, log your figures, submit.
              </p>
              <p className="mt-3">
                We use HMRC's official OAuth system so we never see or store your HMRC login details.
                Your data is yours.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-white">The company</h2>
              <p className="mt-3">
                Flonancial is operated by Flonancial Ltd, a company registered in England and Wales.
                Company number: 17090724. Registered office: 104 Finborough Road, London, SW10 9ED.
              </p>
              <p className="mt-3">
                We are a small, independent team. No venture capital, no corporate agenda. Just a
                straightforward product built to solve a real problem for real people.
              </p>
              <p className="mt-3">
                Get in touch at hello@flonancial.co.uk — we read every email.
              </p>
            </div>

          </div>
        </div>
      </section>
    </SiteShell>
  );
}