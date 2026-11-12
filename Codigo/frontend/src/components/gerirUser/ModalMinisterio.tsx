import React from "react";
import type { Ministerio } from "../../services/ministerioService";
import type { MinisterioModal, Usuario } from "./tipos";
import BotaoCarregando from "../ui/BotaoCarregando";

interface Props {
  ministerioModal: MinisterioModal;
  setMinisterioModal: React.Dispatch<React.SetStateAction<MinisterioModal>>;
  lideresParaSelect: Usuario[];
  ministerios: Ministerio[];
  showParalelismoInfo: boolean;
  setShowParalelismoInfo: React.Dispatch<React.SetStateAction<boolean>>;
  onFechar: () => void;
  onSalvar: () => void;
  salvando?: boolean;
}

/** Modal de cadastro/edição de ministério (líderes e paralelismo na escala) */
const ModalMinisterio: React.FC<Props> = ({
  ministerioModal,
  setMinisterioModal,
  lideresParaSelect,
  ministerios,
  showParalelismoInfo,
  setShowParalelismoInfo,
  onFechar,
  onSalvar,
  salvando = false,
}) => (
    <div className="modal-ministerio-overlay">
      <div className="modal-ministerio">
        <div className="modal-ministerio-header cd-modal-header">
          <div className="modal-ministerio-header-content cd-modal-header-content">
            <span className="modal-ministerio-icon cd-modal-icon" aria-hidden>⛪</span>
            <div>
              <h2 className="modal-ministerio-title cd-modal-title">
                {ministerioModal.id_ministerio ? "Editar Ministério" : "Novo Ministério"}
              </h2>
              <p className="modal-ministerio-subtitle cd-modal-subtitle">
                {ministerioModal.id_ministerio
                  ? "Atualize as informações do ministério"
                  : "Preencha os dados para criar um novo ministério"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-ministerio-close cd-modal-close"
            onClick={onFechar}
            disabled={salvando}
            title="Fechar"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="modal-ministerio-body">
          <div className="modal-ministerio-form-group">
            <label htmlFor="ministerioModalNome">Nome *</label>
            <input
              id="ministerioModalNome"
              type="text"
              value={ministerioModal.nome || ""}
              onChange={(e) => setMinisterioModal((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Louvor, Som, Voluntários"
            />
          </div>
          <div className="modal-ministerio-form-group">
            <label htmlFor="ministerioModalDescricao">Descrição</label>
            <textarea
              id="ministerioModalDescricao"
              value={ministerioModal.descricao || ""}
              onChange={(e) => setMinisterioModal((p) => ({ ...p, descricao: e.target.value }))}
              placeholder="Descrição opcional do ministério"
              rows={2}
            />
          </div>
          <div className="modal-ministerio-row">
            <div className="modal-ministerio-form-group modal-ministerio-form-group--sm">
              <label htmlFor="ministerioModalOrdem">Ordem</label>
              <input
                id="ministerioModalOrdem"
                type="number"
                value={ministerioModal.ordem || 0}
                onChange={(e) =>
                  setMinisterioModal((p) => ({
                    ...p,
                    ordem: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                min="0"
              />
            </div>
            <label className="modal-ministerio-checkbox">
              <input
                type="checkbox"
                checked={ministerioModal.ativo}
                onChange={(e) => setMinisterioModal((p) => ({ ...p, ativo: e.target.checked }))}
              />
              <span>Ministério ativo</span>
            </label>
          </div>
          <div className="modal-ministerio-form-group">
            <span>Líderes do ministério</span>
            <div className="modal-ministerio-lideres">
              {lideresParaSelect.map((u) => (
                <label key={u.id_usuario!} className="modal-ministerio-lider-chip">
                  <input
                    type="checkbox"
                    checked={(ministerioModal.id_lideres || []).includes(u.id_usuario!)}
                    onChange={(e) => {
                      const prev = ministerioModal.id_lideres;
                      const next = e.target.checked
                        ? [...prev, u.id_usuario!]
                        : prev.filter((id) => id !== u.id_usuario);
                      setMinisterioModal((p) => ({ ...p, id_lideres: next }));
                    }}
                  />
                  <span>{u.nome}</span>
                </label>
              ))}
              {lideresParaSelect.length === 0 && (
                <p className="modal-ministerio-hint">Nenhum líder cadastrado. Crie usuários do tipo Líder na aba Usuários.</p>
              )}
            </div>
          </div>

          <div className="modal-ministerio-form-group modal-ministerio-paralelismo">
            <div className="modal-ministerio-paralelismo-head">
              <span>Paralelismo na escala</span>
              <button
                type="button"
                className="modal-ministerio-info-btn"
                onClick={() => setShowParalelismoInfo((v) => !v)}
                aria-expanded={showParalelismoInfo}
                title="O que é paralelismo?"
              >
                ?
              </button>
            </div>
            {showParalelismoInfo && (
              <div className="modal-ministerio-info-box" role="note">
                <strong>O que é isso?</strong>
                <p>
                  Por padrão, a mesma pessoa não pode ser escalada em dois ministérios no
                  mesmo evento. Se marcar outro ministério aqui, a pessoa poderá estar nos
                  dois — por exemplo, cantar no Louvor e também ministrar na Palavra.
                </p>
              </div>
            )}
            <p className="modal-ministerio-hint">
              Selecione os ministérios que podem compartilhar a mesma pessoa neste evento.
            </p>
            <div className="modal-ministerio-lideres">
              {ministerios
                .filter(
                  (m) =>
                    m.ativo &&
                    m.id_ministerio !== ministerioModal.id_ministerio
                )
                .map((m) => (
                  <label key={m.id_ministerio} className="modal-ministerio-lider-chip">
                    <input
                      type="checkbox"
                      checked={(ministerioModal.id_paralelismos || []).includes(
                        m.id_ministerio
                      )}
                      onChange={(e) => {
                        const prev = ministerioModal.id_paralelismos || [];
                        const next = e.target.checked
                          ? [...prev, m.id_ministerio]
                          : prev.filter((id) => id !== m.id_ministerio);
                        setMinisterioModal((p) => ({ ...p, id_paralelismos: next }));
                      }}
                    />
                    <span>{m.nome}</span>
                  </label>
                ))}
              {ministerios.filter(
                (m) => m.ativo && m.id_ministerio !== ministerioModal.id_ministerio
              ).length === 0 && (
                <p className="modal-ministerio-hint">
                  Cadastre outros ministérios para configurar o paralelismo.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="modal-ministerio-footer">
          <button type="button" className="modal-ministerio-btn-cancel" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <BotaoCarregando type="button" className="modal-ministerio-btn-save" onClick={onSalvar} carregando={salvando} textoCarregando="Salvando…">
            {ministerioModal.id_ministerio ? "Salvar alterações" : "Criar ministério"}
          </BotaoCarregando>
        </div>
      </div>
    </div>
);

export default ModalMinisterio;
