import React from "react";
import HeaderPublic from "../components/layout/HeaderPublic";
import Footer from "../components/layout/Footer";
import "../style/SobreNos.css";

import imagem01 from "../assets/lendo_biblia_.jpeg";
import imagem02 from "../assets/casal_leitura.jpeg";
import imagem03 from "../assets/tres_mulheres.jpeg";
import imagem04 from "../assets/4.png";

/**
 * SobreNos Component
 * Página sobre a Casa dos Discípulos com apresentação visual
 */
const SobreNos: React.FC = () => {
  return (
    <div className="sobre-nos-page page-with-fixed-header">
      <HeaderPublic />

      <main className="sobre-nos-content">
        <h1 className="sobre-nos__title">A CASA</h1>

        <div className="sobre-nos__images">
          <section className="sobre-nos__section">
            <div className="sobre-nos__image-wrapper">
              <img
                src={imagem01}
                alt="Bem-vindo à Casa dos Discípulos"
                className="sobre-nos__image"
                loading="eager"
              />
              <div className="sobre-nos__text-overlay">
                <div className="sobre-nos__welcome-text">
                  <h2 className="sobre-nos__welcome-line">Seja bem-vindo</h2>
                  <h3 className="sobre-nos__simple-text">
                    Conheça <span className="sobre-nos__playfair">a Casa</span>
                  </h3>
                </div>
              </div>
            </div>
          </section>

          <section className="sobre-nos__section">
            <div className="sobre-nos__image-wrapper">
              <img
                src={imagem02}
                alt="Nossa Missão"
                className="sobre-nos__image"
                loading="lazy"
              />
              <div className="sobre-nos__text-overlay">
                <div className="sobre-nos__mission-vision">
                  <h3 className="sobre-nos__section-title">Missão</h3>
                  <p className="sobre-nos__text">
                    Compartilhar do amor de Deus em Cristo e glorificá-Lo com
                    uma vida de comunhão, celebração, discipulado, serviço e
                    testemunho no poder do Espírito Santo.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="sobre-nos__section">
            <div className="sobre-nos__image-wrapper">
              <img
                src={imagem03}
                alt="Nossa Visão"
                className="sobre-nos__image"
                loading="lazy"
              />
              <div className="sobre-nos__text-overlay">
                <div className="sobre-nos__mission-vision">
                  <h3 className="sobre-nos__section-title">Visão</h3>
                  <p className="sobre-nos__text">
                    A Casa dos Discípulos é uma igreja acolhedora que
                    compartilha o evangelho do Reino com simplicidade,
                    integridade e amor.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="sobre-nos__section">
            <div className="sobre-nos__image-wrapper">
              <img
                src={imagem04}
                alt="Nossa Comunidade"
                className="sobre-nos__image"
                loading="lazy"
              />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SobreNos;
