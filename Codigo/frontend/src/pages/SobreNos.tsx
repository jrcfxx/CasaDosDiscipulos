import React from "react";
import { Link } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import "../style/SobreNos.css";

import imagem01 from "../assets/lendo_biblia_.jpeg";
import imagem02 from "../assets/casal_leitura.jpeg";
import imagem03 from "../assets/tres_mulheres.jpeg";

const INSTAGRAM_REEL = "https://www.instagram.com/reel/DPJpTVdESov/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==";
const INSTAGRAM_PERFIL = "https://www.instagram.com/casadosdiscipulos?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

/**
 * SobreNos - Página sobre a Casa dos Discípulos (layout moderno, branding Casa)
 */
const SobreNos: React.FC = () => {
  return (
    <div className="sobre-nos-page">
      <HeaderHome />

      <main className="sobre-nos-content">
        {/* Hero - mantido */}
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

        {/* Instagram - Nossa História */}
        <section className="sobre-nos-instagram">
          <p className="sobre-nos-instagram__label">— Conecte-se</p>
          <h2 className="sobre-nos-instagram__titulo">Nossa história</h2>
          <p className="sobre-nos-instagram__texto">
            Assista ao Reel que conta a trajetória da Casa dos Discípulos.
          </p>
          <div className="sobre-nos-instagram__links">
            <a
              href={INSTAGRAM_REEL}
              target="_blank"
              rel="noopener noreferrer"
              className="sobre-nos-instagram__btn"
              aria-label="Ver Reel no Instagram"
            >
              Assistir Reel
            </a>
            <a
              href={INSTAGRAM_PERFIL}
              target="_blank"
              rel="noopener noreferrer"
              className="sobre-nos-instagram__btn sobre-nos-instagram__btn--outline"
              aria-label="Visitar perfil no Instagram"
            >
              @casadosdiscipulos
            </a>
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

        {/* Dízimos e Ofertas */}
        <section className="sobre-nos-dizimos">
          <p className="sobre-nos-dizimos__label">— Contribua</p>
          <h2 className="sobre-nos-dizimos__titulo">Dízimos e Ofertas</h2>
          <p className="sobre-nos-dizimos__texto">
            Contribua com a obra da Casa através do PIX.
          </p>
          <div className="sobre-nos-dizimos__box">
            <div className="sobre-nos-dizimos__qr-wrap">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent("34.455.752/0001-69")}`}
                alt="QR Code PIX"
                className="sobre-nos-dizimos__qr"
                width={160}
                height={160}
              />
            </div>
            <div className="sobre-nos-dizimos__chave">
              <p className="sobre-nos-dizimos__chave-label">Chave PIX</p>
              <p className="sobre-nos-dizimos__chave-valor">34.455.752/0001-69</p>
            </div>
          </div>
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
