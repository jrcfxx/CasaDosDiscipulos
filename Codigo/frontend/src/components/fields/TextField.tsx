import React from "react";
import { TextFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * TextField Component
 */
const TextField: React.FC<TextFieldProps> = ({
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
  type = "text",
  maxLength,
  minLength,
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
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder || label}
        maxLength={maxLength}
        minLength={minLength}
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

export default TextField;
