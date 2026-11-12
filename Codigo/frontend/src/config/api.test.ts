import { describe, it, expect } from "vitest";
import { assetsBaseDe } from "./api";

describe("assetsBaseDe", () => {
  it("produção (API relativa) usa o mesmo domínio: base vazia, nunca localhost", () => {
    expect(assetsBaseDe("/api")).toBe("");
    expect(assetsBaseDe("/api/")).toBe("");
    expect(`${assetsBaseDe("/api")}/uploads/foto.jpg`).toBe("/uploads/foto.jpg");
  });
  it("desenvolvimento (API absoluta) aponta para o backend local", () => {
    expect(assetsBaseDe("http://localhost:3001/api")).toBe("http://localhost:3001");
  });
});
