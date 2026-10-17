import React, { useEffect, useRef } from "react";
import { FocusTrap } from "focus-trap-react";
import { EscalaConflito } from "../../services/escalaService";
import "./ModalEscalaDialog.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FocusTrapComponent = FocusTrap as any;

interface ModalConflitosProps {
  conflitos: EscalaConflito[];
  onClose: () => void;
  onConfirmarMesmoAssim?: () => void;
  permitirForcar?: boolean;
}

const ModalConflitos: React.FC<ModalConflitosProps> = ({
  conflitos,
  onClose,
  onConfirmarMesmoAssim,
  permitirForcar = false,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reais = conflitos.filter((c) => c.valido === false || (!c.skip && c.mensagem));

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <FocusTrapComponent
      active
      focusTrapOptions={{
        allowOutsideClick: true,
        escapeDeactivates: false,
        returnFocusOnDeactivate: true,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="escala-dialog-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflitos-titulo"
        onKeyDown={handleKeyDown}
        onClick={onClose}
      >
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="escala-dialog" onClick={(e) => e.stopPropagation()}>
          <h3 id="conflitos-titulo" className="escala-dialog-title">
            Conflitos na escala
          </h3>
          <ul className="escala-dialog-list">
            {reais.map((c, i) => (
              <li key={`${c.tipo}-${i}`}>
                <strong>{c.mensagem}</strong>
                {c.sugestao && <p className="escala-dialog-hint">{c.sugestao}</p>}
              </li>
            ))}
          </ul>
          <div className="escala-dialog-actions">
            <button
              ref={closeRef}
              type="button"
              className="escala-dialog-btn escala-dialog-btn-secondary"
              onClick={onClose}
            >
              Fechar
            </button>
            {permitirForcar && onConfirmarMesmoAssim && (
              <button
                type="button"
                className="escala-dialog-btn escala-dialog-btn-primary"
                onClick={onConfirmarMesmoAssim}
              >
                Continuar mesmo assim
              </button>
            )}
          </div>
        </div>
      </div>
    </FocusTrapComponent>
  );
};

export default ModalConflitos;
