import React, { useEffect, useRef, useState } from "react";
import FocusTrapComponent from "./FocusTrap";
import "./ConfirmModal.css";


export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  /**
   * Ação ao confirmar. Se devolver uma Promise, o modal fica aberto mostrando
   * `textoCarregando` com spinner (e não deixa cancelar) até a ação terminar.
   */
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
  /** Texto durante a ação (ex.: "Excluindo…"). Padrão: "Processando…" */
  textoCarregando?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  textoCarregando = "Processando…",
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [executando, setExecutando] = useState(false);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
    if (!open) setExecutando(false);
  }, [open]);

  const cancelar = () => {
    if (!executando) onCancel();
  };

  const confirmar = async () => {
    if (executando) return;
    const resultado = onConfirm();
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
        className="confirm-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        aria-busy={executando}
        onKeyDown={handleKeyDown}
        onClick={cancelar}
      >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>
        <p id="confirm-modal-message" className="confirm-modal-message">
          {message}
        </p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-btn confirm-modal-btn-cancel"
            onClick={cancelar}
            disabled={executando}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`confirm-modal-btn confirm-modal-btn-confirm confirm-modal-btn-${variant}`}
            onClick={confirmar}
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

export default ConfirmModal;
