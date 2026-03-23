export type DemoTransaction = {
  id: number;
  date: string;
  type: "income" | "expense";
  amount: number;
  description: string;
};

export type DemoBusiness = {
  id: string;
  name: string;
  business_type: "sole_trader" | "uk_property" | "overseas_property";
  accounting_year_end: string;
  emoji: string;
  tagline: string;
  blurb: string;

  // Optional homepage display overrides
  display_turnover?: number;
  display_transactions_per_month?: number;

  transactions: DemoTransaction[];
};

const sole_trader_year_end = "04-05";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getBusinessTurnover(business: DemoBusiness): number {
  if (typeof business.display_turnover === "number") {
    return business.display_turnover;
  }

  return business.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getBusinessTransactionsPerMonth(business: DemoBusiness): number {
  if (typeof business.display_transactions_per_month === "number") {
    return business.display_transactions_per_month;
  }

  const months = new Set(
    business.transactions.map((t) => t.date.slice(0, 7)) // YYYY-MM
  );

  if (months.size === 0) return 0;

  return Math.round((business.transactions.length / months.size) * 10) / 10;
}

export function getDemoBusiness(id: string): DemoBusiness | null {
  return demoBusinesses.find((b) => b.id === id) ?? null;
}

// ─── Demo businesses ──────────────────────────────────────────────────────────

export const demoBusinesses: DemoBusiness[] = [
  // 1. Steve — Bricklayer who already tracks everything in Excel
  {
    id: "steve",
    name: "Steve Barker",
    business_type: "sole_trader",
    accounting_year_end: sole_trader_year_end,
    emoji: "🧱",
    tagline: "Bricklayer & general builder",
    blurb: "Steve has been laying bricks for 18 years and runs his own business in the West Midlands. He already tracks every job and expense in an Excel spreadsheet — has done for years. When MTD came in, he uploaded his existing spreadsheet to Flonancial, picked the cells with his totals, and submitted to HMRC in under five minutes. No new software to learn.",
    transactions: [
      // Q1: Apr–Jun (income ~£18k, expenses ~£4.5k)
      { id: 1, date: "2025-04-07", type: "income", amount: 2800.0, description: "Garden wall build — Mr & Mrs Collins, Solihull" },
      { id: 2, date: "2025-04-10", type: "expense", amount: 385.0, description: "Bricks, sand, cement — Travis Perkins" },
      { id: 3, date: "2025-04-14", type: "income", amount: 1200.0, description: "Repointing — terraced house, Kings Heath" },
      { id: 4, date: "2025-04-21", type: "expense", amount: 195.0, description: "Van fuel — April" },
      { id: 5, date: "2025-04-28", type: "income", amount: 3400.0, description: "Single-storey extension brickwork — The Nguyens" },
      { id: 6, date: "2025-05-02", type: "expense", amount: 620.0, description: "Bricks and blocks — bulk order Jewson" },
      { id: 7, date: "2025-05-08", type: "income", amount: 950.0, description: "Chimney repair and reflaunching" },
      { id: 8, date: "2025-05-14", type: "income", amount: 2200.0, description: "Patio and retaining wall — Moseley" },
      { id: 9, date: "2025-05-19", type: "expense", amount: 145.0, description: "Angle grinder discs and PPE" },
      { id: 10, date: "2025-05-26", type: "expense", amount: 210.0, description: "Van fuel — May" },
      { id: 11, date: "2025-06-02", type: "income", amount: 1800.0, description: "Garage conversion brickwork — Shirley" },
      { id: 12, date: "2025-06-09", type: "expense", amount: 480.0, description: "Engineering bricks and lintels" },
      { id: 13, date: "2025-06-16", type: "income", amount: 3200.0, description: "New build — subcontract brickwork day rate x8" },
      { id: 14, date: "2025-06-23", type: "income", amount: 1400.0, description: "Boundary wall — commercial unit Tyseley" },
      { id: 15, date: "2025-06-27", type: "expense", amount: 320.0, description: "Sand and aggregate delivery" },
      { id: 16, date: "2025-06-30", type: "expense", amount: 185.0, description: "Van fuel — June" },
      { id: 17, date: "2025-06-30", type: "expense", amount: 68.0, description: "Public liability insurance — quarterly" },

      // Q2: Jul–Sep (income ~£19k, expenses ~£4.8k)
      { id: 18, date: "2025-07-03", type: "income", amount: 2600.0, description: "Extension brickwork — semi-detached, Erdington" },
      { id: 19, date: "2025-07-08", type: "expense", amount: 540.0, description: "Bricks, mortar, DPC — Buildbase" },
      { id: 20, date: "2025-07-14", type: "income", amount: 1100.0, description: "Garden wall and pillars — Sutton Coldfield" },
      { id: 21, date: "2025-07-21", type: "income", amount: 3500.0, description: "Subcontract brickwork — new builds x10 days" },
      { id: 22, date: "2025-07-25", type: "expense", amount: 195.0, description: "Van fuel — July" },
      { id: 23, date: "2025-07-30", type: "expense", amount: 280.0, description: "Scaffolding hire — chimney job" },
      { id: 24, date: "2025-08-04", type: "income", amount: 1800.0, description: "Chimney rebuild — Victorian terrace, Harborne" },
      { id: 25, date: "2025-08-11", type: "income", amount: 2400.0, description: "Porch and front wall build — Bromsgrove" },
      { id: 26, date: "2025-08-15", type: "expense", amount: 410.0, description: "Facing bricks — matching Victorian originals" },
      { id: 27, date: "2025-08-22", type: "expense", amount: 205.0, description: "Van fuel — August" },
      { id: 28, date: "2025-08-28", type: "income", amount: 1500.0, description: "Repointing whole gable end — 3 days" },
      { id: 29, date: "2025-09-03", type: "income", amount: 2800.0, description: "Double garage build — brickwork" },
      { id: 30, date: "2025-09-08", type: "expense", amount: 690.0, description: "Blocks, bricks, cement — large order" },
      { id: 31, date: "2025-09-15", type: "income", amount: 1250.0, description: "Garden retaining wall — sloped garden" },
      { id: 32, date: "2025-09-22", type: "income", amount: 2100.0, description: "Side extension brickwork — Wylde Green" },
      { id: 33, date: "2025-09-26", type: "expense", amount: 190.0, description: "Van fuel — September" },
      { id: 34, date: "2025-09-30", type: "expense", amount: 125.0, description: "NHBC registration renewal" },
      { id: 35, date: "2025-09-30", type: "expense", amount: 68.0, description: "Public liability insurance — quarterly" },

      // Q3: Oct–Dec (income ~£17k, expenses ~£4.2k)
      { id: 36, date: "2025-10-02", type: "income", amount: 3200.0, description: "Subcontract — housing development x8 days" },
      { id: 37, date: "2025-10-07", type: "expense", amount: 85.0, description: "Spirit level and new trowels" },
      { id: 38, date: "2025-10-13", type: "income", amount: 1600.0, description: "Fireplace surround build — period property" },
      { id: 39, date: "2025-10-20", type: "expense", amount: 520.0, description: "Bricks and materials — October jobs" },
      { id: 40, date: "2025-10-27", type: "income", amount: 2200.0, description: "Rear extension brickwork — Selly Oak" },
      { id: 41, date: "2025-10-31", type: "expense", amount: 195.0, description: "Van fuel — October" },
      { id: 42, date: "2025-11-05", type: "income", amount: 1400.0, description: "Boundary wall rebuild — storm damage" },
      { id: 43, date: "2025-11-10", type: "expense", amount: 380.0, description: "Bricks and frostproof mortar" },
      { id: 44, date: "2025-11-17", type: "income", amount: 2800.0, description: "Loft conversion brickwork — dormer cheeks" },
      { id: 45, date: "2025-11-24", type: "expense", amount: 285.0, description: "Scaffolding hire — loft conversion" },
      { id: 46, date: "2025-11-28", type: "expense", amount: 180.0, description: "Van fuel — November" },
      { id: 47, date: "2025-12-01", type: "income", amount: 1900.0, description: "Internal blockwork — commercial conversion" },
      { id: 48, date: "2025-12-08", type: "income", amount: 2100.0, description: "Side return extension — Edgbaston" },
      { id: 49, date: "2025-12-12", type: "expense", amount: 440.0, description: "Blocks, lintels, cavity trays" },
      { id: 50, date: "2025-12-19", type: "income", amount: 1500.0, description: "Emergency wall repair — neighbour dispute rebuild" },
      { id: 51, date: "2025-12-23", type: "expense", amount: 165.0, description: "Van fuel — December" },
      { id: 52, date: "2025-12-31", type: "expense", amount: 68.0, description: "Public liability insurance — quarterly" },

      // Q4: Jan–Mar (income ~£18k, expenses ~£4.5k)
      { id: 53, date: "2026-01-06", type: "income", amount: 1800.0, description: "Internal walls — new year renovation project" },
      { id: 54, date: "2026-01-12", type: "expense", amount: 350.0, description: "Blocks and mortar — January jobs" },
      { id: 55, date: "2026-01-19", type: "income", amount: 2600.0, description: "Kitchen extension brickwork — Hall Green" },
      { id: 56, date: "2026-01-26", type: "expense", amount: 580.0, description: "Facing bricks and cement — bulk order" },
      { id: 57, date: "2026-01-31", type: "expense", amount: 195.0, description: "Van fuel — January" },
      { id: 58, date: "2026-02-03", type: "income", amount: 3500.0, description: "Subcontract — new build development x9 days" },
      { id: 59, date: "2026-02-10", type: "income", amount: 1400.0, description: "Garden wall and steps — sloped site" },
      { id: 60, date: "2026-02-16", type: "expense", amount: 420.0, description: "Engineering bricks and padstones" },
      { id: 61, date: "2026-02-23", type: "income", amount: 2200.0, description: "Garage and driveway wall — Knowle" },
      { id: 62, date: "2026-02-28", type: "expense", amount: 205.0, description: "Van fuel — February" },
      { id: 63, date: "2026-03-04", type: "income", amount: 2800.0, description: "Rear extension — two-storey brickwork" },
      { id: 64, date: "2026-03-09", type: "expense", amount: 650.0, description: "Large brick order — extension job" },
      { id: 65, date: "2026-03-16", type: "income", amount: 1600.0, description: "Repointing — large detached house" },
      { id: 66, date: "2026-03-23", type: "income", amount: 2100.0, description: "Conservatory base and dwarf wall" },
      { id: 67, date: "2026-03-28", type: "expense", amount: 190.0, description: "Van fuel — March" },
      { id: 68, date: "2026-03-31", type: "expense", amount: 68.0, description: "Public liability insurance — quarterly" },
      { id: 69, date: "2026-03-31", type: "expense", amount: 240.0, description: "Annual van service and MOT" },
    ],
  },

  // 2. Sally — Mobile music teacher who tracks on her phone via Google Sheets
  {
    id: "sally",
    name: "Sally Okonkwo",
    business_type: "sole_trader",
    accounting_year_end: sole_trader_year_end,
    emoji: "🎹",
    tagline: "Mobile music teacher",
    blurb: "Sally teaches piano and guitar at pupils\u0027 homes across South London. She logs every lesson and expense straight into Google Sheets on her phone between appointments. At the end of each quarter, she exports the spreadsheet as an .xlsx file and uploads it to Flonancial. She was worried MTD would mean buying expensive software — turns out it didn\u0027t.",
    transactions: [
      // Q1: Apr–Jun (income ~£14.5k, expenses ~£1.5k)
      { id: 100, date: "2025-04-07", type: "income", amount: 1120.0, description: "Week 1 — 28 lessons at £40" },
      { id: 101, date: "2025-04-14", type: "income", amount: 1160.0, description: "Week 2 — 29 lessons at £40" },
      { id: 102, date: "2025-04-18", type: "expense", amount: 65.0, description: "Petrol — April week 1-2" },
      { id: 103, date: "2025-04-21", type: "income", amount: 1080.0, description: "Week 3 — 27 lessons at £40" },
      { id: 104, date: "2025-04-28", type: "income", amount: 1120.0, description: "Week 4 — 28 lessons at £40" },
      { id: 105, date: "2025-04-30", type: "expense", amount: 58.0, description: "Petrol — April week 3-4" },
      { id: 106, date: "2025-04-30", type: "expense", amount: 42.0, description: "Sheet music — exam prep books x3" },
      { id: 107, date: "2025-05-05", type: "income", amount: 1200.0, description: "Week 5 — 30 lessons at £40" },
      { id: 108, date: "2025-05-12", type: "income", amount: 1080.0, description: "Week 6 — 27 lessons (half-term cancellations)" },
      { id: 109, date: "2025-05-16", type: "expense", amount: 62.0, description: "Petrol — May week 1-2" },
      { id: 110, date: "2025-05-19", type: "income", amount: 800.0, description: "Week 7 — 20 lessons (half-term)" },
      { id: 111, date: "2025-05-26", type: "income", amount: 1160.0, description: "Week 8 — 29 lessons at £40" },
      { id: 112, date: "2025-05-31", type: "expense", amount: 55.0, description: "Petrol — May week 3-4" },
      { id: 113, date: "2025-06-02", type: "income", amount: 1200.0, description: "Week 9 — 30 lessons at £40" },
      { id: 114, date: "2025-06-06", type: "expense", amount: 120.0, description: "DBS check renewal" },
      { id: 115, date: "2025-06-09", type: "income", amount: 1160.0, description: "Week 10 — 29 lessons at £40" },
      { id: 116, date: "2025-06-13", type: "expense", amount: 60.0, description: "Petrol — June week 1-2" },
      { id: 117, date: "2025-06-16", type: "income", amount: 1120.0, description: "Week 11 — 28 lessons at £40" },
      { id: 118, date: "2025-06-23", type: "income", amount: 1200.0, description: "Week 12 — 30 lessons at £40" },
      { id: 119, date: "2025-06-27", type: "expense", amount: 58.0, description: "Petrol — June week 3-4" },
      { id: 120, date: "2025-06-30", type: "income", amount: 450.0, description: "ABRSM exam accompaniment fees x6" },
      { id: 121, date: "2025-06-30", type: "expense", amount: 95.0, description: "Music Teachers\u0027 Association membership" },

      // Q2: Jul–Sep (income ~£13k, expenses ~£1.8k)
      { id: 122, date: "2025-07-02", type: "income", amount: 1200.0, description: "Week 13 — 30 lessons at £40" },
      { id: 123, date: "2025-07-07", type: "income", amount: 1120.0, description: "Week 14 — 28 lessons at £40" },
      { id: 124, date: "2025-07-11", type: "expense", amount: 62.0, description: "Petrol — July week 1-2" },
      { id: 125, date: "2025-07-14", type: "income", amount: 640.0, description: "Week 15 — 16 lessons (summer drop-off)" },
      { id: 126, date: "2025-07-21", type: "income", amount: 480.0, description: "Week 16 — 12 lessons (school holidays)" },
      { id: 127, date: "2025-07-25", type: "expense", amount: 38.0, description: "Petrol — July week 3-4" },
      { id: 128, date: "2025-07-28", type: "income", amount: 400.0, description: "Summer music camp — helper fee x2 days" },
      { id: 129, date: "2025-08-04", type: "income", amount: 480.0, description: "Week 17 — 12 lessons (summer)" },
      { id: 130, date: "2025-08-11", type: "income", amount: 520.0, description: "Week 18 — 13 lessons (summer)" },
      { id: 131, date: "2025-08-15", type: "expense", amount: 35.0, description: "Petrol — August week 1-2" },
      { id: 132, date: "2025-08-18", type: "income", amount: 560.0, description: "Week 19 — 14 lessons (some return early)" },
      { id: 133, date: "2025-08-25", type: "income", amount: 800.0, description: "Week 20 — 20 lessons (back to school prep)" },
      { id: 134, date: "2025-08-29", type: "expense", amount: 48.0, description: "Petrol — August week 3-4" },
      { id: 135, date: "2025-08-31", type: "expense", amount: 280.0, description: "Car service and MOT" },
      { id: 136, date: "2025-09-01", type: "income", amount: 1200.0, description: "Week 21 — 30 lessons at £40 (full restart)" },
      { id: 137, date: "2025-09-05", type: "expense", amount: 85.0, description: "New pupil starter packs — printed materials" },
      { id: 138, date: "2025-09-08", type: "income", amount: 1280.0, description: "Week 22 — 32 lessons at £40 (3 new pupils)" },
      { id: 139, date: "2025-09-12", type: "expense", amount: 65.0, description: "Petrol — September week 1-2" },
      { id: 140, date: "2025-09-15", type: "income", amount: 1280.0, description: "Week 23 — 32 lessons at £40" },
      { id: 141, date: "2025-09-22", type: "income", amount: 1280.0, description: "Week 24 — 32 lessons at £40" },
      { id: 142, date: "2025-09-26", type: "expense", amount: 68.0, description: "Petrol — September week 3-4" },
      { id: 143, date: "2025-09-30", type: "expense", amount: 145.0, description: "Professional indemnity insurance — annual" },
      { id: 144, date: "2025-09-30", type: "income", amount: 680.0, description: "Saturday group workshop x4 weeks" },

      // Q3: Oct–Dec (income ~£14k, expenses ~£1.4k)
      { id: 145, date: "2025-10-06", type: "income", amount: 1280.0, description: "Week 25 — 32 lessons at £40" },
      { id: 146, date: "2025-10-10", type: "expense", amount: 62.0, description: "Petrol — October week 1-2" },
      { id: 147, date: "2025-10-13", type: "income", amount: 1280.0, description: "Week 26 — 32 lessons at £40" },
      { id: 148, date: "2025-10-20", type: "income", amount: 1280.0, description: "Week 27 — 32 lessons at £40" },
      { id: 149, date: "2025-10-24", type: "expense", amount: 58.0, description: "Petrol — October week 3-4" },
      { id: 150, date: "2025-10-27", type: "income", amount: 960.0, description: "Week 28 — 24 lessons (half-term)" },
      { id: 151, date: "2025-10-31", type: "expense", amount: 75.0, description: "Sheet music and theory books order" },
      { id: 152, date: "2025-11-03", type: "income", amount: 1280.0, description: "Week 29 — 32 lessons at £40" },
      { id: 153, date: "2025-11-10", type: "income", amount: 1280.0, description: "Week 30 — 32 lessons at £40" },
      { id: 154, date: "2025-11-14", type: "expense", amount: 62.0, description: "Petrol — November week 1-2" },
      { id: 155, date: "2025-11-17", type: "income", amount: 1280.0, description: "Week 31 — 32 lessons at £40" },
      { id: 156, date: "2025-11-24", type: "income", amount: 1280.0, description: "Week 32 — 32 lessons at £40" },
      { id: 157, date: "2025-11-28", type: "expense", amount: 58.0, description: "Petrol — November week 3-4" },
      { id: 158, date: "2025-12-01", type: "income", amount: 1280.0, description: "Week 33 — 32 lessons at £40" },
      { id: 159, date: "2025-12-08", type: "income", amount: 1280.0, description: "Week 34 — 32 lessons at £40" },
      { id: 160, date: "2025-12-12", type: "expense", amount: 55.0, description: "Petrol — December week 1-2" },
      { id: 161, date: "2025-12-15", type: "income", amount: 960.0, description: "Week 35 — 24 lessons (wind-down)" },
      { id: 162, date: "2025-12-18", type: "income", amount: 850.0, description: "Christmas concert accompaniment fees" },
      { id: 163, date: "2025-12-20", type: "expense", amount: 120.0, description: "Keyboard sustain pedal + music stand replacement" },

      // Q4: Jan–Mar (income ~£15.5k, expenses ~£1.6k)
      { id: 164, date: "2026-01-05", type: "income", amount: 1280.0, description: "Week 36 — 32 lessons at £40" },
      { id: 165, date: "2026-01-09", type: "expense", amount: 62.0, description: "Petrol — January week 1-2" },
      { id: 166, date: "2026-01-12", type: "income", amount: 1360.0, description: "Week 37 — 34 lessons at £40 (2 new pupils)" },
      { id: 167, date: "2026-01-19", type: "income", amount: 1360.0, description: "Week 38 — 34 lessons at £40" },
      { id: 168, date: "2026-01-23", type: "expense", amount: 65.0, description: "Petrol — January week 3-4" },
      { id: 169, date: "2026-01-26", type: "income", amount: 1360.0, description: "Week 39 — 34 lessons at £40" },
      { id: 170, date: "2026-01-31", type: "expense", amount: 48.0, description: "Theory exam prep materials" },
      { id: 171, date: "2026-02-02", type: "income", amount: 1360.0, description: "Week 40 — 34 lessons at £40" },
      { id: 172, date: "2026-02-06", type: "expense", amount: 68.0, description: "Petrol — February week 1-2" },
      { id: 173, date: "2026-02-09", type: "income", amount: 1360.0, description: "Week 41 — 34 lessons at £40" },
      { id: 174, date: "2026-02-16", type: "income", amount: 1000.0, description: "Week 42 — 25 lessons (half-term)" },
      { id: 175, date: "2026-02-23", type: "income", amount: 1360.0, description: "Week 43 — 34 lessons at £40" },
      { id: 176, date: "2026-02-27", type: "expense", amount: 65.0, description: "Petrol — February week 3-4" },
      { id: 177, date: "2026-03-02", type: "income", amount: 1360.0, description: "Week 44 — 34 lessons at £40" },
      { id: 178, date: "2026-03-09", type: "income", amount: 1360.0, description: "Week 45 — 34 lessons at £40" },
      { id: 179, date: "2026-03-13", type: "expense", amount: 68.0, description: "Petrol — March week 1-2" },
      { id: 180, date: "2026-03-16", type: "income", amount: 1360.0, description: "Week 46 — 34 lessons at £40" },
      { id: 181, date: "2026-03-20", type: "income", amount: 600.0, description: "ABRSM exam accompaniment fees x8" },
      { id: 182, date: "2026-03-23", type: "income", amount: 1360.0, description: "Week 47 — 34 lessons at £40" },
      { id: 183, date: "2026-03-27", type: "expense", amount: 65.0, description: "Petrol — March week 3-4" },
      { id: 184, date: "2026-03-31", type: "expense", amount: 180.0, description: "Annual car insurance top-up (business use)" },
    ],
  },

  // 3. The Harringtons — Buy-to-let landlords, 4 properties, simple rent spreadsheet
  {
    id: "harringtons",
    name: "The Harringtons",
    business_type: "uk_property",
    accounting_year_end: sole_trader_year_end,
    emoji: "🏠",
    tagline: "Buy-to-let landlords · 4 properties",
    blurb: "David and Margaret have built up a portfolio of four rental properties in Leeds over the last decade. Margaret keeps a simple spreadsheet with monthly rent received and expenses. Their letting agent handles most of the day-to-day, so their records are straightforward — mostly rent in, agent fees and repairs out. Exactly the kind of case Flonancial was built for.",
    transactions: [
      // Monthly rents: Flat A £1,050, Flat B £1,200, House C £1,350, Flat D £1,250 = £4,850/mo
      // Q1: Apr–Jun
      { id: 200, date: "2025-04-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 201, date: "2025-04-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 202, date: "2025-04-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 203, date: "2025-04-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 204, date: "2025-04-10", type: "expense", amount: 485.0, description: "Letting agent fee — April (10%)" },
      { id: 205, date: "2025-04-18", type: "expense", amount: 220.0, description: "Boiler service — Flat A" },
      { id: 206, date: "2025-05-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 207, date: "2025-05-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 208, date: "2025-05-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 209, date: "2025-05-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 210, date: "2025-05-08", type: "expense", amount: 485.0, description: "Letting agent fee — May" },
      { id: 211, date: "2025-05-22", type: "expense", amount: 380.0, description: "Plumber — leaking bath, Flat B" },
      { id: 212, date: "2025-06-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 213, date: "2025-06-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 214, date: "2025-06-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 215, date: "2025-06-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 216, date: "2025-06-10", type: "expense", amount: 485.0, description: "Letting agent fee — June" },
      { id: 217, date: "2025-06-20", type: "expense", amount: 340.0, description: "Gas safety certs — all 4 properties" },

      // Q2: Jul–Sep
      { id: 218, date: "2025-07-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 219, date: "2025-07-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 220, date: "2025-07-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 221, date: "2025-07-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 222, date: "2025-07-10", type: "expense", amount: 485.0, description: "Letting agent fee — July" },
      { id: 223, date: "2025-07-15", type: "expense", amount: 850.0, description: "New oven and hob — House C (old one died)" },
      { id: 224, date: "2025-08-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 225, date: "2025-08-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 226, date: "2025-08-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 227, date: "2025-08-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 228, date: "2025-08-08", type: "expense", amount: 485.0, description: "Letting agent fee — August" },
      { id: 229, date: "2025-08-20", type: "expense", amount: 560.0, description: "Exterior painting — Flat A communal areas" },
      { id: 230, date: "2025-09-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 231, date: "2025-09-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 232, date: "2025-09-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 233, date: "2025-09-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 234, date: "2025-09-10", type: "expense", amount: 485.0, description: "Letting agent fee — September" },
      { id: 235, date: "2025-09-18", type: "expense", amount: 195.0, description: "EPC renewal — Flat D" },

      // Q3: Oct–Dec
      { id: 236, date: "2025-10-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 237, date: "2025-10-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 238, date: "2025-10-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 239, date: "2025-10-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 240, date: "2025-10-10", type: "expense", amount: 485.0, description: "Letting agent fee — October" },
      { id: 241, date: "2025-10-22", type: "expense", amount: 1200.0, description: "New boiler — Flat D (emergency replacement)" },
      { id: 242, date: "2025-11-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 243, date: "2025-11-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 244, date: "2025-11-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 245, date: "2025-11-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 246, date: "2025-11-08", type: "expense", amount: 485.0, description: "Letting agent fee — November" },
      { id: 247, date: "2025-11-15", type: "expense", amount: 420.0, description: "Landlord insurance renewal — all 4 properties" },
      { id: 248, date: "2025-12-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 249, date: "2025-12-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 250, date: "2025-12-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 251, date: "2025-12-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 252, date: "2025-12-08", type: "expense", amount: 485.0, description: "Letting agent fee — December" },
      { id: 253, date: "2025-12-18", type: "expense", amount: 290.0, description: "Emergency electrician — Flat B tripped fuse board" },

      // Q4: Jan–Mar
      { id: 254, date: "2026-01-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 255, date: "2026-01-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 256, date: "2026-01-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 257, date: "2026-01-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 258, date: "2026-01-10", type: "expense", amount: 485.0, description: "Letting agent fee — January" },
      { id: 259, date: "2026-01-20", type: "expense", amount: 520.0, description: "Carpet replacement — Flat A (tenant changeover)" },
      { id: 260, date: "2026-02-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 261, date: "2026-02-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 262, date: "2026-02-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 263, date: "2026-02-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 264, date: "2026-02-08", type: "expense", amount: 485.0, description: "Letting agent fee — February" },
      { id: 265, date: "2026-02-22", type: "expense", amount: 165.0, description: "Smoke and CO alarm replacements — all properties" },
      { id: 266, date: "2026-03-01", type: "income", amount: 1050.0, description: "Rent — Flat A, 8 Victoria Terrace" },
      { id: 267, date: "2026-03-01", type: "income", amount: 1200.0, description: "Rent — Flat B, 22 Park Row" },
      { id: 268, date: "2026-03-01", type: "income", amount: 1350.0, description: "Rent — House C, 5 Cardigan Lane" },
      { id: 269, date: "2026-03-01", type: "income", amount: 1250.0, description: "Rent — Flat D, 41 Roundhay Road" },
      { id: 270, date: "2026-03-10", type: "expense", amount: 485.0, description: "Letting agent fee — March" },
      { id: 271, date: "2026-03-25", type: "expense", amount: 340.0, description: "Gas safety certs renewal — all 4 properties" },
    ],
  },
  {
    id: "demo-4",
    name: "Priya Sharma",
    business_type: "sole_trader" as const,
    accounting_year_end: sole_trader_year_end,
    emoji: "🎨",
    tagline: "Freelance graphic designer",
    blurb: "Priya works from home designing logos, branding, and marketing materials for small businesses. She invoices monthly, pays for Adobe subscriptions and a co-working desk one day a week.",
    display_turnover: 48000,
    transactions: [
      // Q1 — Apr–Jun 2025
      { id: 400, date: "2025-04-15", type: "income" as const, amount: 2400.00, description: "Logo & brand identity — Bloom Bakery" },
      { id: 401, date: "2025-04-28", type: "income" as const, amount: 1800.00, description: "Website graphics — KJ Plumbing" },
      { id: 402, date: "2025-05-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — May" },
      { id: 403, date: "2025-05-12", type: "income" as const, amount: 3200.00, description: "Brand refresh — Horizon Fitness" },
      { id: 404, date: "2025-05-20", type: "expense" as const, amount: 180.00, description: "Co-working desk — May" },
      { id: 405, date: "2025-06-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — June" },
      { id: 406, date: "2025-06-10", type: "income" as const, amount: 1500.00, description: "Social media templates — The Wellness Room" },
      { id: 407, date: "2025-06-18", type: "income" as const, amount: 2800.00, description: "Packaging design — Patel's Kitchen" },
      { id: 408, date: "2025-06-30", type: "expense" as const, amount: 180.00, description: "Co-working desk — June" },

      // Q2 — Jul–Sep 2025
      { id: 409, date: "2025-07-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — July" },
      { id: 410, date: "2025-07-08", type: "income" as const, amount: 4200.00, description: "Full rebrand — Spark Electrical" },
      { id: 411, date: "2025-07-20", type: "expense" as const, amount: 180.00, description: "Co-working desk — July" },
      { id: 412, date: "2025-08-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — August" },
      { id: 413, date: "2025-08-14", type: "income" as const, amount: 2000.00, description: "Menu design — Café Lune" },
      { id: 414, date: "2025-08-25", type: "income" as const, amount: 1600.00, description: "Business cards & flyers — D&R Landscaping" },
      { id: 415, date: "2025-09-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — September" },
      { id: 416, date: "2025-09-10", type: "income" as const, amount: 3500.00, description: "E-commerce graphics — ThreadBox" },
      { id: 417, date: "2025-09-15", type: "expense" as const, amount: 180.00, description: "Co-working desk — September" },
      { id: 418, date: "2025-09-28", type: "expense" as const, amount: 320.00, description: "New drawing tablet" },

      // Q3 — Oct–Dec 2025
      { id: 419, date: "2025-10-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — October" },
      { id: 420, date: "2025-10-12", type: "income" as const, amount: 2600.00, description: "Brochure design — Maple Dental" },
      { id: 421, date: "2025-10-22", type: "income" as const, amount: 1900.00, description: "Event graphics — Southside 10K" },
      { id: 422, date: "2025-11-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — November" },
      { id: 423, date: "2025-11-08", type: "income" as const, amount: 3800.00, description: "Website & print — Green Valley Vets" },
      { id: 424, date: "2025-11-20", type: "expense" as const, amount: 180.00, description: "Co-working desk — November" },
      { id: 425, date: "2025-12-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — December" },
      { id: 426, date: "2025-12-10", type: "income" as const, amount: 2200.00, description: "Christmas campaign — Belle & Bow" },
      { id: 427, date: "2025-12-18", type: "expense" as const, amount: 89.00, description: "Stock imagery licence renewal" },

      // Q4 — Jan–Mar 2026
      { id: 428, date: "2026-01-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — January" },
      { id: 429, date: "2026-01-15", type: "income" as const, amount: 2800.00, description: "New year rebrand — Oasis Hair" },
      { id: 430, date: "2026-02-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — February" },
      { id: 431, date: "2026-02-12", type: "income" as const, amount: 3400.00, description: "Brand identity — PureForm Pilates" },
      { id: 432, date: "2026-02-20", type: "expense" as const, amount: 180.00, description: "Co-working desk — February" },
      { id: 433, date: "2026-03-01", type: "expense" as const, amount: 54.99, description: "Adobe Creative Cloud — March" },
      { id: 434, date: "2026-03-10", type: "income" as const, amount: 2100.00, description: "Signage design — Mills & Co Accountants" },
      { id: 435, date: "2026-03-22", type: "income" as const, amount: 1800.00, description: "Social pack — FreshFit Meals" },
    ],
  },
  {
    id: "demo-5",
    name: "Marcus Williams",
    business_type: "sole_trader" as const,
    accounting_year_end: sole_trader_year_end,
    emoji: "🚕",
    tagline: "Private hire & taxi driver",
    blurb: "Marcus drives for Uber and Bolt in Birmingham, picks up private bookings at weekends, and tracks all his fares and vehicle costs in a spreadsheet.",
    display_turnover: 65000,
    transactions: [
      // Q1 — Apr–Jun 2025
      { id: 500, date: "2025-04-07", type: "income" as const, amount: 1420.00, description: "Uber fares — week 1" },
      { id: 501, date: "2025-04-14", type: "income" as const, amount: 1380.00, description: "Uber fares — week 2" },
      { id: 502, date: "2025-04-21", type: "income" as const, amount: 1510.00, description: "Uber fares — week 3" },
      { id: 503, date: "2025-04-28", type: "income" as const, amount: 1290.00, description: "Uber fares — week 4" },
      { id: 504, date: "2025-04-30", type: "expense" as const, amount: 620.00, description: "Fuel — April" },
      { id: 505, date: "2025-04-30", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — April" },
      { id: 506, date: "2025-05-05", type: "income" as const, amount: 1350.00, description: "Uber & Bolt fares — week 5" },
      { id: 507, date: "2025-05-12", type: "income" as const, amount: 1480.00, description: "Uber & Bolt fares — week 6" },
      { id: 508, date: "2025-05-17", type: "income" as const, amount: 320.00, description: "Private airport run — Sat" },
      { id: 509, date: "2025-05-19", type: "income" as const, amount: 1400.00, description: "Uber fares — week 7" },
      { id: 510, date: "2025-05-26", type: "income" as const, amount: 1360.00, description: "Uber fares — week 8" },
      { id: 511, date: "2025-05-31", type: "expense" as const, amount: 590.00, description: "Fuel — May" },
      { id: 512, date: "2025-06-02", type: "income" as const, amount: 1440.00, description: "Uber & Bolt fares — week 9" },
      { id: 513, date: "2025-06-09", type: "income" as const, amount: 1520.00, description: "Uber fares — week 10" },
      { id: 514, date: "2025-06-14", type: "income" as const, amount: 280.00, description: "Private wedding transfer" },
      { id: 515, date: "2025-06-16", type: "income" as const, amount: 1390.00, description: "Uber fares — week 11" },
      { id: 516, date: "2025-06-23", type: "income" as const, amount: 1460.00, description: "Uber fares — week 12" },
      { id: 517, date: "2025-06-30", type: "expense" as const, amount: 640.00, description: "Fuel — June" },
      { id: 518, date: "2025-06-30", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — June" },
      { id: 519, date: "2025-06-30", type: "expense" as const, amount: 45.00, description: "Phone mount & charger" },

      // Q2 — Jul–Sep 2025
      { id: 520, date: "2025-07-07", type: "income" as const, amount: 1480.00, description: "Uber fares — week 13" },
      { id: 521, date: "2025-07-14", type: "income" as const, amount: 1550.00, description: "Uber & Bolt fares — week 14" },
      { id: 522, date: "2025-07-21", type: "income" as const, amount: 1410.00, description: "Uber fares — week 15" },
      { id: 523, date: "2025-07-28", type: "income" as const, amount: 1500.00, description: "Uber fares — week 16" },
      { id: 524, date: "2025-07-31", type: "expense" as const, amount: 660.00, description: "Fuel — July" },
      { id: 525, date: "2025-08-04", type: "income" as const, amount: 1320.00, description: "Uber fares — week 17" },
      { id: 526, date: "2025-08-11", type: "income" as const, amount: 1470.00, description: "Uber fares — week 18" },
      { id: 527, date: "2025-08-18", type: "income" as const, amount: 1380.00, description: "Uber fares — week 19" },
      { id: 528, date: "2025-08-25", type: "income" as const, amount: 1430.00, description: "Uber fares — week 20" },
      { id: 529, date: "2025-08-31", type: "expense" as const, amount: 610.00, description: "Fuel — August" },
      { id: 530, date: "2025-08-31", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — August" },
      { id: 531, date: "2025-09-01", type: "expense" as const, amount: 380.00, description: "MOT & service" },
      { id: 532, date: "2025-09-08", type: "income" as const, amount: 1460.00, description: "Uber fares — week 21" },
      { id: 533, date: "2025-09-15", type: "income" as const, amount: 1530.00, description: "Uber & Bolt fares — week 22" },
      { id: 534, date: "2025-09-22", type: "income" as const, amount: 1400.00, description: "Uber fares — week 23" },
      { id: 535, date: "2025-09-29", type: "income" as const, amount: 1490.00, description: "Uber fares — week 24" },
      { id: 536, date: "2025-09-30", type: "expense" as const, amount: 630.00, description: "Fuel — September" },

      // Q3 — Oct–Dec 2025
      { id: 537, date: "2025-10-06", type: "income" as const, amount: 1510.00, description: "Uber fares — week 25" },
      { id: 538, date: "2025-10-13", type: "income" as const, amount: 1440.00, description: "Uber fares — week 26" },
      { id: 539, date: "2025-10-20", type: "income" as const, amount: 1390.00, description: "Uber fares — week 27" },
      { id: 540, date: "2025-10-27", type: "income" as const, amount: 1470.00, description: "Uber fares — week 28" },
      { id: 541, date: "2025-10-31", type: "expense" as const, amount: 650.00, description: "Fuel — October" },
      { id: 542, date: "2025-10-31", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — October" },
      { id: 543, date: "2025-11-03", type: "income" as const, amount: 1520.00, description: "Uber & Bolt fares — week 29" },
      { id: 544, date: "2025-11-10", type: "income" as const, amount: 1460.00, description: "Uber fares — week 30" },
      { id: 545, date: "2025-11-17", type: "income" as const, amount: 1380.00, description: "Uber fares — week 31" },
      { id: 546, date: "2025-11-24", type: "income" as const, amount: 1500.00, description: "Uber fares — week 32" },
      { id: 547, date: "2025-11-30", type: "expense" as const, amount: 620.00, description: "Fuel — November" },
      { id: 548, date: "2025-12-01", type: "income" as const, amount: 1580.00, description: "Uber fares — week 33 (busy Dec)" },
      { id: 549, date: "2025-12-08", type: "income" as const, amount: 1620.00, description: "Uber fares — week 34" },
      { id: 550, date: "2025-12-15", type: "income" as const, amount: 1700.00, description: "Uber & Bolt fares — week 35 (Xmas)" },
      { id: 551, date: "2025-12-22", type: "income" as const, amount: 1850.00, description: "Uber fares — week 36 (Xmas peak)" },
      { id: 552, date: "2025-12-31", type: "expense" as const, amount: 700.00, description: "Fuel — December" },
      { id: 553, date: "2025-12-31", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — December" },
      { id: 554, date: "2025-12-31", type: "expense" as const, amount: 240.00, description: "New tyres (front pair)" },

      // Q4 — Jan–Mar 2026
      { id: 555, date: "2026-01-05", type: "income" as const, amount: 1350.00, description: "Uber fares — week 37 (quiet Jan)" },
      { id: 556, date: "2026-01-12", type: "income" as const, amount: 1410.00, description: "Uber fares — week 38" },
      { id: 557, date: "2026-01-19", type: "income" as const, amount: 1380.00, description: "Uber fares — week 39" },
      { id: 558, date: "2026-01-26", type: "income" as const, amount: 1420.00, description: "Uber fares — week 40" },
      { id: 559, date: "2026-01-31", type: "expense" as const, amount: 600.00, description: "Fuel — January" },
      { id: 560, date: "2026-02-02", type: "income" as const, amount: 1450.00, description: "Uber fares — week 41" },
      { id: 561, date: "2026-02-09", type: "income" as const, amount: 1490.00, description: "Uber & Bolt fares — week 42" },
      { id: 562, date: "2026-02-16", type: "income" as const, amount: 1400.00, description: "Uber fares — week 43" },
      { id: 563, date: "2026-02-23", type: "income" as const, amount: 1460.00, description: "Uber fares — week 44" },
      { id: 564, date: "2026-02-28", type: "expense" as const, amount: 610.00, description: "Fuel — February" },
      { id: 565, date: "2026-02-28", type: "expense" as const, amount: 185.00, description: "Vehicle insurance — February" },
      { id: 566, date: "2026-03-02", type: "income" as const, amount: 1480.00, description: "Uber fares — week 45" },
      { id: 567, date: "2026-03-09", type: "income" as const, amount: 1520.00, description: "Uber fares — week 46" },
      { id: 568, date: "2026-03-16", type: "income" as const, amount: 1440.00, description: "Uber fares — week 47" },
      { id: 569, date: "2026-03-23", type: "income" as const, amount: 1500.00, description: "Uber fares — week 48" },
      { id: 570, date: "2026-03-31", type: "expense" as const, amount: 640.00, description: "Fuel — March" },
      { id: 571, date: "2026-03-31", type: "expense" as const, amount: 75.00, description: "Private hire licence renewal" },
    ],
  },
];
