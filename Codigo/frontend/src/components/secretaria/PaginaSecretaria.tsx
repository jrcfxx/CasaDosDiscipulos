import React, { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import "../../style/secretaria.css";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import Icone, { type NomeIcone } from "../ui/Icone";

/**
 * Moldura das páginas de gestão (Módulos, Quizzes, Formulários, Lições): cabeçalho escuro da
 * Casa com explicação, navegação entre as quatro, lista à esquerda e detalhe à direita.
 */

export type AbaSecretaria = { to: string; nome: string; icone: NomeIcone };

const SECOES: AbaSecretaria[] = [
  { to: "/admin/modulos", nome: "Módulos", icone: "formatura" },
  { to: "/admin/quizzes", nome: "Quizzes", icone: "concluido" },
  { to: "/admin/formularios", nome: "Formulários", icone: "lista" },
  { to: "/admin/licoes", nome: "Lições", icone: "livro" },
];

/** Abas das páginas do discípulo/líder: quem é líder de célula vê também Lições e Formulários */
export function abasDoUsuario(ehLiderDeCelula: boolean): AbaSecretaria[] {
  if (!ehLiderDeCelula) return [];
  return [
    { to: "/usuario/modulos", nome: "Escola de Discípulos", icone: "formatura" },
    { to: "/usuario/licoes", nome: "Lições", icone: "livro" },
    { to: "/usuario/formularios", nome: "Formulários", icone: "lista" },
  ];
}

export interface NumeroResumo {
  valor: number | string;
  rotulo: string;
}

export default function PaginaSecretaria({
  area,
  titulo,
  descricao,
  icone,
  acao,
  numeros = [],
  abas = SECOES,
  rotuloAbas = "Áreas de gestão",
  children,
}: {
  /** "Escola de Discípulos" ou "Secretaria das Células" */
  area: string;
  titulo: string;
  descricao: string;
  icone: NomeIcone;
  acao?: { rotulo: string; onClick: () => void };
  numeros?: NumeroResumo[];
  /** Abas de navegação no fim do cabeçalho (padrão: as quatro de gestão; [] esconde) */
  abas?: AbaSecretaria[];
  rotuloAbas?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sc-pagina page-with-fixed-header">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className={`sc-topo${abas.length ? "" : " sc-topo--sem-abas"}`} aria-labelledby="sc-titulo">
          <div className="sc-topo__conteudo">
            <div className="sc-topo__texto">
              <p className="sc-topo__area">
                <Icone nome={icone} tamanho={15} /> {area}
              </p>
              <h1 id="sc-titulo">{titulo}</h1>
              <p className="sc-topo__descricao">{descricao}</p>
              {numeros.length > 0 && (
                <ul className="sc-topo__numeros" aria-label="Resumo">
                  {numeros.map((n) => (
                    <li key={n.rotulo}>
                      <strong>{n.valor}</strong>
                      <span>{n.rotulo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {acao && (
              <button type="button" className="sc-btn sc-btn--destaque" onClick={acao.onClick}>
                <span aria-hidden>+</span> {acao.rotulo}
              </button>
            )}
          </div>
          {abas.length > 0 && (
          <nav className="sc-abas" aria-label={rotuloAbas}>
            {abas.map((s) => (
              <NavLink key={s.to} to={s.to} className={({ isActive }) => `sc-aba${isActive ? " sc-aba--ativa" : ""}`}>
                <Icone nome={s.icone} tamanho={15} /> {s.nome}
              </NavLink>
            ))}
          </nav>
          )}
        </section>
        <div className="sc-corpo-fundo">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export type FiltroStatus = "todos" | "ativos" | "inativos";

/** Coluna da lista: título, busca e filtro por situação */
export function ListaSecretaria({
  titulo,
  total,
  busca,
  onBusca,
  filtro,
  onFiltro,
  placeholderBusca,
  dica,
  vazio,
  quantidadeVisivel,
  children,
}: {
  titulo: string;
  total: number;
  busca: string;
  onBusca: (v: string) => void;
  /** Sem filtro (páginas do discípulo): some o seletor Todos/Ativos/Inativos */
  filtro?: FiltroStatus;
  onFiltro?: (f: FiltroStatus) => void;
  placeholderBusca: string;
  /** Texto curto abaixo do filtro (ex.: "Arraste para mudar a ordem") */
  dica?: React.ReactNode;
  /** Mensagem quando não há nada para mostrar */
  vazio: string;
  quantidadeVisivel: number;
  children: React.ReactNode;
}) {
  const id = `sc-lista-${titulo.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <aside className="sc-lista" aria-labelledby={id}>
      <div className="sc-lista__topo">
        <h2 id={id}>
          {titulo} <span className="sc-contador">{total}</span>
        </h2>
        <label className="sc-busca">
          <Icone nome="busca" tamanho={16} />
          <span className="sr-only">Buscar</span>
          <input type="search" value={busca} onChange={(e) => onBusca(e.target.value)} placeholder={placeholderBusca} />
        </label>
        {filtro && onFiltro && (
        <div className="sc-filtro" role="radiogroup" aria-label="Mostrar">
          {(
            [
              ["todos", "Todos"],
              ["ativos", "Ativos"],
              ["inativos", "Inativos"],
            ] as [FiltroStatus, string][]
          ).map(([valor, nome]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={filtro === valor}
              className={`sc-filtro__opcao${filtro === valor ? " sc-filtro__opcao--ativa" : ""}`}
              onClick={() => onFiltro(valor)}
            >
              {nome}
            </button>
          ))}
        </div>
        )}
        {dica && <p className="sc-lista__dica">{dica}</p>}
      </div>
      <div className="sc-lista__itens">
        {quantidadeVisivel === 0 ? <p className="sc-lista__vazio">{vazio}</p> : children}
      </div>
    </aside>
  );
}

/** Um item da lista (aceita ref/estilo para poder ser arrastado) */
export const ItemSecretaria = forwardRef<
  HTMLDivElement,
  {
    titulo: string;
    meta?: string;
    ativo: boolean;
    selecionado: boolean;
    icone: NomeIcone;
    onSelecionar: () => void;
    /** Sem onAlternar não há a chave ativo/inativo (páginas do discípulo) */
    onAlternar?: () => void;
    /** Mostrado à direita quando não há chave (ex.: concluído, bloqueado) */
    depois?: React.ReactNode;
    /** Variação visual do ícone: concluído (verde-teal) ou bloqueado (cinza) */
    estado?: "concluido" | "bloqueado" | "andamento";
    /** Alça de arrastar e posição, antes do ícone */
    antes?: React.ReactNode;
    selo?: string;
    arrastando?: boolean;
    style?: React.CSSProperties;
  }
>(function ItemSecretaria(
  { titulo, meta, ativo, selecionado, icone, onSelecionar, onAlternar, depois, estado, antes, selo, arrastando, style },
  ref
) {
  return (
    <div
      ref={ref}
      style={style}
      className={`sc-item${selecionado ? " sc-item--selecionado" : ""}${ativo ? "" : " sc-item--inativo"}${arrastando ? " sc-item--arrastando" : ""}${estado ? ` sc-item--${estado}` : ""}${onAlternar ? "" : " sc-item--sem-chave"}`}
    >
      {antes}
      <button
        type="button"
        className="sc-item__principal"
        onClick={() => {
          onSelecionar();
          // No celular o detalhe fica embaixo da lista: leva a tela até ele
          if (window.innerWidth <= 900) {
            setTimeout(() => document.querySelector(".sc-detalhe")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
          }
        }}
        aria-current={selecionado ? "true" : undefined}
      >
        <span className="sc-item__icone" aria-hidden>
          <Icone nome={icone} tamanho={18} />
        </span>
        <span className="sc-item__textos">
          <span className="sc-item__titulo">{titulo}</span>
          {(meta || selo) && (
            <span className="sc-item__meta">
              {selo && <span className="sc-item__selo">{selo}</span>}
              {meta}
            </span>
          )}
        </span>
      </button>
      {depois}
      {onAlternar && (
      <button
        type="button"
        className={`sc-chave${ativo ? " sc-chave--ligada" : ""}`}
        role="switch"
        aria-checked={ativo}
        aria-label={`${titulo}: ${ativo ? "ativo" : "inativo"}`}
        title={ativo ? "Ativo — clique para esconder" : "Inativo — clique para liberar"}
        onClick={onAlternar}
      >
        <span className="sc-chave__trilho" aria-hidden />
      </button>
      )}
    </div>
  );
});

/** Cartão do detalhe: título, situação e ações no topo */
export function DetalheSecretaria({
  titulo,
  status,
  ativo,
  acoes,
  children,
}: {
  titulo: string;
  status: string;
  ativo: boolean;
  acoes: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="sc-detalhe" aria-labelledby="sc-detalhe-titulo">
      <header className="sc-detalhe__topo">
        <div className="sc-detalhe__titulos">
          <span className={`sc-status${ativo ? " sc-status--ativo" : ""}`}>
            <span className="sc-status__ponto" aria-hidden /> {status}
          </span>
          <h2 id="sc-detalhe-titulo">{titulo}</h2>
        </div>
        <div className="sc-detalhe__acoes">{acoes}</div>
      </header>
      <div className="sc-detalhe__corpo">{children}</div>
    </section>
  );
}

/** Estado vazio do detalhe (nada selecionado) */
export function DetalheVazio({ icone, texto, acao }: { icone: NomeIcone; texto: string; acao?: { rotulo: string; onClick: () => void } }) {
  return (
    <section className="sc-detalhe sc-detalhe--vazio">
      <span className="sc-detalhe__vazio-icone" aria-hidden>
        <Icone nome={icone} tamanho={34} />
      </span>
      <p>{texto}</p>
      {acao && (
        <button type="button" className="sc-btn sc-btn--primario" onClick={acao.onClick}>
          + {acao.rotulo}
        </button>
      )}
    </section>
  );
}

/** Filtra por texto e situação (usado pelas quatro páginas) */
export function filtrarItens<T>(itens: T[], busca: string, filtro: FiltroStatus, titulo: (i: T) => string, ativo: (i: T) => boolean): T[] {
  const termo = busca
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return itens.filter((i) => {
    if (filtro === "ativos" && !ativo(i)) return false;
    if (filtro === "inativos" && ativo(i)) return false;
    if (!termo) return true;
    return titulo(i)
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .includes(termo);
  });
}
