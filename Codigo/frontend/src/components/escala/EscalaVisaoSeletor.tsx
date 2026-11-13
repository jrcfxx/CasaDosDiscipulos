import React from "react";

/** Agenda, Semana e Mês são as visões principais; Dia e Ano abrem a partir delas */
export type EscalaVisaoTipo = "agenda" | "semana" | "mes" | "dia" | "ano";

interface EscalaVisaoSeletorProps {
  visao: EscalaVisaoTipo;
  onChange: (v: EscalaVisaoTipo) => void;
}

const PRINCIPAIS: { id: EscalaVisaoTipo; label: string }[] = [
  { id: "agenda", label: "Agenda" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

const EXTRAS: Partial<Record<EscalaVisaoTipo, string>> = { dia: "Dia", ano: "Ano" };

const EscalaVisaoSeletor: React.FC<EscalaVisaoSeletorProps> = ({ visao, onChange }) => (
  <div className="esc-segmentado" role="tablist" aria-label="Visualização">
    {PRINCIPAIS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={visao === id}
        className={visao === id ? "ativo" : ""}
        onClick={() => onChange(id)}
      >
        {label}
      </button>
    ))}
    {EXTRAS[visao] && (
      <button type="button" role="tab" aria-selected className="ativo">
        {EXTRAS[visao]}
      </button>
    )}
  </div>
);

export default EscalaVisaoSeletor;
