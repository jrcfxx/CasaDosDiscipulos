import React, { useEffect, useRef } from "react";
import { FocusTrap } from "focus-trap-react";
import { EscalaHistoricoItem } from "../../services/escalaService";
import "./ModalEscalaDialog.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FocusTrapComponent = FocusTrap as any;

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
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

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
        aria-labelledby="historico-titulo"
        onKeyDown={handleKeyDown}
        onClick={onClose}
      >
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="escala-dialog" onClick={(e) => e.stopPropagation()}>
          <h2 id="historico-titulo" className="escala-dialog-title">
            Histórico — {titulo}
          </h2>
          {loading ? (
            <p className="escala-dialog-empty">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="escala-dialog-empty">Nenhuma alteração registrada neste evento.</p>
          ) : (
            <ul className="escala-dialog-history">
              {itens.map((h) => (
                <li key={h.id_escala_historico}>
                  <span className="escala-dialog-when">
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
          <div className="escala-dialog-actions">
            <button
              ref={closeRef}
              type="button"
              className="escala-dialog-btn escala-dialog-btn-secondary"
              onClick={onClose}
            >
              Fechar
            </button>
            {onDesfazer && (
              <button
                type="button"
                className="escala-dialog-btn escala-dialog-btn-primary"
                disabled={!podeDesfazer}
                onClick={onDesfazer}
              >
                Desfazer última
              </button>
            )}
          </div>
        </div>
      </div>
    </FocusTrapComponent>
  );
};

export default ModalHistorico;
