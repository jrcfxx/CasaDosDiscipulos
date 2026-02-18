import React from "react";
import { DateFieldProps } from "../../types";
import "../../style/tokens.css";
import "../../style/form.css";

/**
 * DateField Component
 */
const DateField: React.FC<DateFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  min,
  max,
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
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
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

export default DateField;
