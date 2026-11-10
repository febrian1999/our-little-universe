import { describe, expect, it } from "vitest";
import { jakartaDay, summarizeVisits } from "./visit-stats";

describe("jakartaDay", () => {
  it("memakai tanggal Asia/Jakarta, bukan UTC", () => {
    // 31 Okt 2026 18:30 UTC = 1 Nov 2026 01:30 WIB.
    expect(jakartaDay(new Date("2026-10-31T18:30:00Z"))).toBe("2026-11-01");
    expect(jakartaDay(new Date("2026-10-31T16:00:00Z"))).toBe("2026-10-31");
  });
});

describe("summarizeVisits", () => {
  const now = new Date("2026-10-31T10:00:00+07:00");

  it("mengisi hari kosong dengan nol dan menghitung unik per hari", () => {
    const { series, totals } = summarizeVisits(
      [
        {
          createdAt: new Date("2026-10-31T01:00:00+07:00"),
          action: "room_view",
          sessionHash: "a",
        },
        {
          createdAt: new Date("2026-10-31T02:00:00+07:00"),
          action: "room_view",
          sessionHash: "a",
        },
        {
          createdAt: new Date("2026-10-30T09:00:00+07:00"),
          action: "room_view",
          sessionHash: "b",
        },
        {
          createdAt: new Date("2026-10-30T09:05:00+07:00"),
          action: "upload",
          sessionHash: "b",
        },
      ],
      3,
      now,
    );

    expect(series.map((day) => day.day)).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
    ]);
    expect(series[0]).toEqual({ day: "2026-10-29", views: 0, uniques: 0 });
    expect(series[1]).toEqual({ day: "2026-10-30", views: 1, uniques: 1 });
    expect(series[2]).toEqual({ day: "2026-10-31", views: 2, uniques: 1 });
    expect(totals).toEqual({ room_view: 3, upload: 1 });
  });

  it("mengabaikan baris di luar jendela", () => {
    const { series } = summarizeVisits(
      [
        {
          createdAt: new Date("2026-10-01T09:00:00+07:00"),
          action: "room_view",
          sessionHash: "a",
        },
      ],
      2,
      now,
    );
    expect(series.every((day) => day.views === 0)).toBe(true);
  });
});
