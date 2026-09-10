import React from "react";

export type EscalaVisaoTipo = "dia" | "semana" | "mes" | "ano";

interface EscalaVisaoSeletorProps {
  visao: EscalaVisaoTipo;
  onChange: (v: EscalaVisaoTipo) => void;
}

const LABELS: { id: EscalaVisaoTipo; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "ano", label: "Ano" },
];

const EscalaVisaoSeletor: React.FC<EscalaVisaoSeletorProps> = ({ visao, onChange }) => (
  <div className="escala-visao-seletor" role="tablist" aria-label="Tipo de visualização">
    {LABELS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={visao === id}
        className={`visao-btn ${visao === id ? "ativo" : ""}`}
        onClick={() => onChange(id)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default EscalaVisaoSeletor;
