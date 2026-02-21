import React, { useEffect, useRef, useState } from "react";
import { FocusTrap } from "focus-trap-react";
import "./InputModal.css";

export interface InputModalProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({
  open,
  title,
  label = "Valor",
  placeholder = "",
  defaultValue = "",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, defaultValue]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm(value.trim());
    }
  };

  const handleConfirm = () => {
    onConfirm(value.trim());
  };

  if (!open) return null;

  return (
    <FocusTrap
      active={open}
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      <div
        className="input-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-modal-title"
        onKeyDown={handleKeyDown}
      >
      <div
        className="input-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="input-modal-title" className="input-modal-title">
          {title}
        </h2>
        <div className="input-modal-field">
          <label htmlFor="input-modal-input" className="input-modal-label">
            {label}
          </label>
          <input
            ref={inputRef}
            id="input-modal-input"
            type="text"
            className="input-modal-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
          />
        </div>
        <div className="input-modal-actions">
          <button
            type="button"
            className="input-modal-btn input-modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="input-modal-btn input-modal-btn-confirm"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      </div>
    </FocusTrap>
  );
};

export default InputModal;
