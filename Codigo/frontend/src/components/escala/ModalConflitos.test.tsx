import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import ModalConflitos from "./ModalConflitos";

// O jsdom não calcula layout, então o focus-trap não acha elementos focáveis.
// No teste ele só repassa o conteúdo (o comportamento testado é o do modal).
vi.mock("focus-trap-react", () => ({
  FocusTrap: ({ children }: { children: ReactNode }) => children,
}));

const conflito = {
  tipo: "duplo_instrumento",
  valido: false,
  mensagem: "Já escalado neste evento em Louvor.",
};

describe("ModalConflitos", () => {
  it("conflito confirmável: pergunta e permite continuar mesmo assim", () => {
    const confirmar = vi.fn();
    render(
      <ModalConflitos conflitos={[conflito]} onClose={() => {}} permitirForcar onConfirmarMesmoAssim={confirmar} />
    );
    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(screen.getByText(/Já escalado neste evento em Louvor/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar mesmo assim" }));
    expect(confirmar).toHaveBeenCalledOnce();
  });

  it("conflito bloqueante: só mostra e fecha, sem opção de continuar", () => {
    const fechar = vi.fn();
    render(<ModalConflitos conflitos={[conflito]} onClose={fechar} />);
    expect(screen.getByText("Conflitos na escala")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuar mesmo assim" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(fechar).toHaveBeenCalledOnce();
  });

  it("Esc fecha o aviso", () => {
    const fechar = vi.fn();
    render(<ModalConflitos conflitos={[conflito]} onClose={fechar} permitirForcar onConfirmarMesmoAssim={() => {}} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(fechar).toHaveBeenCalledOnce();
  });
});
