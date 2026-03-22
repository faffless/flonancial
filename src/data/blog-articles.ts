export type BlogArticle = {
  slug: string;
  title: string;
  metaDescription: string;
  category: "guide" | "comparison" | "reference";
  publishedDate: string;
  content: string;
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "can-you-use-excel-for-making-tax-digital",
    title: "Can You Use Excel for Making Tax Digital? Yes — Here's How",
    metaDescription: "You don't need to ditch your spreadsheet for MTD. Learn how to use Excel or Google Sheets with free bridging software to submit quarterly updates to HMRC.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>If you already track your income and expenses in Excel or Google Sheets, you might be wondering whether Making Tax Digital forces you to switch to accounting software like Xero or QuickBooks.</p>
      <p>The short answer: <strong>no</strong>. You can absolutely keep using your spreadsheet. You just need a piece of bridging software to send your figures to HMRC.</p>

      <h2>What HMRC actually requires</h2>
      <p>Making Tax Digital for Income Tax requires two things:</p>
      <ul>
        <li>You keep digital records of your income and expenses (a spreadsheet counts)</li>
        <li>You submit quarterly summary updates to HMRC using compatible software</li>
      </ul>
      <p>HMRC doesn't care what tool you use to keep your records. They care that the numbers reach them digitally, four times a year.</p>

      <h2>What is bridging software?</h2>
      <p>Bridging software sits between your spreadsheet and HMRC. It reads your figures and submits them through HMRC's API. You don't need to learn a new system, re-enter data, or change how you work.</p>
      <p>Think of it as a translator — your spreadsheet speaks Excel, HMRC speaks API, and bridging software handles the conversation.</p>

      <h2>How it works with Flonancial</h2>
      <p>Flonancial is free bridging software built specifically for spreadsheet users. Here's the process:</p>
      <ol>
        <li><strong>Upload your spreadsheet</strong> — drag and drop your .xlsx, .xls, .csv, or .ods file</li>
        <li><strong>Pick your cells</strong> — click the cell containing your total turnover and the cell containing your total expenses</li>
        <li><strong>Review and submit</strong> — check the figures and submit directly to HMRC</li>
      </ol>
      <p>Your spreadsheet file is parsed entirely in your browser. It never touches our servers. We only send the two summary numbers to HMRC.</p>

      <h2>What about the Flo tab?</h2>
      <p>If you download our free template, it includes a Flo tab with your turnover and expenses totals pre-linked. When you upload, Flonancial reads these automatically — no cell-picking needed. But this is optional. You can use any spreadsheet you like.</p>

      <h2>Do I need to change my spreadsheet?</h2>
      <p>No. As long as your spreadsheet has a total for turnover and a total for expenses somewhere, Flonancial can read it. You don't need to restructure anything, add special columns, or follow a particular format.</p>

      <h2>What HMRC receives</h2>
      <p>Each quarterly submission sends three numbers: your turnover, your expenses, and any other business income (usually zero). That's it. HMRC never sees your individual transactions — the record-keeping obligation sits with you.</p>

      <h2>Getting started</h2>
      <p>Flonancial is free for individuals and always will be. Create an account, connect to HMRC once, and you're ready to submit your first quarterly update using your existing spreadsheet.</p>
    `,
  },
  {
    slug: "free-mtd-bridging-software",
    title: "Free MTD Bridging Software for Spreadsheets — Flonancial",
    metaDescription: "Submit your Making Tax Digital quarterly updates to HMRC for free. Upload your spreadsheet, pick your figures, and submit. No accounting software needed.",
    category: "comparison",
    publishedDate: "2026-03-22",
    content: `
      <p>Most Making Tax Digital software costs between £12 and £35 per month. If you're a sole trader or landlord with straightforward finances, that feels like a lot to pay for something the government is forcing you to do.</p>
      <p>Flonancial is free MTD bridging software. It connects your existing spreadsheet to HMRC so you can submit your quarterly updates without paying for accounting software you don't need.</p>

      <h2>What is bridging software?</h2>
      <p>Bridging software is a tool that takes data from your existing records (like a spreadsheet) and submits it to HMRC in the format their API requires. It bridges the gap between how you keep your records and how HMRC wants to receive them.</p>
      <p>HMRC maintains an official list of compatible software. There are two main types:</p>
      <ul>
        <li><strong>Full accounting software</strong> — platforms like Xero, QuickBooks, and FreeAgent that replace your spreadsheet entirely</li>
        <li><strong>Bridging software</strong> — lightweight tools that work with your existing records</li>
      </ul>

      <h2>Why is Flonancial free?</h2>
      <p>Flonancial is free for individual sole traders and landlords, and always will be. Our future revenue model is paid plans for accountants managing multiple clients. If you're filing your own returns, you'll never pay.</p>

      <h2>How it works</h2>
      <ol>
        <li><strong>Upload your spreadsheet</strong> — any .xlsx, .xls, .csv, or .ods file</li>
        <li><strong>Pick your figures</strong> — click the cells containing your turnover and expenses totals</li>
        <li><strong>Connect to HMRC</strong> — one-time setup using your Government Gateway account</li>
        <li><strong>Submit</strong> — review your figures and submit directly to HMRC</li>
      </ol>

      <h2>What you don't get (and don't need)</h2>
      <p>Flonancial doesn't do bookkeeping, invoicing, bank feeds, or payroll. It does one thing: submit your quarterly MTD figures to HMRC. If you already keep good records in a spreadsheet, that's all you need.</p>

      <h2>Security and privacy</h2>
      <p>Your spreadsheet is parsed entirely in your browser — the file never leaves your device. We use HMRC's official OAuth process, so we never see your Government Gateway password. We only store the summary figures you submit.</p>

      <h2>Getting started</h2>
      <p>Create a free account, connect to HMRC, and submit your first quarterly update in minutes. No card required, no trial period, no catch.</p>
    `,
  },
  {
    slug: "making-tax-digital-for-landlords",
    title: "Making Tax Digital for Landlords — Free Software and What You Need to Know",
    metaDescription: "UK landlords earning over £50,000 must comply with MTD from April 2026. Learn what's required and how to submit quarterly updates for free with your spreadsheet.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>If you earn rental income from UK property and your total income exceeds £50,000, Making Tax Digital for Income Tax applies to you from 6 April 2026.</p>
      <p>This guide covers what landlords need to know, what changes, and how to submit your quarterly updates without switching to expensive accounting software.</p>

      <h2>Who is affected?</h2>
      <p>You need to comply with MTD if:</p>
      <ul>
        <li>You receive rental income from UK property</li>
        <li>Your total gross income (from all sources including employment, self-employment, and property) exceeds £50,000</li>
      </ul>
      <p>This threshold drops to £30,000 from April 2027 and £20,000 from April 2028.</p>

      <h2>What do landlords need to submit?</h2>
      <p>Four quarterly updates per year, each containing:</p>
      <ul>
        <li><strong>Rental income</strong> — your total rent received for the period</li>
        <li><strong>Expenses</strong> — your total allowable expenses (repairs, insurance, agent fees, etc.)</li>
        <li><strong>Other income</strong> — insurance payouts, grants, etc. (usually zero)</li>
      </ul>
      <p>These are cumulative year-to-date figures, not just the quarter's numbers.</p>

      <h2>What expenses can landlords claim?</h2>
      <p>Common allowable expenses for landlords include:</p>
      <ul>
        <li>Letting agent fees and management costs</li>
        <li>Repairs and maintenance (not improvements)</li>
        <li>Insurance premiums</li>
        <li>Ground rent and service charges</li>
        <li>Accountancy fees</li>
        <li>Travel to properties for maintenance</li>
        <li>Advertising for tenants</li>
      </ul>
      <p>Note: mortgage interest is no longer deductible as an expense for residential landlords. Instead, you receive a 20% tax credit. This is handled in your Final Declaration, not quarterly updates.</p>

      <h2>Do I need special software?</h2>
      <p>You need HMRC-compatible software to submit your updates. But you don't need a full property management platform. If you already track your rental income and expenses in a spreadsheet, bridging software like Flonancial will submit your figures to HMRC for free.</p>

      <h2>What about jointly-owned property?</h2>
      <p>If you own property jointly (for example with a spouse), each owner submits their own MTD updates for their share of the income and expenses. You'll each need your own Flonancial account connected to your own HMRC Government Gateway.</p>

      <h2>Multiple properties</h2>
      <p>All your UK rental properties are treated as a single property business by HMRC. You submit one set of figures covering all your properties combined — you don't need to file separately for each property.</p>

      <h2>Getting started</h2>
      <p>Flonancial supports UK property businesses and is free for individual landlords. Upload your rental spreadsheet, pick the cells with your totals, and submit to HMRC in minutes.</p>
    `,
  },
  {
    slug: "mtd-software-comparison-2026",
    title: "MTD Software Comparison 2026: Free vs Paid Options",
    metaDescription: "Compare the best Making Tax Digital software for 2026 — pricing, features, and what sole traders and landlords actually need. Includes free options.",
    category: "comparison",
    publishedDate: "2026-03-22",
    content: `
      <p>There are dozens of MTD-compatible software options, but most sole traders and landlords only need the basics. Here's an honest comparison of what's available, what it costs, and what you actually need.</p>

      <h2>Two types of MTD software</h2>
      <p>Before comparing, understand the distinction:</p>
      <ul>
        <li><strong>Full accounting software</strong> — replaces your existing records. You do everything inside the platform: invoicing, expenses, bank feeds, and MTD submissions. Examples: Xero, QuickBooks, FreeAgent.</li>
        <li><strong>Bridging software</strong> — works alongside your existing records. You keep your spreadsheet and use the tool only to submit figures to HMRC. Examples: Flonancial, 123 Sheets.</li>
      </ul>
      <p>If you already have a system that works (even if it's just a spreadsheet), bridging software is all you need.</p>

      <h2>Pricing comparison</h2>
      <table>
        <thead><tr><th>Software</th><th>Type</th><th>Price</th><th>Best for</th></tr></thead>
        <tbody>
          <tr><td>Flonancial</td><td>Bridging</td><td>Free (forever for individuals)</td><td>Spreadsheet users, sole traders, landlords</td></tr>
          <tr><td>Xero</td><td>Full accounting</td><td>From £17/month</td><td>Businesses wanting full bookkeeping</td></tr>
          <tr><td>QuickBooks</td><td>Full accounting</td><td>From £12/month</td><td>Similar to Xero, cheaper entry point</td></tr>
          <tr><td>FreeAgent</td><td>Full accounting</td><td>From £14.50/month</td><td>Freelancers (free with some banks)</td></tr>
          <tr><td>Sage</td><td>Full accounting</td><td>From £14/month</td><td>Established businesses with complex needs</td></tr>
          <tr><td>Hammock</td><td>Full accounting</td><td>From £8/month</td><td>Landlords specifically</td></tr>
          <tr><td>GoSimpleTax</td><td>Full accounting</td><td>From £50/year</td><td>Self Assessment + MTD combined</td></tr>
        </tbody>
      </table>

      <h2>What do you actually need?</h2>
      <p>HMRC requires two things: digital records and quarterly digital submissions. If your spreadsheet is your digital record, you only need software for the submission part.</p>
      <p>Paying £15/month for Xero to submit four numbers per quarter is like hiring a removal van to deliver a letter. It works, but it's overkill.</p>

      <h2>When full accounting software makes sense</h2>
      <p>Consider Xero, QuickBooks, or FreeAgent if:</p>
      <ul>
        <li>You send invoices and want to track who's paid</li>
        <li>You want automatic bank feed categorisation</li>
        <li>You have employees or do payroll</li>
        <li>Your accountant prefers a specific platform</li>
        <li>You don't keep a spreadsheet and need something from scratch</li>
      </ul>

      <h2>When bridging software makes sense</h2>
      <p>Use bridging software like Flonancial if:</p>
      <ul>
        <li>You already track everything in a spreadsheet</li>
        <li>You don't want to learn new software</li>
        <li>Your finances are straightforward</li>
        <li>You want to keep costs at zero</li>
        <li>You want to keep control of your own records</li>
      </ul>

      <h2>The bottom line</h2>
      <p>If you already keep decent records in a spreadsheet, you don't need to pay for MTD. Free bridging software does the job. If you want a full accounting platform for other reasons, that's a separate decision — don't let MTD force you into one.</p>
    `,
  },
  {
    slug: "what-is-mtd-bridging-software",
    title: "MTD Bridging Software Explained: What It Is and Why You Need It",
    metaDescription: "Bridging software connects your spreadsheet to HMRC for Making Tax Digital. Learn what it does, how it works, and whether you need it.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>You'll see the term "bridging software" a lot when researching Making Tax Digital. Here's what it actually means and whether it's what you need.</p>

      <h2>The simple explanation</h2>
      <p>Bridging software is a tool that takes data from your existing records — usually a spreadsheet — and submits it to HMRC in the format their system requires. It's the bridge between how you keep your books and how HMRC wants to receive them.</p>

      <h2>Why does it exist?</h2>
      <p>HMRC requires MTD submissions to be sent digitally through their API. You can't just email them a spreadsheet or type numbers into a web form. The data has to arrive through compatible software.</p>
      <p>Full accounting platforms like Xero and QuickBooks include this capability built in. But if you don't use accounting software — if you keep your records in Excel or Google Sheets — you need something to handle just the submission part. That's bridging software.</p>

      <h2>What bridging software does</h2>
      <ul>
        <li>Reads your turnover and expenses from your spreadsheet</li>
        <li>Connects to HMRC using your Government Gateway credentials</li>
        <li>Submits your quarterly figures through HMRC's API</li>
        <li>Stores a record of what was submitted</li>
      </ul>

      <h2>What bridging software doesn't do</h2>
      <ul>
        <li>It doesn't replace your spreadsheet or change how you keep records</li>
        <li>It doesn't do bookkeeping, invoicing, or bank reconciliation</li>
        <li>It doesn't categorise your transactions</li>
        <li>It doesn't calculate your tax</li>
      </ul>
      <p>It does one job: get your numbers from point A (your spreadsheet) to point B (HMRC).</p>

      <h2>Is bridging software HMRC-approved?</h2>
      <p>HMRC maintains a list of compatible software for Making Tax Digital. Bridging software that connects through their official API and meets their requirements can appear on this list. Always check that the tool you choose is HMRC-recognised.</p>

      <h2>How Flonancial works as bridging software</h2>
      <p>Flonancial is free bridging software designed for sole traders and landlords who use spreadsheets. Upload your file, click on the cells containing your totals, review, and submit. Your spreadsheet is parsed in your browser — it never leaves your device.</p>
    `,
  },
  {
    slug: "making-tax-digital-for-sole-traders",
    title: "Making Tax Digital for Sole Traders — Keep Your Spreadsheet",
    metaDescription: "Self-employed and worried about MTD? You don't need to switch to accounting software. Learn how sole traders can comply using their existing spreadsheet.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>Making Tax Digital for Income Tax starts on 6 April 2026. If you're self-employed and earn over £50,000, you need to start submitting quarterly updates to HMRC using compatible software.</p>
      <p>That doesn't mean you need to buy Xero or learn QuickBooks. If you keep your records in a spreadsheet, you can keep doing exactly that.</p>

      <h2>What changes for sole traders?</h2>
      <p>Instead of one annual Self Assessment return, you'll send HMRC four quarterly updates during the tax year, plus a Final Declaration at the end. The quarterly updates are simple — just your total turnover and total expenses for the year so far.</p>

      <h2>The quarterly deadlines</h2>
      <p>For the standard April-to-April tax year:</p>
      <ul>
        <li><strong>Quarter 1</strong> (6 Apr – 5 Jul) — submit by 7 August</li>
        <li><strong>Quarter 2</strong> (6 Jul – 5 Oct) — submit by 7 November</li>
        <li><strong>Quarter 3</strong> (6 Oct – 5 Jan) — submit by 7 February</li>
        <li><strong>Quarter 4</strong> (6 Jan – 5 Apr) — submit by 7 May</li>
      </ul>

      <h2>What you need to submit</h2>
      <p>Each quarterly update sends three numbers to HMRC:</p>
      <ul>
        <li>Your total turnover (business income) year-to-date</li>
        <li>Your total expenses year-to-date</li>
        <li>Any other business income year-to-date (usually zero)</li>
      </ul>
      <p>These are cumulative figures. If your Q1 turnover was £10,000 and Q2 adds £8,000, your Q2 submission shows £18,000.</p>

      <h2>Do I need accounting software?</h2>
      <p>No. HMRC requires that your records are digital and that your submissions are sent through compatible software. A spreadsheet counts as digital records. Bridging software handles the submissions.</p>
      <p>Accounting software like Xero or QuickBooks does much more than MTD requires. If you don't need invoicing, bank feeds, or automated bookkeeping, you don't need to pay for it.</p>

      <h2>What expenses can sole traders claim?</h2>
      <p>Common allowable expenses include:</p>
      <ul>
        <li>Office costs (stationery, phone bills, software)</li>
        <li>Travel costs (fuel, parking, public transport for business)</li>
        <li>Clothing (uniforms or protective equipment only)</li>
        <li>Professional fees (accountant, solicitor)</li>
        <li>Insurance (professional indemnity, public liability)</li>
        <li>Marketing and advertising</li>
        <li>Training directly related to your business</li>
      </ul>
      <p>If you work from home, you can also claim a proportion of household costs or use HMRC's simplified expenses flat rate.</p>

      <h2>Getting started with Flonancial</h2>
      <p>Flonancial is free for sole traders and always will be. Upload your spreadsheet, pick your totals, and submit to HMRC. No accounting software needed, no monthly fees, no learning curve.</p>
    `,
  },
  {
    slug: "how-to-submit-first-mtd-quarterly-update",
    title: "How to Submit Your First MTD Quarterly Update (Step by Step)",
    metaDescription: "A practical step-by-step guide to submitting your first Making Tax Digital quarterly update to HMRC using your spreadsheet and free bridging software.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>Your first MTD quarterly submission can feel daunting. Here's exactly what happens, step by step, so there are no surprises.</p>

      <h2>Before you start</h2>
      <p>Make sure you have:</p>
      <ul>
        <li>A Government Gateway account (the same one you use for Self Assessment)</li>
        <li>Your National Insurance number</li>
        <li>Your spreadsheet with up-to-date income and expenses</li>
        <li>A Flonancial account (free to create)</li>
      </ul>

      <h2>Step 1: Sign up to HMRC for MTD</h2>
      <p>Before you can submit through any software, you need to sign up for Making Tax Digital through your Government Gateway account. HMRC has a sign-up service at gov.uk. This is a one-time step.</p>
      <p>Note: it can take up to 72 hours for HMRC to process your sign-up. Don't leave this to the deadline day.</p>

      <h2>Step 2: Connect to HMRC through Flonancial</h2>
      <p>Log into Flonancial and click "Connect HMRC" on your dashboard. You'll be redirected to HMRC's website where you grant Flonancial permission to submit on your behalf. This uses HMRC's official OAuth process — we never see your password.</p>
      <p>Once connected, Flonancial automatically imports your business details from HMRC.</p>

      <h2>Step 3: Upload your spreadsheet</h2>
      <p>Go to your business page and find the quarter you want to submit. Click "Upload & submit" and either drag your spreadsheet file in or click to browse.</p>
      <p>Your file is processed entirely in your browser — it never touches our servers.</p>

      <h2>Step 4: Pick your figures</h2>
      <p>If your spreadsheet has a Flo tab (from our free template), your figures are read automatically. Otherwise, you'll see your spreadsheet displayed as a grid. Click the cell containing your total turnover, then click the cell containing your total expenses.</p>

      <h2>Step 5: Review and confirm</h2>
      <p>You'll see a confirmation screen showing your turnover, expenses, and other business income (defaulting to zero). Check the numbers match what you expect.</p>
      <p>Remember: these should be cumulative year-to-date figures, not just this quarter's numbers.</p>

      <h2>Step 6: Submit</h2>
      <p>Tick the confirmation box and click "Submit to HMRC". The submission typically takes a few seconds. You'll see a confirmation with an HMRC correlation ID — that's your proof of submission.</p>

      <h2>What happens next?</h2>
      <p>Your figures are now with HMRC. You can verify this by checking your HMRC online account. Flonancial also keeps a record in your submission history.</p>
      <p>Repeat this process each quarter. The whole thing takes about two minutes once you've done it before.</p>
    `,
  },
  {
    slug: "mtd-quarterly-deadlines-2026-27",
    title: "MTD Quarterly Deadlines 2026/27: Every Date You Need to Know",
    metaDescription: "All the Making Tax Digital quarterly submission deadlines for the 2026/27 tax year. Don't miss a deadline — know exactly when to submit.",
    category: "reference",
    publishedDate: "2026-03-22",
    content: `
      <p>Making Tax Digital for Income Tax starts on 6 April 2026 for anyone earning over £50,000. Here are all the deadlines you need for the first tax year.</p>

      <h2>2026/27 quarterly deadlines</h2>
      <p>For the standard tax year (6 April to 5 April):</p>

      <table>
        <thead><tr><th>Quarter</th><th>Period</th><th>Submission deadline</th></tr></thead>
        <tbody>
          <tr><td>Q1</td><td>6 April – 5 July 2026</td><td>7 August 2026</td></tr>
          <tr><td>Q2</td><td>6 July – 5 October 2026</td><td>7 November 2026</td></tr>
          <tr><td>Q3</td><td>6 October 2026 – 5 January 2027</td><td>7 February 2027</td></tr>
          <tr><td>Q4</td><td>6 January – 5 April 2027</td><td>7 May 2027</td></tr>
        </tbody>
      </table>

      <p>The Final Declaration (replacing the annual Self Assessment return) is due by 31 January 2028.</p>

      <h2>How much time do you have?</h2>
      <p>You get roughly one month after each quarter ends to submit. The exact gap varies between 32 and 33 days depending on the quarter.</p>

      <h2>What if my accounting year doesn't match the tax year?</h2>
      <p>Most sole traders and landlords use the standard 6 April to 5 April tax year. If you have a different accounting year end, your quarterly periods will be different. HMRC will set these based on your business records — you can check your specific dates once you've signed up for MTD.</p>

      <h2>What happens if you miss a deadline?</h2>
      <p>HMRC is introducing a points-based penalty system for MTD. Each late submission earns you a penalty point. Once you hit a threshold (currently 4 points for quarterly submissions), you receive a £200 fine. Further late submissions incur additional £200 fines.</p>
      <p>However, HMRC has confirmed a soft landing period for the first year of MTD for Income Tax. Penalties for late quarterly updates won't apply for the first year (2026/27), giving you time to adjust. Late payment penalties and interest on late tax payments will still apply as normal.</p>

      <h2>Set a reminder</h2>
      <p>The deadlines are consistent — roughly the 7th of the month, one month after each quarter ends. Put them in your calendar now. It takes about two minutes to submit each quarter if your records are up to date.</p>
    `,
  },
  {
    slug: "mtd-penalties-explained",
    title: "MTD Penalties Explained: Points, Fines, and the 2026 Grace Period",
    metaDescription: "What happens if you submit late or get your MTD figures wrong? Understand the new penalty points system, fines, and the first-year grace period.",
    category: "reference",
    publishedDate: "2026-03-22",
    content: `
      <p>One of the biggest anxieties around Making Tax Digital is penalties. What if you submit late? What if you get the numbers wrong? Here's how the system actually works.</p>

      <h2>The new points-based system</h2>
      <p>HMRC has replaced fixed penalties with a points-based system for late submissions. Here's how it works:</p>
      <ul>
        <li>Each late quarterly submission earns you <strong>1 penalty point</strong></li>
        <li>The threshold for quarterly submissions is <strong>4 points</strong></li>
        <li>Once you hit 4 points, you receive a <strong>£200 fine</strong></li>
        <li>Every subsequent late submission also incurs a <strong>£200 fine</strong></li>
      </ul>

      <h2>How to clear penalty points</h2>
      <p>Points don't last forever. They expire after a period of compliance:</p>
      <ul>
        <li>Submit all required updates on time for 24 months</li>
        <li>Your points reset to zero</li>
      </ul>
      <p>The 24-month clock starts from the month after your most recent late submission.</p>

      <h2>The 2026/27 grace period</h2>
      <p>Good news: HMRC has confirmed a soft landing period for the first year. For the 2026/27 tax year, <strong>late submission penalties will not be applied for quarterly updates</strong>. This gives everyone time to adjust to the new system.</p>
      <p>However, this grace period does <strong>not</strong> apply to:</p>
      <ul>
        <li>Late payment of tax (interest and late payment penalties still apply)</li>
        <li>The Final Declaration</li>
        <li>Subsequent tax years (2027/28 onwards, normal penalties apply)</li>
      </ul>

      <h2>What if you submit wrong figures?</h2>
      <p>Quarterly updates are cumulative, meaning each submission replaces the previous one for that tax year. If you made an error in Q1 and notice it in Q2, your Q2 submission (with corrected year-to-date figures) effectively fixes it.</p>
      <p>You can also resubmit for any quarter at any time before the Final Declaration. There's no penalty for amending quarterly figures.</p>

      <h2>Late payment penalties</h2>
      <p>Separate from submission penalties, if you owe tax and don't pay on time:</p>
      <ul>
        <li>Interest accrues from the due date</li>
        <li>A first late payment penalty applies after 15 days</li>
        <li>A second late payment penalty applies after 30 days</li>
      </ul>

      <h2>The practical takeaway</h2>
      <p>Don't panic. The grace period means you have a full year to get comfortable with the process. The quarterly submissions themselves take minutes. Keep your records up to date, submit on time, and the penalty system will never affect you.</p>
    `,
  },
  {
    slug: "do-i-need-making-tax-digital",
    title: "Do I Need Making Tax Digital? A Quick Eligibility Check",
    metaDescription: "Find out if Making Tax Digital applies to you. Check the income thresholds, exemptions, and timeline for MTD for Income Tax.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>Not sure if Making Tax Digital affects you? Here's a quick way to check.</p>

      <h2>The basic rule</h2>
      <p>You need to comply with MTD for Income Tax if:</p>
      <ul>
        <li>You are self-employed (sole trader) <strong>or</strong> receive income from UK property</li>
        <li>Your qualifying income exceeds the threshold</li>
      </ul>

      <h2>The thresholds and timeline</h2>
      <table>
        <thead><tr><th>Start date</th><th>Income threshold</th></tr></thead>
        <tbody>
          <tr><td>6 April 2026</td><td>Over £50,000</td></tr>
          <tr><td>6 April 2027</td><td>Over £30,000</td></tr>
          <tr><td>6 April 2028</td><td>Over £20,000</td></tr>
        </tbody>
      </table>

      <h2>What counts as qualifying income?</h2>
      <p>It's your <strong>gross</strong> income from self-employment and/or property, before expenses. If you have both a sole trader business and rental income, you add them together.</p>
      <p>Employment income (PAYE salary) doesn't count towards the threshold, but it doesn't exempt you either. A landlord earning £45,000 in salary plus £10,000 in rent needs MTD because the rental income plus any self-employment income exceeds £50,000. Actually, only the self-employment and property income counts — so in this example, if their qualifying income is just the £10,000 rent, they wouldn't need MTD until the threshold drops to cover them.</p>

      <h2>Who is exempt?</h2>
      <p>You don't need MTD if:</p>
      <ul>
        <li>Your qualifying income is below the current threshold</li>
        <li>You are a partnership (MTD for partnerships has been delayed)</li>
        <li>You are a limited company (MTD for Corporation Tax is separate and not yet confirmed)</li>
        <li>You have a reasonable excuse (e.g. serious illness, disability) — you can apply for an exemption</li>
        <li>You are digitally excluded (e.g. no internet access, religious objection to computers) — rare, but HMRC does grant exemptions</li>
      </ul>

      <h2>I'm not sure if I qualify</h2>
      <p>Check your most recent Self Assessment return. Look at your gross self-employment income and/or property income (before expenses). If either or both together exceed the threshold, you need MTD.</p>
      <p>If you're close to the threshold, HMRC will use the figures from your most recent tax return to determine whether you're in scope.</p>

      <h2>What do I need to do?</h2>
      <p>If MTD applies to you:</p>
      <ol>
        <li>Sign up for MTD through your Government Gateway account</li>
        <li>Keep digital records of your income and expenses (a spreadsheet counts)</li>
        <li>Submit quarterly updates using compatible software</li>
        <li>File a Final Declaration at the end of the tax year</li>
      </ol>
      <p>Flonancial handles step 3 for free. You keep your spreadsheet, upload it each quarter, and submit.</p>
    `,
  },
  {
    slug: "making-tax-digital-complete-guide-2026",
    title: "Making Tax Digital 2026: The Complete Guide for Beginners",
    metaDescription: "Everything you need to know about Making Tax Digital for Income Tax in 2026. Who's affected, what's required, deadlines, and how to comply.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>Making Tax Digital (MTD) for Income Tax is the biggest change to UK tax reporting in decades. From 6 April 2026, hundreds of thousands of sole traders and landlords must start submitting quarterly digital updates to HMRC.</p>
      <p>This guide covers everything you need to know.</p>

      <h2>What is Making Tax Digital?</h2>
      <p>MTD is HMRC's programme to move the UK tax system online. Instead of filing one annual Self Assessment return, you'll send HMRC summary updates four times a year using compatible software. The idea is to reduce errors, make tax reporting more timely, and give people a clearer picture of their tax position throughout the year.</p>

      <h2>Who is affected?</h2>
      <p>From April 2026: sole traders and landlords with income over £50,000. The threshold drops to £30,000 in April 2027 and £20,000 in April 2028. Partnerships, limited companies, and those below the threshold are not yet affected.</p>

      <h2>What you need to do</h2>
      <ol>
        <li><strong>Keep digital records</strong> — a spreadsheet, accounting software, or any digital tool that records your income and expenses</li>
        <li><strong>Submit quarterly updates</strong> — four times a year, send HMRC your total turnover and expenses using compatible software</li>
        <li><strong>File a Final Declaration</strong> — at the end of the tax year, confirm your figures and submit your annual summary (replacing the Self Assessment return)</li>
      </ol>

      <h2>What HMRC receives</h2>
      <p>Each quarterly update contains three numbers: your total turnover, your total expenses, and any other business income (usually zero). These are cumulative year-to-date figures. HMRC never sees your individual transactions.</p>

      <h2>Do I need accounting software?</h2>
      <p>No. You need compatible software to submit your figures, but that doesn't mean you need a full accounting platform. If you keep records in a spreadsheet, free bridging software like Flonancial will handle the submission for you.</p>

      <h2>The quarterly deadlines</h2>
      <p>For the standard April-to-April tax year, submissions are due roughly one month after each quarter ends: 7 August, 7 November, 7 February, and 7 May. The Final Declaration is due by 31 January of the following year.</p>

      <h2>Penalties</h2>
      <p>HMRC uses a points-based penalty system. Late submissions earn penalty points; once you hit 4 points, you get a £200 fine. However, there's a grace period for 2026/27 — no penalties for late quarterly updates in the first year.</p>

      <h2>Self Assessment vs MTD</h2>
      <p>MTD doesn't completely replace Self Assessment. You still file a Final Declaration at year-end (which is essentially the same information). The main change is the four quarterly updates throughout the year. Think of it as spreading your annual return across the year rather than doing it all in January.</p>

      <h2>How to get started</h2>
      <ol>
        <li>Sign up for MTD on gov.uk (allow up to 72 hours for processing)</li>
        <li>Choose compatible software (Flonancial is free for individuals)</li>
        <li>Connect to HMRC through the software</li>
        <li>Submit your first quarterly update after 5 July 2026</li>
      </ol>
    `,
  },
  {
    slug: "mtd-vs-self-assessment",
    title: "Making Tax Digital vs Self Assessment — What's Actually Changing?",
    metaDescription: "Confused about the difference between MTD and Self Assessment? Here's what's changing, what stays the same, and what you need to do differently.",
    category: "guide",
    publishedDate: "2026-03-22",
    content: `
      <p>If you already do Self Assessment, Making Tax Digital might sound like a completely new system. It's not — it's more of an extension. Here's what's actually changing.</p>

      <h2>What stays the same</h2>
      <ul>
        <li>You still need to report your income and expenses to HMRC</li>
        <li>The tax year is still 6 April to 5 April</li>
        <li>You still file a year-end declaration (now called the Final Declaration)</li>
        <li>Your Government Gateway account still works</li>
        <li>The tax you owe is calculated the same way</li>
      </ul>

      <h2>What changes</h2>
      <ul>
        <li><strong>Quarterly updates</strong> — instead of once a year, you send summary figures four times</li>
        <li><strong>Digital records required</strong> — paper records alone are no longer enough (a spreadsheet counts as digital)</li>
        <li><strong>Software required</strong> — you must use compatible software to submit, not the HMRC online form</li>
        <li><strong>Cumulative figures</strong> — each quarterly update includes year-to-date totals, not just the quarter</li>
      </ul>

      <h2>Is it more work?</h2>
      <p>Slightly — you're submitting four times instead of once. But each submission is much simpler than an annual return. You're sending three numbers (turnover, expenses, other income), not a full breakdown. If your records are up to date, it takes a couple of minutes per quarter.</p>
      <p>The Final Declaration at year-end is where the detail sits — much like the current Self Assessment return.</p>

      <h2>Do I still do Self Assessment?</h2>
      <p>The annual Self Assessment return is replaced by the Final Declaration under MTD. You don't file both. But the process is similar — the Final Declaration asks for the same information, just submitted through compatible software rather than the HMRC website.</p>

      <h2>Can I use the same software for both?</h2>
      <p>Some platforms (like Xero or FreeAgent) handle both quarterly updates and the Final Declaration. Bridging software like Flonancial handles quarterly updates. For the Final Declaration, you can use HMRC's own online service or another compatible product.</p>

      <h2>The practical difference</h2>
      <p>For most people, MTD means checking in with HMRC four times a year instead of once. If you already keep good records throughout the year, the quarterly updates are just a quick upload-and-submit. The biggest adjustment is remembering to do it.</p>
    `,
  },
  {
    slug: "best-free-making-tax-digital-software-2026",
    title: "Best Free Making Tax Digital Software 2026",
    metaDescription: "Looking for free MTD software? Here are the genuinely free options for Making Tax Digital for Income Tax — no trials, no hidden fees.",
    category: "comparison",
    publishedDate: "2026-03-22",
    content: `
      <p>Searching for free MTD software and finding that "free" usually means "free trial" or "free for VAT only"? Here's what's genuinely available for Making Tax Digital for Income Tax without paying.</p>

      <h2>The problem with "free"</h2>
      <p>Many tools advertise as free but come with caveats:</p>
      <ul>
        <li><strong>Free trial</strong> — free for 30 days, then £10-35/month</li>
        <li><strong>Free for VAT only</strong> — MTD for VAT is supported, but Income Tax requires a paid plan</li>
        <li><strong>Free with a bank account</strong> — FreeAgent is free if you bank with NatWest/RBS/Ulster, but that means switching banks</li>
        <li><strong>Free tier with limits</strong> — free up to a certain number of transactions, then paid</li>
      </ul>

      <h2>Genuinely free options for MTD Income Tax</h2>
      <p>As of 2026, the options for truly free MTD for Income Tax software are limited. Most providers are charging because the market is new and demand is high.</p>

      <h3>Flonancial</h3>
      <ul>
        <li><strong>Cost:</strong> Free for individuals, forever</li>
        <li><strong>Type:</strong> Bridging software</li>
        <li><strong>How it works:</strong> Upload your spreadsheet, pick your figures, submit to HMRC</li>
        <li><strong>Best for:</strong> Sole traders and landlords who already use spreadsheets</li>
        <li><strong>Limitations:</strong> Quarterly updates only (Final Declaration via HMRC's own service). No bookkeeping, invoicing, or bank feeds.</li>
      </ul>

      <h3>HMRC's own software</h3>
      <p>HMRC is developing its own free service for MTD submissions. However, as of early 2026, it's limited in scope and may not cover all business types. Check gov.uk for the latest availability.</p>

      <h2>When free isn't enough</h2>
      <p>Free bridging software is perfect if:</p>
      <ul>
        <li>You keep your own records in a spreadsheet</li>
        <li>Your finances are straightforward</li>
        <li>You just need to submit quarterly figures</li>
      </ul>
      <p>Consider paid software if you need invoicing, automatic bank categorisation, payroll, or your accountant requires a specific platform.</p>

      <h2>The bottom line</h2>
      <p>MTD is a government requirement, not a choice. If you have simple finances and already keep a spreadsheet, there's no reason to pay for it. Flonancial is built specifically for this — free, simple, and focused on getting your numbers to HMRC without the overhead of full accounting software.</p>
    `,
  },
  {
    slug: "mtd-spreadsheet-template",
    title: "Free MTD Spreadsheet Template (Download)",
    metaDescription: "Download a free Making Tax Digital spreadsheet template for sole traders and landlords. Track income, expenses, and submit to HMRC with one click.",
    category: "reference",
    publishedDate: "2026-03-22",
    content: `
      <p>If you need a spreadsheet to track your income and expenses for Making Tax Digital, you can download our free template. It's designed to work seamlessly with Flonancial's upload — but you can also use it standalone.</p>

      <h2>What's in the template</h2>
      <p>The template includes:</p>
      <ul>
        <li><strong>Income sheet</strong> — log each payment you receive with date, description, and amount</li>
        <li><strong>Expenses sheet</strong> — log each expense with date, description, category, and amount</li>
        <li><strong>Flo tab</strong> — two cells (Turnover and Expenses) that automatically sum your totals. When you upload to Flonancial, these are read instantly — no cell-picking needed.</li>
      </ul>

      <h2>Download</h2>
      <p>The template is available as an .xlsx file (compatible with Excel, Google Sheets, and LibreOffice).</p>
      <p><a href="/flonancial_template.xlsx">Download the free MTD spreadsheet template</a></p>

      <h2>Using your own spreadsheet</h2>
      <p>You don't have to use our template. Flonancial works with any spreadsheet. When you upload, you simply click the cells containing your turnover and expenses totals. The template just makes it faster by providing a Flo tab that Flonancial reads automatically.</p>

      <h2>Tips for keeping MTD-ready records</h2>
      <ul>
        <li><strong>Record every transaction</strong> — date, amount, and a brief description. HMRC requires you to keep records of each individual transaction, even though you only submit totals.</li>
        <li><strong>Keep it current</strong> — update your spreadsheet weekly or after each transaction. Quarterly submissions are quick when your records are already up to date.</li>
        <li><strong>Separate business and personal</strong> — if you use one bank account for everything, make sure your spreadsheet clearly distinguishes business transactions.</li>
        <li><strong>Back it up</strong> — keep copies in cloud storage (OneDrive, Google Drive, Dropbox). You need to retain records for at least 5 years after the filing deadline.</li>
      </ul>

      <h2>What HMRC expects from your records</h2>
      <p>Your digital records must include:</p>
      <ul>
        <li>The date of each transaction</li>
        <li>The amount</li>
        <li>A brief description or categorisation</li>
      </ul>
      <p>A well-maintained spreadsheet meets all of these requirements.</p>
    `,
  },
];
