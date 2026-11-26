import React, { useEffect, useId, useRef, useState } from "react";
import Icone from "../ui/Icone";

export interface OpcaoMinisterio {
  id: number;
  nome: string;
}

/**
 * Filtro de ministérios da Escala: um botão compacto na barra de ferramentas que abre uma lista
 * para marcar. "Todos" = escala inteira (selecionados vazio).
 */
const FiltroMinisterios: React.FC<{
  opcoes: OpcaoMinisterio[];
  /** Ids escolhidos; vazio = todos */
  selecionados: number[];
  onAlternar: (id: number) => void;
  onTodos: () => void;
}> = ({ opcoes, selecionados, onAlternar, onTodos }) => {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const idLista = useId();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAberto(false);
        raiz.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  const todos = selecionados.length === 0;
  const rotulo = todos
    ? "Todos os ministérios"
    : selecionados.length === 1
      ? opcoes.find((o) => o.id === selecionados[0])?.nome ?? "1 ministério"
      : `${selecionados.length} ministérios`;

  return (
    <div className="esc-filtro-min" ref={raiz}>
      <button
        type="button"
        className={`esc-btn esc-btn--fantasma esc-filtro-min__botao${todos ? "" : " ativo"}`}
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((v) => !v)}
      >
        <span className="sr-only">Ministérios: </span>
        {rotulo}
        <Icone nome="abrir" tamanho={16} />
      </button>
      {aberto && (
        <div className="esc-filtro-min__painel" id={idLista} role="group" aria-label="Escolha os ministérios">
          <label className="esc-filtro-min__opcao esc-filtro-min__opcao--todos">
            <input type="checkbox" checked={todos} onChange={onTodos} />
            Todos os ministérios
          </label>
          <div className="esc-filtro-min__lista">
            {opcoes.map((o) => (
              <label key={o.id} className="esc-filtro-min__opcao">
                <input type="checkbox" checked={!todos && selecionados.includes(o.id)} onChange={() => onAlternar(o.id)} />
                {o.nome}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltroMinisterios;
