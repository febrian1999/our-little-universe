import { describe, expect, it } from "vitest";
import { buildAuditRow, redactSecrets } from "./audit";

describe("redactSecrets", () => {
  it("membuang field rahasia di level atas", () => {
    expect(
      redactSecrets({ title: "Halo", apiKey: "x", SESSION_SECRET: "y" }),
    ).toEqual({ title: "Halo" });
  });

  it("membuang field rahasia bertingkat tanpa merusak struktur lain", () => {
    const input = {
      room: { title: "Music", telegramToken: "abc" },
      items: [{ caption: "a", privateKey: "k" }, { caption: "b" }],
    };
    expect(redactSecrets(input)).toEqual({
      room: { title: "Music" },
      items: [{ caption: "a" }, { caption: "b" }],
    });
  });

  it("mengembalikan nilai primitif apa adanya", () => {
    expect(redactSecrets("teks")).toBe("teks");
    expect(redactSecrets(42)).toBe(42);
    expect(redactSecrets(null)).toBeNull();
  });
});

describe("buildAuditRow", () => {
  it("mengisi kolom wajib dan null untuk yang kosong", () => {
    const row = buildAuditRow({
      actorId: "u1",
      action: "soft_delete",
      entity: "item",
      entityId: "i1",
    });
    expect(row).toEqual({
      actorId: "u1",
      action: "soft_delete",
      entity: "item",
      entityId: "i1",
      chapterId: null,
      before: null,
      after: null,
    });
  });

  it("membersihkan payload before/after", () => {
    const row = buildAuditRow({
      actorId: null,
      action: "create",
      entity: "playlist",
      entityId: "p1",
      chapterId: "c1",
      after: { title: "Mix", url: "https://open.spotify.com/playlist/x", apiKey: "x" },
    });
    expect(row.after).toEqual({
      title: "Mix",
      url: "https://open.spotify.com/playlist/x",
    });
    expect(row.chapterId).toBe("c1");
  });
});
