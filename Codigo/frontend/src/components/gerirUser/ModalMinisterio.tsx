import React, { useId } from "react";
import type { Ministerio } from "../../services/ministerioService";
import type { MinisterioModal, Usuario } from "./tipos";
import Gaveta, { ChipsMarcaveis, SecaoGaveta } from "./Gaveta";

interface Props {
  ministerioModal: MinisterioModal;
  setMinisterioModal: React.Dispatch<React.SetStateAction<MinisterioModal>>;
  lideresParaSelect: Usuario[];
  ministerios: Ministerio[];
  onFechar: () => void;
  onSalvar: () => void;
  salvando?: boolean;
}

/** Painel de cadastro/edição de ministério (líderes e paralelismo na escala) */
const ModalMinisterio: React.FC<Props> = ({
  ministerioModal,
  setMinisterioModal,
  lideresParaSelect,
  ministerios,
  onFechar,
  onSalvar,
  salvando = false,
}) => {
  const id = useId();
  const outros = ministerios
    .filter((m) => m.ativo && m.id_ministerio !== ministerioModal.id_ministerio)
    .map((m) => ({ id: m.id_ministerio, nome: m.nome }));

  return (
    <Gaveta
      titulo={ministerioModal.id_ministerio ? ministerioModal.nome || "Editar ministério" : "Novo ministério"}
      subtitulo="Área de serviço usada na escala dos eventos"
      icone="igreja"
      onFechar={onFechar}
      onSalvar={onSalvar}
      salvando={salvando}
      rotuloSalvar={ministerioModal.id_ministerio ? "Salvar alterações" : "Criar ministério"}
    >
      <SecaoGaveta titulo="Sobre o ministério">
        <div className="gr-grade">
          <div className="gr-campo gr-campo--inteiro">
            <label htmlFor={`${id}-nome`}>Nome</label>
            <input
              id={`${id}-nome`}
              value={ministerioModal.nome || ""}
              onChange={(e) => setMinisterioModal((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex.: Louvor, Som, Acolhida"
            />
          </div>
          <div className="gr-campo gr-campo--inteiro">
            <label htmlFor={`${id}-descricao`}>Descrição <span className="gr-opcional">(opcional)</span></label>
            <textarea
              id={`${id}-descricao`}
              value={ministerioModal.descricao || ""}
              onChange={(e) => setMinisterioModal((p) => ({ ...p, descricao: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="gr-campo">
            <label htmlFor={`${id}-ordem`}>Posição na lista</label>
            <input
              id={`${id}-ordem`}
              type="number"
              min="0"
              value={ministerioModal.ordem || 0}
              onChange={(e) => setMinisterioModal((p) => ({ ...p, ordem: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            />
          </div>
          <div className="gr-campo gr-campo--centro">
            <label className="gr-interruptor">
              <input
                type="checkbox"
                role="switch"
                aria-label="Ministério ativo"
                checked={ministerioModal.ativo}
                onChange={(e) => setMinisterioModal((p) => ({ ...p, ativo: e.target.checked }))}
              />
              <span className="gr-interruptor__trilho" aria-hidden />
              <span><strong>Ministério ativo</strong></span>
            </label>
          </div>
        </div>
      </SecaoGaveta>

      <SecaoGaveta titulo="Líderes" descricao="Quem monta a escala deste ministério. Só aparecem usuários do tipo Líder.">
        <ChipsMarcaveis
          legenda="Líderes do ministério"
          opcoes={lideresParaSelect.map((u) => ({ id: u.id_usuario!, nome: u.nome }))}
          marcados={ministerioModal.id_lideres || []}
          onMudar={(ids) => setMinisterioModal((p) => ({ ...p, id_lideres: ids }))}
          vazio="Nenhum líder cadastrado. Crie usuários do tipo Líder na aba Usuários."
        />
      </SecaoGaveta>

      <SecaoGaveta
        titulo="Pode servir junto com"
        descricao="Por padrão, ninguém fica em dois ministérios no mesmo evento. Marque os que podem dividir a mesma pessoa (ex.: cantar no Louvor e ministrar a Palavra)."
      >
        <ChipsMarcaveis
          legenda="Ministérios que podem compartilhar a mesma pessoa"
          opcoes={outros}
          marcados={ministerioModal.id_paralelismos || []}
          onMudar={(ids) => setMinisterioModal((p) => ({ ...p, id_paralelismos: ids }))}
          vazio="Cadastre outros ministérios para configurar."
        />
      </SecaoGaveta>
    </Gaveta>
  );
};

export default ModalMinisterio;
