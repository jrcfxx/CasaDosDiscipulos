import React from "react";
import { TextareaFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * TextareaField Component
 */
const TextareaField: React.FC<TextareaFieldProps> = ({
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
  rows = 4,
  maxLength,
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
        placeholder={placeholder || label}
        rows={rows}
        maxLength={maxLength}
        className="form-textarea"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${fieldId}-error` : undefined}
      />

      {maxLength && (
        <div className="form-help">
          {value?.length || 0} / {maxLength} caracteres
        </div>
      )}

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextareaField;
