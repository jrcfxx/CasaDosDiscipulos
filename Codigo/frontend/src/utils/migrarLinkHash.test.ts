import { describe, expect, it, vi } from "vitest";
import { caminhoDeLinkAntigo, migrarLinkHash } from "./migrarLinkHash";

describe("links antigos com #", () => {
  it("converte /#/caminho em /caminho, mantendo a query", () => {
    expect(caminhoDeLinkAntigo("#/portal/usuario")).toBe("/portal/usuario");
    expect(caminhoDeLinkAntigo("#/usuario/modulos/preencher/9?x=1")).toBe("/usuario/modulos/preencher/9?x=1");
  });

  it("não mexe em âncoras normais nem em hash vazio", () => {
    expect(caminhoDeLinkAntigo("#campanha-nova-sede")).toBeNull();
    expect(caminhoDeLinkAntigo("")).toBeNull();
  });

  it("não aceita redirecionar para outro site", () => {
    expect(caminhoDeLinkAntigo("#//site-malicioso.com")).toBeNull();
  });

  it("troca a URL sem recarregar", () => {
    const replaceState = vi.fn();
    migrarLinkHash({ location: { hash: "#/login" } as Location, history: { replaceState } as unknown as History });
    expect(replaceState).toHaveBeenCalledWith(null, "", "/login");
  });
});
