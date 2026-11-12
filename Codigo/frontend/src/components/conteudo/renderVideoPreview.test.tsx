import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { convertToEmbedUrl, renderVideoPreview } from "./renderVideoPreview";

describe("convertToEmbedUrl", () => {
  it("YouTube (watch, youtu.be e embed) vira embed com legenda", () => {
    const esperado = "https://www.youtube.com/embed/dQw4w9WgXcQ?cc_load_policy=1";
    expect(convertToEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(esperado);
    expect(convertToEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(esperado);
  });
  it("Vimeo vira player", () => {
    expect(convertToEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
  });
  it("arquivo de vídeo passa direto; outros links não são vídeo", () => {
    expect(convertToEmbedUrl("https://site.com/culto.mp4")).toBe("https://site.com/culto.mp4");
    expect(convertToEmbedUrl("https://site.com/pagina")).toBeNull();
  });
});

describe("renderVideoPreview", () => {
  it("link que não é vídeo vira link clicável", () => {
    const { container } = render(<>{renderVideoPreview("https://site.com/pagina")}</>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://site.com/pagina");
  });
  it("YouTube vira iframe; .mp4 vira <video>", () => {
    const yt = render(<>{renderVideoPreview("https://youtu.be/dQw4w9WgXcQ")}</>);
    expect(yt.container.querySelector("iframe")).not.toBeNull();
    const mp4 = render(<>{renderVideoPreview("https://site.com/culto.mp4")}</>);
    expect(mp4.container.querySelector("video source")?.getAttribute("src")).toBe("https://site.com/culto.mp4");
  });
});
