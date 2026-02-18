import React from "react";
import { NumberFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * NumberField Component
 * Input numérico elegante e consistente
 */
const NumberField: React.FC<NumberFieldProps> = ({
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
  min,
  max,
  step = 1,
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

      <input
        id={fieldId}
        name={name}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        disabled={disabled}
        required={required}
        placeholder={placeholder || label}
        min={min}
        max={max}
        step={step}
        className="form-input"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${fieldId}-error` : undefined}
      />

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default NumberField;
