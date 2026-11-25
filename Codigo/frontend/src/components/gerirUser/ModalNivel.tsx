import React, { useId } from "react";
import type { NivelModal } from "./tipos";
import Gaveta, { SecaoGaveta } from "./Gaveta";

interface Props {
  nivelModal: NivelModal;
  setNivelModal: React.Dispatch<React.SetStateAction<NivelModal>>;
  onFechar: () => void;
  onSalvar: () => void;
  salvando?: boolean;
}

/** Painel de cadastro/edição de nível */
const ModalNivel: React.FC<Props> = ({ nivelModal, setNivelModal, onFechar, onSalvar, salvando = false }) => {
  const id = useId();
  return (
    <Gaveta
      titulo={nivelModal.id_nivel ? "Editar nível" : "Novo nível"}
      subtitulo="Etapa da caminhada na Escola de Discípulos"
      icone="formatura"
      largura="estreita"
      onFechar={onFechar}
      onSalvar={onSalvar}
      salvando={salvando}
      rotuloSalvar={nivelModal.id_nivel ? "Salvar alterações" : "Criar nível"}
    >
      <SecaoGaveta titulo="Sobre o nível">
        <div className="gr-campo">
          <label htmlFor={`${id}-nome`}>Nome</label>
          <input
            id={`${id}-nome`}
            value={nivelModal.nome || ""}
            onChange={(e) => setNivelModal((p) => ({ ...p, nome: e.target.value }))}
            placeholder="Ex.: Discipulado 1 – Fundamentos"
          />
        </div>
        <div className="gr-campo">
          <label htmlFor={`${id}-descricao`}>Descrição <span className="gr-opcional">(opcional)</span></label>
          <textarea
            id={`${id}-descricao`}
            value={nivelModal.descricao || ""}
            onChange={(e) => setNivelModal((p) => ({ ...p, descricao: e.target.value }))}
            rows={4}
            placeholder="O que a pessoa vive nesta etapa"
          />
        </div>
        <p className="gr-dica">
          A ordem da caminhada é definida arrastando os níveis na lista.
          {nivelModal.id_nivel ? ` Posição atual: ${nivelModal.ordem}º.` : " Novos níveis entram no final."}
        </p>
      </SecaoGaveta>
    </Gaveta>
  );
};

export default ModalNivel;
