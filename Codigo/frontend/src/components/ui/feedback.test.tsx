import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent, act, renderHook } from "@testing-library/react";
import ConfirmModal from "./ConfirmModal";
import BotaoCarregando from "./BotaoCarregando";
import { useAcao } from "../../hooks/useAcao";

vi.mock("focus-trap-react", () => ({
  FocusTrap: ({ children }: { children: ReactNode }) => children,
}));

/** Promise que o teste resolve quando quiser */
function adiada() {
  let resolver!: () => void;
  const promessa = new Promise<void>((r) => (resolver = r));
  return { promessa, resolver };
}

describe("ConfirmModal com ação demorada", () => {
  it("mostra 'Excluindo…', bloqueia cancelar e libera quando termina", async () => {
    const { promessa, resolver } = adiada();
    const cancelar = vi.fn();
    render(
      <ConfirmModal open title="Excluir?" message="Tem certeza?" confirmLabel="Excluir"
        textoCarregando="Excluindo…" onConfirm={() => promessa} onCancel={cancelar} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const botao = await screen.findByRole("button", { name: /Excluindo…/ });
    expect(botao).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(cancelar).not.toHaveBeenCalled();
    await act(async () => resolver());
    expect(screen.getByRole("button", { name: "Excluir" })).not.toBeDisabled();
  });

  it("ação síncrona continua funcionando como antes", () => {
    const confirmar = vi.fn();
    render(<ConfirmModal open title="T" message="M" onConfirm={confirmar} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirmar).toHaveBeenCalledOnce();
  });
});

describe("BotaoCarregando", () => {
  it("troca o texto, desativa e marca aria-busy enquanto carrega", () => {
    const { rerender } = render(<BotaoCarregando carregando={false}>Salvar</BotaoCarregando>);
    expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled();
    rerender(<BotaoCarregando carregando textoCarregando="Enviando…">Salvar</BotaoCarregando>);
    const b = screen.getByRole("button", { name: /Enviando…/ });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("aria-busy", "true");
  });
});

describe("useAcao", () => {
  it("indica execução e ignora clique duplo", async () => {
    const { result } = renderHook(() => useAcao());
    const { promessa, resolver } = adiada();
    const acao = vi.fn(() => promessa);
    let p1: Promise<unknown>;
    act(() => {
      p1 = result.current.executar(acao);
      result.current.executar(acao); // segundo clique
    });
    expect(result.current.executando).toBe(true);
    expect(acao).toHaveBeenCalledOnce();
    await act(async () => {
      resolver();
      await p1;
    });
    expect(result.current.executando).toBe(false);
  });
});
