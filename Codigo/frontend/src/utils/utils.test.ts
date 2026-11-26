import { describe, it, expect } from "vitest";
import {
  formatarTelefoneInput,
  normalizarTelefoneParaEnvio,
} from "./telefoneUtils";
import { getErrorMessage } from "./errorUtils";
import { parseReferenciaBiblica } from "./bibliaUtils";

describe("telefone", () => {
  it("mantém só dígitos e no máximo 11", () => {
    expect(formatarTelefoneInput("(31) 99999-0000 ramal 5")).toBe("31999990000");
  });
  it("normaliza para envio e recusa número curto", () => {
    expect(normalizarTelefoneParaEnvio(" (31) 99999-0000 ")).toBe("31999990000");
    expect(normalizarTelefoneParaEnvio("99999")).toBeNull();
    expect(normalizarTelefoneParaEnvio("")).toBeNull();
    expect(normalizarTelefoneParaEnvio(null)).toBeNull();
  });
});

describe("getErrorMessage", () => {
  it("prioriza a mensagem da API", () => {
    const err = Object.assign(new Error("Request failed"), {
      response: { data: { error: "Esta pessoa já está escalada nesta área" } },
    });
    expect(getErrorMessage(err)).toBe("Esta pessoa já está escalada nesta área");
  });
  it("usa a mensagem do Error ou o fallback", () => {
    expect(getErrorMessage(new Error("falhou"))).toBe("falhou");
    expect(getErrorMessage("x", "Padrão")).toBe("Padrão");
  });
});

describe("referência bíblica", () => {
  it("entende versículo, intervalo e livro numerado", () => {
    expect(parseReferenciaBiblica("João 3:16")).toMatchObject({ capitulo: 3, versoInicio: 16, versoFim: 16 });
    expect(parseReferenciaBiblica("1 Coríntios 13:4-7")).toMatchObject({ capitulo: 13, versoInicio: 4, versoFim: 7 });
  });
  it("limita intervalos longos e recusa entradas inválidas", () => {
    expect(parseReferenciaBiblica("Salmos 119:1-176")?.versoFim).toBe(21);
    expect(parseReferenciaBiblica("Livro Inexistente 1:1")).toBeNull();
    expect(parseReferenciaBiblica("João 3:16-10")).toBeNull();
    expect(parseReferenciaBiblica("ab")).toBeNull();
  });
});
