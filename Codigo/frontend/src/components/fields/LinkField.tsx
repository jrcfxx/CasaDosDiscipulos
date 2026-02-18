import React from "react";
import { TextFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * LinkField Component
 * Campo para URLs/links com validação de formato
 */
const LinkField: React.FC<TextFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder = "https://exemplo.com",
  required = false,
  disabled = false,
  className = "",
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
        type="url"
        id={fieldId}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-input"
        aria-invalid={hasError}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default LinkField;
