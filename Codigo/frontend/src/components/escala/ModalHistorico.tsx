import React from "react";
import { EscalaHistoricoItem } from "../../services/escalaService";

const ROTULOS: Record<string, string> = {
  criacao: "Criou o evento",
  edicao: "Editou o evento",
  exclusao: "Excluiu",
  publicacao: "Publicou a escala",
  atribuicao: "Adicionou alguém à escala",
  remocao_atribuicao: "Removeu alguém da escala",
  movimentacao: "Moveu uma pessoa",
  copia: "Copiou a escala",
  desfazer: "Desfez a última alteração",
};

function resumoItem(item: EscalaHistoricoItem) {
  const depois = item.dados_depois as { usuario_nome?: string; titulo?: string } | null;
  const antes = item.dados_antes as { usuario_nome?: string } | null;
  const nome = depois?.usuario_nome || antes?.usuario_nome || depois?.titulo;
  return nome ? ` — ${nome}` : "";
}

interface Props {
  titulo: string;
  itens: EscalaHistoricoItem[];
  loading?: boolean;
  onClose: () => void;
  onDesfazer?: () => void;
  podeDesfazer?: boolean;
}

const ModalHistorico: React.FC<Props> = ({
  titulo,
  itens,
  loading,
  onClose,
  onDesfazer,
  podeDesfazer,
}) => (
  <div className="modal-overlay" role="dialog" aria-labelledby="historico-titulo">
    <div className="modal-content modal-historico">
      <h2 id="historico-titulo">Histórico — {titulo}</h2>
      {loading ? (
        <p className="escala-vazio">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="escala-vazio">Nenhuma alteração registrada neste evento.</p>
      ) : (
        <ul className="lista-historico">
          {itens.map((h) => (
            <li key={h.id_escala_historico}>
              <span className="hist-quando">
                {new Date(h.criado_em).toLocaleString("pt-BR")}
              </span>
              <strong>{h.usuario_nome || "Sistema"}</strong>
              <span>
                {ROTULOS[h.acao] || h.acao}
                {resumoItem(h)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="modal-actions">
        <button type="button" className="btn-cancelar" onClick={onClose}>
          Fechar
        </button>
        {onDesfazer && (
          <button type="button" className="btn-salvar" disabled={!podeDesfazer} onClick={onDesfazer}>
            Desfazer última
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ModalHistorico;
