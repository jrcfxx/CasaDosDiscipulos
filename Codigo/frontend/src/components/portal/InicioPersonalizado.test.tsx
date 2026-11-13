import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InicioPersonalizado, { formatarDataEscala, type ResumoInicio } from "./InicioPersonalizado";

const resumo: ResumoInicio = {
  primeiro_nome: "Ana",
  pontuacao: 35,
  nivel: "Discipulado 3 – O discípulo e a Cruz",
  escola: { concluidos: 3, total: 11 },
  modulo_para_continuar: { id_modulo: 9, titulo: "[TESTE] Discipulado 4 – Seguindo o Mestre", status: "em_andamento", nivel: null },
  proximas_escalas: [
    { id_escala_evento: 1, titulo: "Culto de Domingo", data_hora: "2026-11-15T22:00:00.000Z", area: "Louvor" },
    { id_escala_evento: 2, titulo: "Culto de Quarta", data_hora: "2026-11-18T22:30:00.000Z", area: "Louvor" },
  ],
  palavra_do_dia: { texto: "O Senhor é o meu pastor", referencia: "Salmos 23:1", data: "2026-11-12" },
  notificacoes_nao_lidas: 2,
};

vi.mock("../../services/usuario", () => ({ getInicio: vi.fn() }));
import { getInicio } from "../../services/usuario";

describe("InicioPersonalizado", () => {
  it("mostra saudação, escala, módulo para continuar e palavra do dia", async () => {
    vi.mocked(getInicio).mockResolvedValue(resumo);
    render(
      <MemoryRouter>
        <InicioPersonalizado />
      </MemoryRouter>
    );
    expect(await screen.findByText(/, Ana!/)).toBeTruthy();
    expect(screen.getByText("Culto de Domingo")).toBeTruthy();
    expect(screen.getByText(/1 outra escala/)).toBeTruthy();
    expect(screen.getByText("Discipulado 4 – Seguindo o Mestre")).toBeTruthy(); // sem a marca [TESTE]
    expect(screen.getByRole("link", { name: /Continuar/ }).getAttribute("href")).toBe("/usuario/modulos/preencher/9");
    expect(screen.getByText("2 notificações novas")).toBeTruthy();
    expect(screen.getByText("O Senhor é o meu pastor")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("3");
  });

  it("sem escalas e sem módulos pendentes, mostra mensagens amigáveis", async () => {
    vi.mocked(getInicio).mockResolvedValue({ ...resumo, proximas_escalas: [], modulo_para_continuar: null, escola: { concluidos: 11, total: 11 } });
    render(
      <MemoryRouter>
        <InicioPersonalizado />
      </MemoryRouter>
    );
    expect(await screen.findByText(/não está escalado/)).toBeTruthy();
    expect(screen.getByText(/concluiu todos os módulos/)).toBeTruthy();
  });

  it("se a API falhar, o painel some sem quebrar o portal", async () => {
    vi.mocked(getInicio).mockRejectedValue(new Error("falhou"));
    const { container } = render(
      <MemoryRouter>
        <InicioPersonalizado />
      </MemoryRouter>
    );
    await vi.waitFor(() => expect(container.querySelector(".inicio")).toBeNull());
  });

  it("formata a data da escala em português", () => {
    expect(formatarDataEscala("2026-11-15T22:00:00.000Z")).toMatch(/15\/11 às \d{2}:\d{2}/);
  });
});
