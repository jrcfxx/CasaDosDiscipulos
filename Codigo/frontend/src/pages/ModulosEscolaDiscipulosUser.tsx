import React, { useState } from "react";
import "../style/ModulosEscolaDiscipulosUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

type Modulo = {
  id: number;
  titulo: string;
  descricao: string;
};

const MODULOS: Modulo[] = [
  {
    id: 1,
    titulo: "Módulo 1",
    descricao:
      "Descrição do módulo. Informações sobre o propósito e os resultados esperados deste módulo.",
  },
  {
    id: 2,
    titulo: "Módulo 2",
    descricao: "Breve resumo do conteúdo do módulo 2.",
  },
  {
    id: 3,
    titulo: "Módulo 3",
    descricao: "Breve resumo do conteúdo do módulo 3.",
  },
  {
    id: 4,
    titulo: "Módulo 4",
    descricao: "Breve resumo do conteúdo do módulo 4.",
  },
  {
    id: 5,
    titulo: "Módulo 5",
    descricao: "Breve resumo do conteúdo do módulo 5.",
  },
];

const RANKING = [
  { iniciais: "AT", nome: "Alfredo Torres", frase: "Keep it simple" },
  { iniciais: "AD", nome: "Avery Davis", frase: "You're wonderful" },
  { iniciais: "CD", nome: "Cathaya Devil", frase: "You got this" },
  { iniciais: "OW", nome: "Olivia Wilson", frase: "Live your purpose" },
  { iniciais: "YA", nome: "Yael Amani", frase: "Kindness" },
];

const ModulosEscolaDiscipulosUser: React.FC = () => {
  const [aberto, setAberto] = useState<number>(1);

  return (
    <div className="page">
      <Header />

      {/* Conteúdo */}
      <main className="modulos-wrap">
        <h1 className="page-title">ESCOLA DE DISCÍPULOS</h1>

        <section className="modulos-grid" aria-label="Conteúdo">
          {/* Coluna esquerda - módulos */}
          <div className="col-esq">
            {MODULOS.map((m) => {
              const isOpen = aberto === m.id;
              return (
                <article
                  key={m.id}
                  className={`mod-card ${isOpen ? "open" : ""}`}
                >
                  <button
                    className="mod-head"
                    aria-expanded={isOpen}
                    onClick={() => setAberto(isOpen ? 0 : m.id)}
                  >
                    {m.titulo}
                    <span className="chevron" aria-hidden>
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mod-body">
                      <p className="mod-desc">{m.descricao}</p>
                      <button className="btn-prim" type="button">
                        Realizar módulo
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Coluna direita (ranking) */}
          <aside className="col-dir" aria-label="Ranking">
            <div className="panel">
              <h2 className="panel-title">RANKING</h2>

              <ul className="ranking-list">
                {RANKING.map((i, idx) => (
                  <li key={idx} className="rank-item">
                    <div className="avatar" aria-hidden="true">
                      {i.iniciais}
                    </div>
                    <div className="rank-info">
                      <strong>{i.nome}</strong>
                      <span>{i.frase}</span>
                    </div>
                    <span className="rank-more" aria-hidden>
                      ›
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ModulosEscolaDiscipulosUser;
