import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import FocusTrap from "../ui/FocusTrap";
import Icone, { type NomeIcone } from "../ui/Icone";
import BotaoCarregando from "../ui/BotaoCarregando";

/**
 * Painel lateral de edição (Gerenciamento): abre pela direita, mantém a lista visível atrás,
 * cabeçalho e rodapé fixos, conteúdo em seções. Esc ou clique fora fecham (se não estiver salvando).
 */
export default function Gaveta({
  titulo,
  subtitulo,
  icone,
  onFechar,
  onSalvar,
  salvando = false,
  rotuloSalvar,
  largura = "larga",
  children,
}: {
  titulo: string;
  subtitulo?: string;
  icone: NomeIcone;
  onFechar: () => void;
  onSalvar: () => void;
  salvando?: boolean;
  rotuloSalvar: string;
  largura?: "larga" | "estreita";
  children: React.ReactNode;
}) {
  const id = useId();

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !salvando) onFechar();
    };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, [onFechar, salvando]);

  return createPortal(
    // Clicar fora é só um atalho do mouse; no teclado fecha com Esc ou com o botão Fechar
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="gr-gaveta-fundo" onMouseDown={(e) => e.target === e.currentTarget && !salvando && onFechar()}>
      <FocusTrap focusTrapOptions={{ escapeDeactivates: false, allowOutsideClick: true, fallbackFocus: `#${CSS.escape(id)}` }}>
        <div
          id={id}
          className={`gr-gaveta gr-gaveta--${largura}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-titulo`}
          tabIndex={-1}
        >
          <div className="gr-gaveta__topo">
            <span className="gr-gaveta__icone" aria-hidden><Icone nome={icone} tamanho={22} /></span>
            <div className="gr-gaveta__titulos">
              <h2 id={`${id}-titulo`}>{titulo}</h2>
              {subtitulo && <p>{subtitulo}</p>}
            </div>
            <button type="button" className="gr-gaveta__fechar" onClick={onFechar} disabled={salvando} aria-label="Fechar">
              <Icone nome="fechar" tamanho={18} />
            </button>
          </div>

          <form
            className="gr-gaveta__form"
            onSubmit={(e) => {
              e.preventDefault();
              onSalvar();
            }}
            noValidate
          >
            <div className="gr-gaveta__corpo">{children}</div>
            <div className="gr-gaveta__rodape">
              <button type="button" className="sc-btn sc-btn--contorno" onClick={onFechar} disabled={salvando}>
                Cancelar
              </button>
              <BotaoCarregando type="submit" className="sc-btn sc-btn--primario" carregando={salvando} textoCarregando="Salvando…">
                {rotuloSalvar}
              </BotaoCarregando>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>,
    document.body
  );
}

/** Seção numerada dentro do painel */
export function SecaoGaveta({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section className="gr-secao" aria-labelledby={id}>
      <div className="gr-secao__cabeca">
        <h3 id={id}>{titulo}</h3>
        {descricao && <p>{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

/** Grupo de "chips" marcáveis (ministérios, líderes, paralelismo) */
export function ChipsMarcaveis({
  legenda,
  opcoes,
  marcados,
  onMudar,
  vazio,
}: {
  legenda: string;
  opcoes: Array<{ id: number; nome: string }>;
  marcados: number[];
  onMudar: (ids: number[]) => void;
  vazio: string;
}) {
  return (
    <fieldset className="gr-chips">
      <legend className="sr-only">{legenda}</legend>
      {opcoes.length === 0 && <p className="gr-dica">{vazio}</p>}
      {opcoes.map((o) => {
        const ativo = marcados.includes(o.id);
        return (
          <label key={o.id} className={`gr-chip${ativo ? " gr-chip--ativo" : ""}`}>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => onMudar(e.target.checked ? [...marcados, o.id] : marcados.filter((x) => x !== o.id))}
            />
            <span className="gr-chip__marca" aria-hidden>{ativo && <Icone nome="check" tamanho={12} />}</span>
            {o.nome}
          </label>
        );
      })}
    </fieldset>
  );
}
