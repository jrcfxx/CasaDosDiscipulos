import React from "react";
import { Link } from "react-router-dom";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import Icone from "../ui/Icone";
import fotoAbertura from "../../assets/lendo_biblia.jpg";
import "../../style/Portal.css";

export interface AtalhoPortal {
  to: string;
  titulo: string;
  descricao: string;
  foto: string;
}

export interface GrupoPortal {
  titulo: string;
  atalhos: AtalhoPortal[];
}

/** Painel de abertura das páginas do Portal: etiquetas nos cantos, título condensado e, se houver, foto ao fundo. */
export function AberturaPortal({
  etiqueta,
  titulo,
  descricao,
  foto,
}: {
  etiqueta: string;
  titulo: React.ReactNode;
  descricao?: string;
  foto?: string;
}) {
  return (
    <section className={`pt-abertura${foto ? "" : " pt-abertura--sem-foto"}`} aria-labelledby="pt-titulo">
      {foto && <div className="pt-abertura__foto" style={{ backgroundImage: `url(${foto})` }} aria-hidden />}
      <p className="pt-cantos" aria-hidden>
        <span>Casa dos Discípulos</span>
        <span>{etiqueta}</span>
      </p>
      <div className="pt-abertura__texto">
        <h1 id="pt-titulo">{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
    </section>
  );
}

/**
 * Início do Portal do Discípulo (membro, líder e administração), na linguagem das páginas públicas:
 * painel de abertura com foto e título condensado, e atalhos como painéis de foto agrupados por área.
 */
export default function PortalInicio({
  area,
  descricao,
  grupos,
  antesDosGrupos,
}: {
  /** Etiqueta do canto: "Área do discípulo" ou "Área administrativa" */
  area: string;
  descricao: string;
  grupos: GrupoPortal[];
  /** Conteúdo entre a abertura e os atalhos (ex.: resumo personalizado) */
  antesDosGrupos?: React.ReactNode;
}) {
  return (
    <div className="pt">
      <Header />

      <main id="main-content" className="pt-paineis" tabIndex={-1}>
        <AberturaPortal
          etiqueta={area}
          titulo={<>Portal do <em>Discípulo</em></>}
          descricao={descricao}
          foto={fotoAbertura}
        />

        {antesDosGrupos}

        {grupos.map((g, i) => {
          const id = `pt-grupo-${i}`;
          return (
            <section key={g.titulo} className="pt-grupo" aria-labelledby={id}>
              <h2 id={id} className="pt-grupo__titulo">
                <span className="pt-grupo__numero" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                {g.titulo}
              </h2>
              <ul className={`pt-atalhos pt-atalhos--${Math.min(g.atalhos.length, 4)}`}>
                {g.atalhos.map((a) => (
                  <li key={a.to}>
                    <Link to={a.to} className="pt-atalho">
                      <span className="pt-atalho__foto" style={{ backgroundImage: `url(${a.foto})` }} aria-hidden />
                      <span className="pt-atalho__seta" aria-hidden>
                        <Icone nome="proximo" tamanho={20} />
                      </span>
                      <span className="pt-atalho__texto">
                        <span className="pt-atalho__titulo">{a.titulo}</span>
                        <span className="pt-atalho__descricao">{a.descricao}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}
