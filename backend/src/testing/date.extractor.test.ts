import { describe, expect, it } from "vitest";

import { extractDate } from "../modules/parser/extractors/dates/date.extractor.js";

import { DATE_CONFIDENCE } from "../modules/parser/extractors/dates/date.constants.js";

function utcMidnightLocalDate(year: number, month0: number, day: number) {
  // Create a local-midnight date identical to date.extractor.ts expectations.
  return new Date(year, month0, day, 0, 0, 0, 0);
}

function dateParts(d: Date) {
  return {
    y: d.getFullYear(),
    m0: d.getMonth(),
    day: d.getDate(),
  };
}

describe("extractDate", () => {
  const ref = utcMidnightLocalDate(2025, 2, 20); // 2025-03-20

  it("extracts ISO date YYYY-MM-DD (explicit)", () => {
    const r = extractDate("netflix 2025-05-01 15 usd", { referenceDate: ref });

    expect(r.source).toBe("explicit");
    expect(r.confidence).toBe(DATE_CONFIDENCE.EXPLICIT);
    expect(dateParts(r.value)).toEqual({ y: 2025, m0: 4, day: 1 }); // May
  });

  it("extracts US date MM/DD/YYYY (explicit)", () => {
    const r = extractDate("restaurant 05/12/2025 40", { referenceDate: ref });

    expect(r.source).toBe("explicit");
    expect(r.confidence).toBe(DATE_CONFIDENCE.EXPLICIT);
    expect(dateParts(r.value)).toEqual({ y: 2025, m0: 4, day: 12 });
  });

  it("extracts named-month date with year (explicit)", () => {
    const r = extractDate("movie jan 15 2025 25 usd", { referenceDate: ref });

    expect(r.source).toBe("explicit");
    expect(r.confidence).toBe(DATE_CONFIDENCE.EXPLICIT);
    expect(dateParts(r.value)).toEqual({ y: 2025, m0: 0, day: 15 });
  });

  it("extracts named-month date without year (uses reference year, explicit)", () => {
    const r = extractDate("movie feb 5 25 usd", { referenceDate: ref });

    // Pattern_NAMED_MONTH_DATE expects: <month> <day> [<year>]
    // Here: year omitted => use reference year 2025.
    expect(r.source).toBe("explicit");
    expect(r.confidence).toBe(DATE_CONFIDENCE.EXPLICIT);
    expect(dateParts(r.value)).toEqual({ y: 2025, m0: 1, day: 5 });
  });

  it("extracts simple relative keyword today (relative)", () => {
    const r = extractDate("payment today", { referenceDate: ref });

    expect(r.source).toBe("relative");
    expect(r.confidence).toBe(DATE_CONFIDENCE.RELATIVE);
    expect(dateParts(r.value)).toEqual(dateParts(ref));
  });

  it("extracts simple relative keyword yesterday (relative)", () => {
    const r = extractDate("refund yesterday", { referenceDate: ref });

    expect(r.source).toBe("relative");
    expect(r.confidence).toBe(DATE_CONFIDENCE.RELATIVE);

    const d = new Date(ref);
    d.setDate(d.getDate() - 1);
    expect(dateParts(r.value)).toEqual(dateParts(d));
  });

  it("extracts last <weekday> (relative)", () => {
    // ref is 2025-03-20 (Thursday)
    // "last monday" should be the previous Monday before ref.
    // Thursday(4) -> monday(1): daysSince = (4-1+7)%7 || 7 = 3
    // => 3 days ago => 2025-03-17
    const r = extractDate("taxi last monday", { referenceDate: ref });

    expect(r.source).toBe("relative");
    expect(r.confidence).toBe(DATE_CONFIDENCE.RELATIVE);
    expect(dateParts(r.value)).toEqual({ y: 2025, m0: 2, day: 17 });
  });

  it("falls back to reference date (default)", () => {
    const r = extractDate("completely unknown tokens", { referenceDate: ref });

    expect(r.source).toBe("default");
    expect(r.confidence).toBe(DATE_CONFIDENCE.DEFAULT);
    expect(dateParts(r.value)).toEqual(dateParts(ref));
  });
});
