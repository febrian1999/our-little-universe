import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLOUDINARY_ALLOWED_FORMATS,
  buildPhotoUploadTicket,
  cloudinarySignature,
} from "./cloudinary";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cloudinarySignature", () => {
  it("mengurutkan parameter lalu menambah secret", () => {
    expect(cloudinarySignature({ timestamp: 1, folder: "olu" }, "abc")).toBe(
      "32c73a770cf09a4c89bfa60da10a448312d27950",
    );
  });
});

describe("buildPhotoUploadTicket", () => {
  it("folder dan public_id dibuat server, overwrite mati", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "olu");
    vi.stubEnv("CLOUDINARY_API_KEY", "key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");

    const ticket = buildPhotoUploadTicket("chapter-1", 1_700_000_000_000);

    expect(ticket.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/olu/image/upload",
    );
    expect(ticket.params.folder).toBe("olu/chapter-1");
    expect(ticket.params.overwrite).toBe("false");
    expect(ticket.params.allowed_formats).toBe(
      CLOUDINARY_ALLOWED_FORMATS.join(","),
    );
    expect(ticket.params.timestamp).toBe(1_700_000_000);
    expect(ticket.params.public_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(ticket.signature).toMatch(/^[0-9a-f]{40}$/);
  });

  it("menolak bila kredensial belum diisi", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    expect(() => buildPhotoUploadTicket("chapter-1")).toThrow(/Cloudinary/);
  });
});
