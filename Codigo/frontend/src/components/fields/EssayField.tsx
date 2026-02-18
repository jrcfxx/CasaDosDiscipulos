import React from "react";
import { TextareaFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * EssayField Component
 * Campo de resposta discursiva para questões de quiz
 */
const EssayField: React.FC<TextareaFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  className = "",
  rows = 6,
  maxLength = 1000,
}) => {
  const fieldId = id || `field-${name}`;
  const hasError = Boolean(error);

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

      <textarea
        id={fieldId}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder || "Digite sua resposta..."}
        rows={rows}
        maxLength={maxLength}
        className="form-textarea"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${fieldId}-error` : undefined}
      />

      <div className="form-help">
        {value?.length || 0} / {maxLength} caracteres
      </div>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default EssayField;
