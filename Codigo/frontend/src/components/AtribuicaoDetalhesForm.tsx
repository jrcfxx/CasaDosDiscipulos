import React from "react";
import { getCamposPorArea, type CampoConfig } from "../config/ministerioCampos";
import "../style/AtribuicaoDetalhesForm.css";

interface AtribuicaoDetalhesFormProps {
  nomeArea: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

function renderCampo(
  campo: CampoConfig,
  valor: string,
  onChange: (v: string) => void
) {
  const commonClass = "atrib-detalhe-field";
  if (campo.tipo === "select") {
    return (
      <select
        className={commonClass}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Selecione --</option>
        {campo.opcoes?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (campo.tipo === "textarea") {
    return (
      <textarea
        className={commonClass}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      className={commonClass}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={campo.placeholder}
    />
  );
}

const AtribuicaoDetalhesForm: React.FC<AtribuicaoDetalhesFormProps> = ({
  nomeArea,
  value,
  onChange,
}) => {
  const campos = getCamposPorArea(nomeArea);

  const handleChange = (chave: string, val: string) => {
    onChange({ ...value, [chave]: val });
  };

  return (
    <div className="atrib-detalhes-form">
      {campos.map((campo) => (
        <div key={campo.chave} className="atrib-detalhe-row">
          <label className="atrib-detalhe-label">{campo.label}</label>
          {renderCampo(campo, value[campo.chave] || "", (v) => handleChange(campo.chave, v))}
        </div>
      ))}
    </div>
  );
};

export default AtribuicaoDetalhesForm;

/** Exibe resumo dos detalhes (para o chip/card) */
export function DetalhesResumo({
  detalhes,
  nomeArea,
}: {
  detalhes?: Record<string, string | number | null> | null;
  nomeArea: string;
}) {
  if (!detalhes || Object.keys(detalhes).length === 0) return null;

  const campos = getCamposPorArea(nomeArea);
  const items: string[] = [];

  campos.forEach((c) => {
    const v = detalhes[c.chave];
    if (v != null && String(v).trim()) {
      const label = c.tipo === "select" && c.opcoes
        ? c.opcoes.find((o) => o.value === v)?.label ?? String(v)
        : String(v);
      if (label.length <= 30) {
        items.push(label);
      } else {
        items.push(label.slice(0, 27) + "...");
      }
    }
  });

  if (items.length === 0) return null;
  return (
    <div className="detalhes-resumo">
      {items.map((txt, i) => (
        <span key={i} className="detalhes-resumo-item">{txt}</span>
      ))}
    </div>
  );
}
