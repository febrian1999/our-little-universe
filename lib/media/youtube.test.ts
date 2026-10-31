import { describe, expect, it } from "vitest";
import { youtubeEmbedUrl, youtubeId } from "./youtube";

describe("youtubeId", () => {
  it("menerima youtu.be, watch, embed, dan shorts", () => {
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("menolak http, host lain, dan ID tidak valid", () => {
    expect(youtubeId("http://youtu.be/dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("https://vimeo.com/123456")).toBeNull();
    expect(youtubeId("https://youtu.be/pendek")).toBeNull();
    expect(youtubeId("bukan url")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("membentuk embed dan detik mulai", () => {
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ", 30)).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?start=30",
    );
  });

  it("mengembalikan null untuk URL tidak valid", () => {
    expect(youtubeEmbedUrl("https://vimeo.com/123456")).toBeNull();
  });
});
