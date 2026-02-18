import React from "react";
import { SelectFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * TrueFalseField Component
 * Campo Verdadeiro/Falso para questões de quiz
 */
const TrueFalseField: React.FC<SelectFieldProps> = ({
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

  const options = [
    { value: "true", label: "Verdadeiro" },
    { value: "false", label: "Falso" },
  ];

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

      <select
        id={fieldId}
        name={name}
        value={String(value) ?? ""}
        onChange={(e) => onChange(e.target.value === "true")}
        disabled={disabled}
        required={required}
        className="form-select"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${fieldId}-error` : undefined}
      >
        <option value="" disabled>
          Selecione uma opção
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default TrueFalseField;
