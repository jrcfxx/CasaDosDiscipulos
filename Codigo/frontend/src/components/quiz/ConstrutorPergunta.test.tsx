import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ConstrutorPergunta, { indiceDaCerta } from "./ConstrutorPergunta";

/** Monta o construtor guardando o valor como a tela do quiz faz */
function Montar({ tipo, inicial = "" }: { tipo: string; inicial?: string }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <ConstrutorPergunta id={1} tipo={tipo} valor={valor} onChange={setValor} />
      <output data-testid="valor">{valor}</output>
    </>
  );
}
const valorSalvo = () => JSON.parse(screen.getByTestId("valor").textContent || "{}");
const opcao = (n: number) => screen.getByLabelText(`Texto da opção ${n}`);
const marcar = (n: number) => fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Opção ${n} `) }));

describe("Lista de opções", () => {
  it("marcar a certa ANTES de escrever continua marcada depois de escrever", () => {
    render(<Montar tipo="select" />);
    marcar(2);
    expect(screen.getByText("Certa: opção 2")).toBeTruthy();
    fireEvent.change(opcao(1), { target: { value: "Gênesis" } });
    fireEvent.change(opcao(2), { target: { value: "Êxodo" } });
    expect(valorSalvo()).toEqual({ opcoes: ["Gênesis", "Êxodo"], correta: "Êxodo", correta_indice: 1 });
  });

  it("editar o texto da certa mantém a marcação", () => {
    render(<Montar tipo="select" />);
    fireEvent.change(opcao(1), { target: { value: "A" } });
    fireEvent.change(opcao(2), { target: { value: "B" } });
    marcar(1);
    fireEvent.change(opcao(1), { target: { value: "A editado" } });
    expect(valorSalvo().correta).toBe("A editado");
    expect(valorSalvo().correta_indice).toBe(0);
  });

  it("texto repetido não faz a marcação pular para outra opção", () => {
    render(<Montar tipo="select" />);
    fireEvent.change(opcao(1), { target: { value: "X" } });
    fireEvent.change(opcao(2), { target: { value: "Y" } });
    fireEvent.click(screen.getByText("+ Adicionar opção"));
    fireEvent.change(opcao(3), { target: { value: "Y" } });
    marcar(3);
    expect(screen.getByText("Certa: opção 3")).toBeTruthy();
  });

  it("remover uma opção antes da certa mantém a mesma certa", () => {
    render(<Montar tipo="select" />);
    fireEvent.change(opcao(1), { target: { value: "A" } });
    fireEvent.change(opcao(2), { target: { value: "B" } });
    fireEvent.click(screen.getByText("+ Adicionar opção"));
    fireEvent.change(opcao(3), { target: { value: "C" } });
    marcar(3);
    fireEvent.click(screen.getByLabelText("Remover opção 1"));
    expect(valorSalvo()).toEqual({ opcoes: ["B", "C"], correta: "C", correta_indice: 1 });
  });

  it("listas antigas (sem a posição) acham a certa pelo texto", () => {
    expect(indiceDaCerta(JSON.stringify({ opcoes: ["a", "b"], correta: "b" }), ["a", "b"])).toBe(1);
    expect(indiceDaCerta(JSON.stringify({ opcoes: ["a", "b"], correta: "" }), ["a", "b"])).toBe(-1);
  });
});

describe("Múltipla escolha", () => {
  it("só uma certa; marcar outra troca a marcação", () => {
    render(<Montar tipo="multipla_escolha" />);
    fireEvent.click(screen.getByRole("button", { name: /^Alternativa A não é certa/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Alternativa B não é certa/ }));
    expect(screen.getByText("Resposta certa: B")).toBeTruthy();
  });
});
