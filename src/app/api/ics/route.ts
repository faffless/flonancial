export const runtime = "nodejs";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Format as UTC time for ICS (YYYYMMDDTHHMMSSZ)
function icsDateUTC(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function uid(suffix: string) {
  return `flonancial-${suffix}-${Math.random().toString(16).slice(2)}@flonancial.co`;
}

/**
 * v1 calendar: four quarterly “prepare” reminders + four “deadline” reminders per tax year.
 * This is intentionally generic and safe.
 *
 * You can refine dates once you’re happy with official timing on your content pages.
 */
function buildCalendar(): string {
  const now = new Date();
  const dtStamp = icsDateUTC(now);

  // Define a tax year starting 6 April 2026 (as a default anchor for v1).
  // You can easily change this later.
  const startYear = 2026;

  // Helper for UTC midday (avoids timezone weirdness)
  const middayUTC = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  // Quarterly deadlines: 7th of the month following quarter end (changed March 2026 to align with VAT).
  const deadlines = [
    { label: "Quarter 1 update window", deadline: middayUTC(startYear, 8, 7) },
    { label: "Quarter 2 update window", deadline: middayUTC(startYear, 11, 7) },
    { label: "Quarter 3 update window", deadline: middayUTC(startYear + 1, 2, 7) },
    { label: "Quarter 4 update window", deadline: middayUTC(startYear + 1, 5, 7) },
  ];

  const events: string[] = [];

  for (let i = 0; i < deadlines.length; i++) {
    const d = deadlines[i].deadline;

    // “Prepare” reminder 14 days before
    const prep = new Date(d.getTime());
    prep.setUTCDate(prep.getUTCDate() - 14);

    events.push(
      [
        "BEGIN:VEVENT",
        `UID:${uid(`prep-${i}`)}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${icsDateUTC(prep)}`,
        `DTEND:${icsDateUTC(new Date(prep.getTime() + 60 * 60 * 1000))}`,
        `SUMMARY:MTD prep: gather records (${deadlines[i].label})`,
        "DESCRIPTION:Reminder to tidy up records for your quarterly update. Flonancial (informational).",
        "END:VEVENT",
      ].join("\r\n")
    );

    // Deadline reminder (on the date)
    events.push(
      [
        "BEGIN:VEVENT",
        `UID:${uid(`deadline-${i}`)}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${icsDateUTC(d)}`,
        `DTEND:${icsDateUTC(new Date(d.getTime() + 60 * 60 * 1000))}`,
        `SUMMARY:MTD: quarterly update milestone (${deadlines[i].label})`,
        "DESCRIPTION:Quarterly update milestone. Check HMRC guidance or your software for official deadlines.",
        "END:VEVENT",
      ].join("\r\n")
    );
  }

  const cal = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flonancial//MTD Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Flonancial — MTD Deadlines",
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return cal;
}

export async function GET() {
  const ics = buildCalendar();
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="flonancial-mtd-deadlines.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}