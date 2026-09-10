import React from "react";
import { EscalaConflito } from "../../services/escalaService";

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
  const reais = conflitos.filter((c) => c.valido === false || (!c.skip && c.mensagem));

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="conflitos-titulo">
      <div className="modal-content modal-conflitos">
        <h3 id="conflitos-titulo">Conflitos na escala</h3>
        <ul className="lista-conflitos">
          {reais.map((c, i) => (
            <li key={`${c.tipo}-${i}`}>
              <strong>{c.mensagem}</strong>
              {c.sugestao && <p className="conflito-sugestao">{c.sugestao}</p>}
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <button type="button" className="btn-secundario" onClick={onClose}>
            Fechar
          </button>
          {permitirForcar && onConfirmarMesmoAssim && (
            <button type="button" className="btn-criar" onClick={onConfirmarMesmoAssim}>
              Continuar mesmo assim
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalConflitos;
