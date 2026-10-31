import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudinaryLoader } from "./image-loader";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cloudinaryLoader", () => {
  it("membentuk URL transformasi dari publicId", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "olu");
    expect(cloudinaryLoader({ src: "olu/seed/foto", width: 400 })).toBe(
      "https://res.cloudinary.com/olu/image/upload/f_auto,q_auto,w_400/olu/seed/foto",
    );
    expect(
      cloudinaryLoader({ src: "olu/seed/foto", width: 800, quality: 70 }),
    ).toContain("q_70");
  });

  it("membiarkan URL penuh apa adanya", () => {
    expect(
      cloudinaryLoader({ src: "https://contoh.com/foto.jpg", width: 400 }),
    ).toBe("https://contoh.com/foto.jpg");
  });

  it("mengembalikan src bila cloud name belum diisi", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
    expect(cloudinaryLoader({ src: "olu/seed/foto", width: 400 })).toBe(
      "olu/seed/foto",
    );
  });
});
