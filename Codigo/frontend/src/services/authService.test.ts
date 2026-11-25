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

  it("conta com verificação em duas etapas: senha certa não guarda usuário até o código", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { precisa_2fa: true, message: "Digite o código" } });
    const r = await authService.login({ email: "ana@exemplo.com", senha: "Casa da Fe 2026" });
    expect("precisa_2fa" in r).toBe(true);
    expect(authService.getUser()).toBeNull();

    vi.mocked(axios.post).mockResolvedValueOnce({ data: { message: "ok", usuario: { id_usuario: 1, nome: "Ana", tipo: "membro" } } });
    await authService.confirmarCodigo("123456");
    const [url, corpo, opcoes] = vi.mocked(axios.post).mock.calls[1];
    expect(String(url)).toMatch(/\/auth\/login\/2fa$/);
    expect(corpo).toEqual({ codigo: "123456" });
    expect(opcoes).toMatchObject({ withCredentials: true });
    expect(authService.getUser()?.nome).toBe("Ana");
  });

  it("token do formato antigo é apagado (não vale mais no servidor)", () => {
    localStorage.setItem("token", "token-antigo");
    localStorage.setItem("usuario", JSON.stringify({ id_usuario: 1, nome: "Ana", tipo: "membro" }));
    authService.limparSessaoAntiga();
    expect(localStorage.getItem("token")).toBeNull();
    expect(authService.getUser()).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("sem token antigo, mantém a sessão atual", () => {
    localStorage.setItem("usuario", JSON.stringify({ id_usuario: 1, nome: "Ana", tipo: "membro" }));
    authService.limparSessaoAntiga();
    expect(authService.getUser()?.nome).toBe("Ana");
  });
});
