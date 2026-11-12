import React, { useEffect, useRef, useState } from "react";
import FocusTrapComponent from "./FocusTrap";
import "./InputModal.css";


export interface InputModalProps {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  /** text (padrão) ou date (AAAA-MM-DD) */
  inputType?: "text" | "date";
  hint?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Se devolver uma Promise, mostra `textoCarregando` com spinner até terminar */
  onConfirm: (value: string) => void | Promise<unknown>;
  onCancel: () => void;
  textoCarregando?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  open,
  title,
  label = "Valor",
  placeholder = "",
  defaultValue = "",
  inputType = "text",
  hint,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  textoCarregando = "Processando…",
}) => {
  const [value, setValue] = useState(defaultValue);
  const [executando, setExecutando] = useState(false);
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

  useEffect(() => {
    if (!open) setExecutando(false);
  }, [open]);

  const cancelar = () => {
    if (!executando) onCancel();
  };

  const handleConfirm = async () => {
    if (executando) return;
    const resultado = onConfirm(value.trim());
    if (resultado && typeof (resultado as Promise<unknown>).then === "function") {
      setExecutando(true);
      try {
        await resultado;
      } catch {
        /* quem chamou já trata e mostra o erro */
      } finally {
        setExecutando(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") cancelar();
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (!open) return null;

  return (
    <FocusTrapComponent
      active={open}
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="input-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-modal-title"
        aria-busy={executando}
        onKeyDown={handleKeyDown}
        onClick={cancelar}
      >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="input-modal" onClick={(e) => e.stopPropagation()}>
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
            type={inputType}
            className="input-modal-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            aria-describedby={hint ? "input-modal-hint" : undefined}
          />
          {hint && (
            <p id="input-modal-hint" className="input-modal-hint">
              {hint}
            </p>
          )}
        </div>
        <div className="input-modal-actions">
          <button
            type="button"
            className="input-modal-btn input-modal-btn-cancel"
            onClick={cancelar}
            disabled={executando}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="input-modal-btn input-modal-btn-confirm"
            onClick={handleConfirm}
            disabled={executando}
            aria-busy={executando}
          >
            {executando ? (
              <>
                <span className="btn-spinner" aria-hidden />
                {textoCarregando}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
      </div>
    </FocusTrapComponent>
  );
};

export default InputModal;
