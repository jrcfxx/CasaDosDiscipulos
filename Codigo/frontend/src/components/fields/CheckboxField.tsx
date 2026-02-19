import React, { useState, useEffect } from "react";
import { SelectFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * CheckboxField Component
 * Campo de múltiplas seleções com alternativas dinâmicas para questões de quiz
 * Permite adicionar/remover alternativas e marcar múltiplas respostas corretas
 */

interface CheckboxData {
  alternativas: { texto: string; correta: boolean }[];
}

const CheckboxField: React.FC<SelectFieldProps> = ({
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
  const parseValue = (val: any): CheckboxData => {
    if (typeof val === "string" && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        // Garantir que cada alternativa tenha a propriedade correta definida
        if (
          parsed &&
          parsed.alternativas &&
          Array.isArray(parsed.alternativas)
        ) {
          return {
            alternativas: parsed.alternativas.map((alt: any) => ({
              texto: alt.texto || "",
              correta: Boolean(alt.correta),
            })),
          };
        }
        return { alternativas: [{ texto: val, correta: true }] };
      } catch {
        return { alternativas: [{ texto: val, correta: true }] };
      }
    }
    if (val && typeof val === "object" && val.alternativas) {
      return {
        alternativas: val.alternativas.map((alt: any) => ({
          texto: alt.texto || "",
          correta: Boolean(alt.correta),
        })),
      };
    }
    return { alternativas: [] };
  };

  const [data, setData] = useState<CheckboxData>(() => parseValue(value));

  useEffect(() => {
    const parsed = parseValue(value);
    setData(parsed);
  }, [value]);

  const handleAddAlternativa = () => {
    const novasAlternativas = [
      ...data.alternativas,
      { texto: "", correta: false },
    ];
    const newData = { alternativas: novasAlternativas };
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  const handleRemoveAlternativa = (index: number) => {
    const novasAlternativas = data.alternativas.filter((_, i) => i !== index);
    const newData = { alternativas: novasAlternativas };
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  const handleTextoChange = (index: number, texto: string) => {
    const novasAlternativas = data.alternativas.map((alt, i) =>
      i === index ? { ...alt, texto } : alt
    );
    const newData = { alternativas: novasAlternativas };
    setData(newData);
    onChange(JSON.stringify(newData));
  };

  const handleCorretaChange = (index: number) => {
    // Checkbox permite múltiplas alternativas corretas - apenas alterna o estado da alternativa clicada
    const novasAlternativas = data.alternativas.map((alt, i) =>
      i === index ? { ...alt, correta: !alt.correta } : alt
    );
    const newData = { alternativas: novasAlternativas };
    setData(newData);
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

      <div className="checkbox-builder">
        {data.alternativas.map((alternativa, index) => (
          <div key={index} className="alternativa-row">
            <div className="alternativa-checkbox">
              <input
                type="checkbox"
                checked={alternativa.correta}
                onChange={() => handleCorretaChange(index)}
                disabled={disabled}
                title="Marcar como resposta correta"
              />
              <span className="alternativa-label">
                {String.fromCharCode(65 + index)}
              </span>
            </div>
            <input
              type="text"
              className="form-input alternativa-input"
              value={alternativa.texto}
              onChange={(e) => handleTextoChange(index, e.target.value)}
              placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
              disabled={disabled}
            />
            <button
              type="button"
              className="btn-remove-alternativa"
              onClick={() => handleRemoveAlternativa(index)}
              disabled={disabled || data.alternativas.length <= 1}
              title="Remover alternativa"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          className="btn-add-alternativa"
          onClick={handleAddAlternativa}
          disabled={disabled}
        >
          + Adicionar Alternativa
        </button>
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}

      <style>{`
        .checkbox-builder {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alternativa-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .alternativa-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 60px;
        }

        .alternativa-checkbox input[type="checkbox"] {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .alternativa-label {
          font-weight: 600;
          color: var(--primary-dark, #00444c);
          font-size: 0.95rem;
        }

        .alternativa-input {
          flex: 1;
          padding: 0.65rem;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .alternativa-input:focus {
          outline: none;
          border-color: var(--primary-teal, #02869b);
          box-shadow: 0 0 0 3px rgba(2, 134, 155, 0.1);
        }

        .btn-remove-alternativa {
          padding: 0.5rem 0.75rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-remove-alternativa:hover:not(:disabled) {
          background: #dc2626;
          transform: scale(1.05);
        }

        .btn-remove-alternativa:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .btn-add-alternativa {
          padding: 0.75rem 1.25rem;
          background: var(--primary-teal, #02869b);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .btn-add-alternativa:hover:not(:disabled) {
          background: var(--primary-dark, #00444c);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 68, 76, 0.2);
        }

        .btn-add-alternativa:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CheckboxField;
