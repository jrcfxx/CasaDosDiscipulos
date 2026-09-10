import React, { useState } from "react";
import escalaService, { EscalasPessoa } from "../../services/escalaService";
import { getErrorMessage } from "../../utils/errorUtils";

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

  const buscar = async () => {
    if (!idUsuario) return;
    setLoading(true);
    setErro(null);
    try {
      const data = await escalaService.getEscalasDaPessoa(Number(idUsuario), ini, fim);
      setResultado(data);
    } catch (err) {
      setErro(getErrorMessage(err, "Não foi possível buscar as escalas"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="busca-pessoa-titulo">
      <div className="modal-content">
        <h2 id="busca-pessoa-titulo">Onde a pessoa está escalada?</h2>
        <div className="form-group">
          <label htmlFor="buscaPessoaSelect">Pessoa</label>
          <select
            id="buscaPessoaSelect"
            value={idUsuario}
            onChange={(e) => setIdUsuario(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Selecione</option>
            {usuarios.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="buscaIni">De</label>
          <input id="buscaIni" type="date" value={ini} onChange={(e) => setIni(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="buscaFim">Até</label>
          <input id="buscaFim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancelar" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn-salvar" onClick={buscar} disabled={!idUsuario || loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {erro && <p className="escala-vazio">{erro}</p>}
        {resultado && (
          <div className="busca-resultado">
            <h3>
              {resultado.usuario.nome} — {resultado.estatisticas.totalEscalas} escalas
            </h3>
            <p className="quadro-stats">
              {resultado.estatisticas.diasEscalado} dias ·{" "}
              {resultado.estatisticas.instrumentos
                .map((i) => `${i.tipo} (${i.quantidade}x)`)
                .join(", ")}
            </p>
            <ul className="escala-lista-eventos">
              {resultado.escalas.map((e) => (
                <li key={e.id}>
                  <button type="button" className="escala-item-evento-btn" onClick={() => onAbrirEvento(e.evento.id)}>
                    <span className="ev-data">
                      {e.data} {e.horario}
                    </span>
                    <span className="ev-titulo">
                      {e.evento.nome} · {e.area} / {e.instrumento}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalBuscaPessoa;
