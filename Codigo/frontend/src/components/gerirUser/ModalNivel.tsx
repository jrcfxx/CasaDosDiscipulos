import React from "react";
import type { NivelModal } from "./tipos";

interface Props {
  nivelModal: NivelModal;
  setNivelModal: React.Dispatch<React.SetStateAction<NivelModal>>;
  onFechar: () => void;
  onSalvar: () => void;
}

/** Modal de cadastro/edição de nível */
const ModalNivel: React.FC<Props> = ({ nivelModal, setNivelModal, onFechar, onSalvar }) => (
    <div className="modal-fundo" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="cd-modal-header">
          <div className="cd-modal-header-content">
            <span className="cd-modal-icon" aria-hidden>🎓</span>
            <div>
              <h2 className="cd-modal-title">
                {nivelModal.id_nivel ? "Editar Nível" : "Novo Nível"}
              </h2>
              <p className="cd-modal-subtitle">
                {nivelModal.id_nivel
                  ? "Atualize as informações deste nível"
                  : "Preencha os dados para criar um novo nível"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cd-modal-close"
            onClick={onFechar}
            title="Fechar"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          <label htmlFor="nivelModalNome">Nome do Nível</label>
          <input
            id="nivelModalNome"
            type="text"
            value={nivelModal.nome || ""}
            onChange={(e) =>
              setNivelModal((prev) => ({ ...prev, nome: e.target.value }))
            }
            placeholder="Ex: Discípulo"
          />

          <label htmlFor="nivelModalDescricao">Descrição</label>
          <textarea
            id="nivelModalDescricao"
            value={nivelModal.descricao || ""}
            onChange={(e) =>
              setNivelModal((prev) => ({
                ...prev,
                descricao: e.target.value,
              }))
            }
            placeholder="Descrição opcional do nível"
            rows={3}
          />

          <p className="hint">
            A ordem de progressão é definida arrastando os níveis na lista.
            {nivelModal.id_nivel ? ` Ordem atual: ${nivelModal.ordem}.` : " Novos níveis entram no final."}
          </p>
        </div>

        <div className="modal-buttons">
          <button onClick={onFechar}>Cancelar</button>
          <button onClick={onSalvar}>
            {nivelModal.id_nivel ? "Salvar Alterações" : "Criar Nível"}
          </button>
        </div>
      </div>
    </div>
);

export default ModalNivel;
