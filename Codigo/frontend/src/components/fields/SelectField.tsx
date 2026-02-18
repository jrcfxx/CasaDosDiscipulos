import React, { useState, useEffect } from "react";
import { SelectFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * SelectField Component
 * Campo de seleção dropdown com opções dinâmicas definidas pelo admin
 * O admin define as opções disponíveis no dropdown e qual é a resposta correta
 */

interface SelectData {
  opcoes: string[]; // Lista de opções disponíveis no dropdown
  correta: string; // Qual opção é a resposta correta
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
}) => {
  const fieldId = id || `field-${name}`;
  const hasError = Boolean(error);

  // Parse o valor inicial ou crie estrutura padrão
  const parseValue = (val: any): SelectData => {
    if (typeof val === "string" && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        if (parsed && parsed.opcoes && Array.isArray(parsed.opcoes)) {
          return {
            opcoes: parsed.opcoes,
            correta: parsed.correta || "",
          };
        }
        return { opcoes: [val], correta: val };
      } catch {
        return { opcoes: [val], correta: val };
      }
    }
    if (val && typeof val === "object" && val.opcoes) {
      return val;
    }
    return { opcoes: [], correta: "" };
  };

  const [data, setData] = useState<SelectData>(() => parseValue(value));
  const [novaOpcao, setNovaOpcao] = useState("");

  useEffect(() => {
    const parsed = parseValue(value);
    setData(parsed);
  }, [value]);

  const handleAddOpcao = () => {
    if (!novaOpcao.trim()) return;

    const novasOpcoes = [...data.opcoes, novaOpcao.trim()];
    const newData = { ...data, opcoes: novasOpcoes };
    setData(newData);
    onChange(JSON.stringify(newData));
    setNovaOpcao("");
  };

  const handleRemoveOpcao = (index: number) => {
    const novasOpcoes = data.opcoes.filter((_, i) => i !== index);
    const opcaoRemovida = data.opcoes[index];
    const newData = {
      opcoes: novasOpcoes,
      correta: data.correta === opcaoRemovida ? "" : data.correta,
    };
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  const handleCorretaChange = (opcao: string) => {
    const newData = { ...data, correta: opcao };
    setData(newData);
    console.log("Salvando resposta correta (select):", opcao);
    onChange(JSON.stringify(newData));
  };

  return (
    <div
      className={`form-field ${
        hasError ? "form-field--error" : ""
      } ${className}`}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className={`form-label ${required ? "form-label--required" : ""} ${
            disabled ? "form-label--disabled" : ""
          }`}
        >
          {label}
        </label>
      )}

      <div className="select-builder">
        {/* Lista de opções */}
        <div className="opcoes-list">
          {data.opcoes.map((opcao, index) => (
            <div key={index} className="opcao-row">
              <input
                type="radio"
                name={`${name}-correta`}
                checked={data.correta === opcao}
                onChange={() => handleCorretaChange(opcao)}
                disabled={disabled}
                title="Marcar como resposta correta"
              />
              <span className="opcao-text">{opcao}</span>
              <button
                type="button"
                className="btn-remove-opcao"
                onClick={() => handleRemoveOpcao(index)}
                disabled={disabled}
                title="Remover opção"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar nova opção */}
        <div className="add-opcao-row">
          <input
            type="text"
            className="form-input opcao-input"
            value={novaOpcao}
            onChange={(e) => setNovaOpcao(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOpcao();
              }
            }}
            placeholder="Digite uma opção"
            disabled={disabled}
          />
          <button
            type="button"
            className="btn-add-opcao"
            onClick={handleAddOpcao}
            disabled={disabled || !novaOpcao.trim()}
          >
            + Adicionar
          </button>
        </div>
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}

      <style>{`
        .select-builder {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .opcoes-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .opcao-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .opcao-row input[type="radio"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
          margin: 0;
          flex-shrink: 0;
        }

        .opcao-text {
          flex: 1;
          color: var(--primary-dark, #00444c);
          font-size: 0.95rem;
          word-break: break-word;
        }

        .btn-remove-opcao {
          padding: 0.25rem 0.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .btn-remove-opcao:hover:not(:disabled) {
          background: #dc2626;
        }

        .add-opcao-row {
          display: flex;
          gap: 0.5rem;
        }

        .opcao-input {
          flex: 1;
          padding: 0.65rem;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .opcao-input:focus {
          outline: none;
          border-color: var(--primary-teal, #02869b);
          box-shadow: 0 0 0 3px rgba(2, 134, 155, 0.1);
        }

        .btn-add-opcao {
          padding: 0.65rem 1.25rem;
          background: var(--primary-teal, #02869b);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-add-opcao:hover:not(:disabled) {
          background: var(--primary-dark, #00444c);
        }

        .btn-add-opcao:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default SelectField;
