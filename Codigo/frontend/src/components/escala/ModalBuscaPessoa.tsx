import React, { useState } from "react";
import escalaService, { EscalasPessoa } from "../../services/escalaService";
import { getErrorMessage } from "../../utils/errorUtils";
import "./ModalBuscaPessoa.css";

interface Props {
  usuarios: { id_usuario: number; nome: string }[];
  dataInicio: string;
  dataFim: string;
  onClose: () => void;
  onAbrirEvento: (id: number) => void;
}

const ModalBuscaPessoa: React.FC<Props> = ({
  usuarios,
  dataInicio,
  dataFim,
  onClose,
  onAbrirEvento,
}) => {
  const [idUsuario, setIdUsuario] = useState<number | "">("");
  const [ini, setIni] = useState(dataInicio);
  const [fim, setFim] = useState(dataFim);
  const [resultado, setResultado] = useState<EscalasPessoa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);

  const buscar = async () => {
    if (!idUsuario) {
      setErro("Selecione uma pessoa para buscar.");
      return;
    }
    setLoading(true);
    setErro(null);
    setBuscou(true);
    try {
      const data = await escalaService.getEscalasDaPessoa(Number(idUsuario), ini, fim);
      setResultado(data);
    } catch (err) {
      setResultado(null);
      setErro(getErrorMessage(err, "Não foi possível buscar as escalas"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-busca-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-busca-pessoa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="busca-pessoa-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-busca-header">
          <div className="modal-busca-header-content">
            <span className="modal-busca-icon" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <h2 id="busca-pessoa-titulo" className="modal-busca-title">
                Buscar pessoa na escala
              </h2>
              <p className="modal-busca-subtitle">
                Veja em quais eventos a pessoa está escalada no período.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-busca-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-busca-body">
          <div className="modal-busca-form">
            <div className="form-group">
              <label htmlFor="buscaPessoaSelect">Pessoa</label>
              <div className="modal-busca-select-wrap">
                <select
                  id="buscaPessoaSelect"
                  value={idUsuario}
                  onChange={(e) => {
                    setIdUsuario(e.target.value ? Number(e.target.value) : "");
                    setErro(null);
                  }}
                >
                  <option value="">Selecione uma pessoa</option>
                  {usuarios.map((u) => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-busca-datas">
              <div className="form-group">
                <label htmlFor="buscaIni">De</label>
                <input
                  id="buscaIni"
                  type="date"
                  value={ini}
                  onChange={(e) => setIni(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="buscaFim">Até</label>
                <input
                  id="buscaFim"
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          {erro && (
            <p className="modal-busca-erro" role="alert">
              {erro}
            </p>
          )}

          {resultado && (
            <div className="modal-busca-resultado">
              <div className="modal-busca-resultado-head">
                <div>
                  <h3>{resultado.usuario.nome}</h3>
                  <p>
                    {resultado.estatisticas.totalEscalas} escala
                    {resultado.estatisticas.totalEscalas === 1 ? "" : "s"} ·{" "}
                    {resultado.estatisticas.diasEscalado} dia
                    {resultado.estatisticas.diasEscalado === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {resultado.estatisticas.instrumentos.length > 0 && (
                <div className="modal-busca-chips">
                  {resultado.estatisticas.instrumentos.map((i) => (
                    <span key={i.tipo} className="modal-busca-chip">
                      {i.tipo} · {i.quantidade}x
                    </span>
                  ))}
                </div>
              )}

              {resultado.escalas.length === 0 ? (
                <p className="modal-busca-vazio">Nenhuma escala neste período.</p>
              ) : (
                <ul className="modal-busca-lista">
                  {resultado.escalas.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="modal-busca-item"
                        onClick={() => onAbrirEvento(e.evento.id)}
                      >
                        <span className="modal-busca-item-data">
                          {e.data}
                          <small>{e.horario}</small>
                        </span>
                        <span className="modal-busca-item-info">
                          <strong>{e.evento.nome}</strong>
                          <span>
                            {e.area} / {e.instrumento}
                          </span>
                        </span>
                        <span className="modal-busca-item-arrow" aria-hidden>
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {buscou && !resultado && !erro && !loading && (
            <p className="modal-busca-vazio">Nenhum resultado encontrado.</p>
          )}
        </div>

        <div className="modal-busca-actions">
          <button type="button" className="btn-busca-cancelar" onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn-busca-salvar"
            onClick={() => void buscar()}
            disabled={loading}
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBuscaPessoa;
