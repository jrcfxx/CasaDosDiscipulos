import React from "react";
import type { Ministerio } from "../../services/ministerioService";
import BotaoCarregando from "../ui/BotaoCarregando";

/** Dados do formulário de evento da escala (criar/editar) */
export interface FormEvento {
  titulo: string;
  data_hora: string;
  data_hora_fim: string;
  descricao: string;
  ativo: boolean;
  id_ministerios: number[];
}

interface Props {
  formEvento: FormEvento;
  setFormEvento: (form: FormEvento) => void;
  ministerios: Ministerio[];
  editandoEventoId: number | null;
  onFechar: () => void;
  onSalvar: (e: React.FormEvent) => void;
  salvando?: boolean;
}

/** Modal de criar/editar evento da escala (título, horário, descrição, ministérios, ativo) */
const ModalEvento: React.FC<Props> = ({
  formEvento,
  setFormEvento,
  ministerios,
  editandoEventoId,
  onFechar,
  onSalvar,
  salvando = false,
}) => (
    <div className="modal-evento-overlay" role="presentation" onClick={onFechar}>
      <div
        className="modal-escala-evento"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-evento-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-evento-header">
          <div className="modal-evento-header-content">
            <span className="modal-evento-icon" aria-hidden>
              📅
            </span>
            <div>
              <h2 id="modal-evento-titulo" className="modal-evento-title">
                {editandoEventoId ? "Editar Evento" : "Novo Evento"}
              </h2>
              <p className="modal-evento-subtitle">
                {editandoEventoId
                  ? "Atualize os dados e os ministérios presentes"
                  : "Defina horário, descrição e ministérios da escala"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-evento-close"
            onClick={onFechar}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <form onSubmit={onSalvar} className="modal-evento-form">
          <div className="form-group">
            <label htmlFor="formEventoTitulo">Título *</label>
            <input
              id="formEventoTitulo"
              type="text"
              value={formEvento.titulo}
              onChange={(e) => setFormEvento({ ...formEvento, titulo: e.target.value })}
              placeholder="Ex.: Culto de Celebração"
              required
            />
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="formEventoDataInicio">Início *</label>
              <input
                id="formEventoDataInicio"
                type="datetime-local"
                value={formEvento.data_hora}
                onChange={(e) => setFormEvento({ ...formEvento, data_hora: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="formEventoDataFim">Término</label>
              <input
                id="formEventoDataFim"
                type="datetime-local"
                value={formEvento.data_hora_fim}
                onChange={(e) => setFormEvento({ ...formEvento, data_hora_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="formEventoDescricao">Descrição</label>
            <textarea
              id="formEventoDescricao"
              value={formEvento.descricao}
              onChange={(e) => setFormEvento({ ...formEvento, descricao: e.target.value })}
              rows={3}
              placeholder="Observações sobre o evento (opcional)"
            />
          </div>

          <div className="form-group form-group--ministerios">
            <div className="form-group-label-row">
              <span className="form-group-label">Ministérios presentes *</span>
              <span className="form-group-count">
                {formEvento.id_ministerios.length} selecionado
                {formEvento.id_ministerios.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="ministerios-checkboxes" role="group" aria-label="Ministérios presentes">
              {ministerios.map((m) => {
                const checked = formEvento.id_ministerios.includes(m.id_ministerio);
                return (
                  <label
                    key={m.id_ministerio}
                    className={`ministerio-chip ${checked ? "selecionado" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const prev = formEvento.id_ministerios;
                        const next = e.target.checked
                          ? [...prev, m.id_ministerio]
                          : prev.filter((id) => id !== m.id_ministerio);
                        setFormEvento({ ...formEvento, id_ministerios: next });
                      }}
                    />
                    <span className="ministerio-chip__mark" aria-hidden />
                    <span className="ministerio-chip__nome">{m.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className={`evento-ativo-toggle ${formEvento.ativo ? "ligado" : ""}`}>
            <input
              type="checkbox"
              checked={formEvento.ativo}
              onChange={(e) => setFormEvento({ ...formEvento, ativo: e.target.checked })}
            />
            <span className="evento-ativo-toggle__switch" aria-hidden />
            <span className="evento-ativo-toggle__texto">
              <strong>Evento ativo</strong>
              <small>Visível na escala quando ativo</small>
            </span>
          </label>

          <div className="modal-evento-actions">
            <button type="button" className="btn-evento-cancelar" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <BotaoCarregando type="submit" className="btn-evento-salvar" carregando={salvando}>
              {editandoEventoId ? "Salvar alterações" : "Criar evento"}
            </BotaoCarregando>
          </div>
        </form>
      </div>
    </div>
);

export default ModalEvento;
