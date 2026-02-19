import React from "react";
import { Link } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import "../style/SobreNos.css";

import imagem01 from "../assets/lendo_biblia_.jpeg";
import imagem02 from "../assets/casal_leitura.jpeg";
import imagem03 from "../assets/tres_mulheres.jpeg";
import imagem04 from "../assets/4.png";

/**
 * SobreNos - Página sobre a Casa dos Discípulos (layout moderno e clean)
 */
const SobreNos: React.FC = () => {
  return (
    <div className="sobre-nos-page">
      <HeaderHome />

      <main className="sobre-nos-content">
        {/* Hero */}
        <section className="sobre-nos-hero">
          <div
            className="sobre-nos-hero__bg"
            style={{ backgroundImage: `url(${imagem01})` }}
          />
          <div className="sobre-nos-hero__overlay" />
          <div className="sobre-nos-hero__texto">
            <h1 className="sobre-nos-hero__titulo">
              Conheça <span>a Casa</span>
            </h1>
            <p className="sobre-nos-hero__subtitulo">
              Uma comunidade que compartilha o amor de Cristo
            </p>
          </div>
        </section>

        {/* Missão */}
        <section className="sobre-nos-section sobre-nos-section--alt">
          <div className="sobre-nos-section__grid">
            <div className="sobre-nos-section__img-wrap">
              <img
                src={imagem02}
                alt="Nossa Missão"
                className="sobre-nos-section__img"
                loading="lazy"
              />
            </div>
            <div className="sobre-nos-section__body">
              <h2 className="sobre-nos-section__titulo">Missão</h2>
              <p className="sobre-nos-section__texto">
                Compartilhar do amor de Deus em Cristo e glorificá-Lo com uma
                vida de comunhão, celebração, discipulado, serviço e testemunho
                no poder do Espírito Santo.
              </p>
            </div>
          </div>
        </section>

        {/* Visão */}
        <section className="sobre-nos-section">
          <div className="sobre-nos-section__grid sobre-nos-section__grid--reverse">
            <div className="sobre-nos-section__img-wrap">
              <img
                src={imagem03}
                alt="Nossa Visão"
                className="sobre-nos-section__img"
                loading="lazy"
              />
            </div>
            <div className="sobre-nos-section__body">
              <h2 className="sobre-nos-section__titulo">Visão</h2>
              <p className="sobre-nos-section__texto">
                A Casa dos Discípulos é uma igreja acolhedora que compartilha o
                evangelho do Reino com simplicidade, integridade e amor.
              </p>
            </div>
          </div>
        </section>

        {/* Comunidade - full width */}
        <section className="sobre-nos-full">
          <img
            src={imagem04}
            alt="Nossa Comunidade"
            className="sobre-nos-full__img"
            loading="lazy"
          />
        </section>

        {/* Voltar para Home */}
        <section className="sobre-nos-cta">
          <Link to="/" className="sobre-nos-cta__link">
            ← Voltar para Home
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SobreNos;
