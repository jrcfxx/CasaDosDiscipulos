import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import authService from "./authService";

vi.mock("axios", async (original) => {
  const real = await original<typeof import("axios")>();
  return { ...real, default: { ...real.default, post: vi.fn() } };
});

afterEach(() => {
  localStorage.clear();
  vi.mocked(axios.post).mockReset();
});

describe("sessão em cookie HttpOnly", () => {
  it("login guarda só os dados do usuário, nunca um token", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { message: "ok", usuario: { id_usuario: 1, nome: "Ana", tipo: "membro" } } });
    await authService.login({ email: "ana@exemplo.com", senha: "Casa da Fe 2026" });
    expect(localStorage.getItem("token")).toBeNull();
    expect(authService.getUser()?.nome).toBe("Ana");
    const [, , opcoes] = vi.mocked(axios.post).mock.calls[0];
    expect(opcoes).toMatchObject({ withCredentials: true, headers: { "X-Requested-With": "XMLHttpRequest" } });
  });

  it("converte o token antigo em cookie e apaga do navegador, sem novo login", async () => {
    localStorage.setItem("token", "token-antigo");
    localStorage.setItem("usuario", JSON.stringify({ id_usuario: 1, nome: "Ana", tipo: "membro" }));
    vi.mocked(axios.post).mockResolvedValue({ data: {} });
    await authService.migrarSessaoAntiga();
    const [url, , opcoes] = vi.mocked(axios.post).mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/sessao$/);
    expect(opcoes?.headers).toMatchObject({ Authorization: "Bearer token-antigo" });
    expect(localStorage.getItem("token")).toBeNull();
    expect(authService.getUser()).not.toBeNull(); // continua logada
  });

  it("token antigo inválido: apaga tudo e a pessoa só entra de novo", async () => {
    localStorage.setItem("token", "expirado");
    localStorage.setItem("usuario", JSON.stringify({ id_usuario: 1, nome: "Ana", tipo: "membro" }));
    vi.mocked(axios.post).mockRejectedValue(new Error("401"));
    await authService.migrarSessaoAntiga();
    expect(localStorage.getItem("token")).toBeNull();
    expect(authService.getUser()).toBeNull();
  });

  it("sem token antigo, não chama o servidor", async () => {
    await authService.migrarSessaoAntiga();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
