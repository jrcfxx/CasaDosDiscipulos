import { describe, expect, it } from "vitest";
import { resumirAvisosCopia } from "./avisosEscala";

describe("avisos de cópia da escala", () => {
  it("sem avisos, texto vazio", () => {
    expect(resumirAvisosCopia([])).toBe("");
    expect(resumirAvisosCopia(undefined)).toBe("");
  });

  it("diz quem ficou de fora e por quê", () => {
    const t = resumirAvisosCopia([
      { usuario: "Ana", mensagem: "Não copiado: não participa mais do ministério de Louvor" },
      { nome: "Bia", mensagem: "Conflito: Ensaio / Louvor" },
    ]);
    expect(t).toBe("Não copiados: Ana (não participa mais do ministério de Louvor); Bia (conflito: Ensaio / Louvor).");
  });

  it("resume listas longas", () => {
    const muitos = Array.from({ length: 6 }, (_, i) => ({ usuario: `P${i}`, mensagem: "Não copiado: usuário desativado" }));
    expect(resumirAvisosCopia(muitos)).toMatch(/e mais 2\.$/);
  });
});
