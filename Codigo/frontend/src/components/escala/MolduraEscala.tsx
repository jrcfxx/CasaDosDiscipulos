import React from "react";
import { Link } from "react-router-dom";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import Icone, { type NomeIcone } from "../ui/Icone";
import "../../style/secretaria.css";
import "../../style/escalaModerna.css";

export type AbaEscala = "minhas" | "calendario";

interface Numero {
  valor: number | string;
  rotulo: string;
}

/**
 * Moldura das telas da Escala: topo da Casa com explicação e números do período, e duas abas
 * (Minhas escalas / Escala da Casa).
 */
export default function MolduraEscala({
  aba,
  descricao,
  numeros = [],
  acao,
  children,
}: {
  aba: AbaEscala;
  descricao: string;
  numeros?: Numero[];
  acao?: { rotulo: string; onClick: () => void };
  children: React.ReactNode;
}) {
  const abas: Array<{ id: AbaEscala; to: string; nome: string; icone: NomeIcone }> = [
    { id: "minhas", to: "/usuario/escala?ver=minhas", nome: "Minhas escalas", icone: "pessoa" },
    { id: "calendario", to: "/usuario/escala?ver=calendario", nome: "Escala da Casa", icone: "calendario" },
  ];
  const titulo = "Escala";

  return (
    <div className="sc-pagina es page-with-fixed-header escala-page">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="sc-topo es-topo" aria-labelledby="es-titulo">
          <div className="sc-topo__conteudo">
            <div className="sc-topo__texto">
              <p className="sc-topo__area"><Icone nome="calendario" tamanho={15} /> Na Casa</p>
              <h1 id="es-titulo">{titulo}</h1>
              <p className="sc-topo__descricao">{descricao}</p>
              {numeros.length > 0 && (
                <ul className="sc-topo__numeros" aria-label="Resumo do período">
                  {numeros.map((n) => (
                    <li key={n.rotulo}><strong>{n.valor}</strong><span>{n.rotulo}</span></li>
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
          <nav className="sc-abas" aria-label="Seções da escala">
            {abas.map((a) => (
              <Link
                key={a.id}
                to={a.to}
                className={`sc-aba${aba === a.id ? " sc-aba--ativa" : ""}`}
                aria-current={aba === a.id ? "page" : undefined}
              >
                <Icone nome={a.icone} tamanho={15} /> {a.nome}
              </Link>
            ))}
          </nav>
        </section>
        <div className="sc-corpo-fundo es-fundo">
          <div className="es-corpo">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
