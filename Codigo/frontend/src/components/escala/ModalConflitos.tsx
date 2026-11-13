import React, { useEffect, useRef } from "react";
import FocusTrapComponent from "../ui/FocusTrap";
import { EscalaConflito } from "../../services/escalaService";
import "./ModalEscalaDialog.css";


interface ModalConflitosProps {
  conflitos: EscalaConflito[];
  onClose: () => void;
  onConfirmarMesmoAssim?: () => void;
  permitirForcar?: boolean;
  /** true enquanto a escalação confirmada é gravada */
  processando?: boolean;
}

const ModalConflitos: React.FC<ModalConflitosProps> = ({
  conflitos,
  onClose,
  onConfirmarMesmoAssim,
  permitirForcar = false,
  processando = false,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reais = conflitos.filter((c) => c.valido === false || (!c.skip && c.mensagem));
  const podeConfirmar = permitirForcar && !!onConfirmarMesmoAssim;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !processando) onClose();
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
        onClick={() => {
          if (!processando) onClose();
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="escala-dialog" onClick={(e) => e.stopPropagation()}>
          <h3 id="conflitos-titulo" className="escala-dialog-title">
            {podeConfirmar ? "Atenção" : "Conflitos na escala"}
          </h3>
          <ul className="escala-dialog-list">
            {reais.map((c, i) => (
              <li key={`${c.tipo}-${i}`}>
                <strong>{c.mensagem}</strong>
                {c.sugestao && <p className="escala-dialog-hint">{c.sugestao}</p>}
              </li>
            ))}
          </ul>
          {podeConfirmar && (
            <p className="escala-dialog-hint">
              Se for uma exceção combinada com a pessoa, você pode continuar mesmo assim. A
              decisão fica registrada no histórico do evento.
            </p>
          )}
          <div className="escala-dialog-actions">
            <button
              ref={closeRef}
              type="button"
              className="escala-dialog-btn escala-dialog-btn-secondary"
              onClick={onClose}
              disabled={processando}
            >
              {podeConfirmar ? "Cancelar" : "Fechar"}
            </button>
            {podeConfirmar && (
              <button
                type="button"
                className="escala-dialog-btn escala-dialog-btn-primary"
                onClick={onConfirmarMesmoAssim}
                disabled={processando}
                aria-busy={processando}
              >
                {processando ? (
                  <>
                    <span className="btn-spinner" aria-hidden />
                    Salvando…
                  </>
                ) : (
                  "Continuar mesmo assim"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </FocusTrapComponent>
  );
};

export default ModalConflitos;
