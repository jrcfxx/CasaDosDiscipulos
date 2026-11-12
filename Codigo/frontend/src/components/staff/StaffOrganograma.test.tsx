import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import StaffOrganograma from "./StaffOrganograma";
import type { StaffEstrutura, StaffItem } from "../../services/staffService";

let seq = 0;
const item = (titulo: string, pessoas: string | null, filhos: StaffItem[] = []): StaffItem => ({
  id_staff_item: ++seq,
  id_pai: null,
  titulo,
  pessoas,
  ordem: seq,
  filhos,
});

const estrutura: StaffEstrutura = {
  titulo: "Staff Casa 2026",
  subtitulo: "Diretoria e ministérios",
  itens: [
    item("Diretoria Adm.", null, [item("Presidente", "Wanderson Lino")]),
    item("Ministerial", null, [
      item("Pastoral", "Pr. Wanderson e equipe", [item("Kids", "Iza"), item("Adolescentes", null)]),
    ]),
  ],
};

describe("StaffOrganograma", () => {
  it("mostra título, grupos, funções e pessoas", () => {
    render(<StaffOrganograma estrutura={estrutura} />);
    expect(screen.getByRole("heading", { name: "Staff Casa 2026" })).toBeInTheDocument();
    const diretoria = screen.getByRole("region", { name: "Diretoria Adm." });
    expect(within(diretoria).getByText("Presidente")).toBeInTheDocument();
    expect(within(diretoria).getByText("Wanderson Lino")).toBeInTheDocument();
  });

  it("subgrupos aninhados e vaga sem pessoa como 'A definir'", () => {
    render(<StaffOrganograma estrutura={estrutura} />);
    const ministerial = screen.getByRole("region", { name: "Ministerial" });
    expect(within(ministerial).getByText("Pr. Wanderson e equipe")).toBeInTheDocument();
    expect(within(ministerial).getByText("Kids")).toBeInTheDocument();
    expect(within(ministerial).getByText("A definir")).toBeInTheDocument();
  });

  it("sem cabeçalho quando a página já tem título, e aviso quando vazio", () => {
    const { rerender } = render(<StaffOrganograma estrutura={estrutura} mostrarCabecalho={false} />);
    expect(screen.queryByRole("heading", { name: "Staff Casa 2026" })).toBeNull();
    rerender(<StaffOrganograma estrutura={{ ...estrutura, itens: [] }} />);
    expect(screen.getByText(/ainda não foi preenchido/)).toBeInTheDocument();
  });
});
