import { describe, expect, it } from "vitest";
import { avaliarSenha, senhaAceita } from "./regrasSenha";

const pessoa = { telefone: "31999990000", email: "maria@exemplo.com" };

describe("regras de senha (espelho do servidor)", () => {
  it("recusa senha curta", () => {
    expect(senhaAceita("abc12", pessoa)).toBe(false);
  });
  it("recusa o próprio telefone, mesmo com máscara", () => {
    expect(senhaAceita("31999990000", pessoa)).toBe(false);
    expect(senhaAceita("(31) 99999-0000", pessoa)).toBe(false);
  });
  it("recusa o próprio e-mail", () => {
    expect(senhaAceita("maria@exemplo.com", pessoa)).toBe(false);
  });
  it("recusa sequência e repetição", () => {
    expect(senhaAceita("12345678", pessoa)).toBe(false);
    expect(senhaAceita("aaaaaaaa", pessoa)).toBe(false);
  });
  it("aceita senha boa e marca todas as regras", () => {
    expect(senhaAceita("Casa da Fé 2026", pessoa)).toBe(true);
    expect(avaliarSenha("Casa da Fé 2026", pessoa).every((r) => r.ok)).toBe(true);
  });
  it("campo vazio não aparece como cumprido", () => {
    expect(avaliarSenha("", pessoa).some((r) => r.ok)).toBe(false);
  });
});
