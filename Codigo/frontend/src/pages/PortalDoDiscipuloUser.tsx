import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../style/Portal.css";
import imgEscala from "../assets/DSC00436.jpg";
import imgMapa from "../assets/DSC00309.jpg";
import imgFalaAi from "../assets/oracao-cabeca-baixa.jpg";
import imgLicoes from "../assets/IMG_5684.jpg";
import imgFormularios from "../assets/DSC00438.jpg";
import imgModulos from "../assets/IMG_6568.jpg";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PortalDoDiscipuloUser: React.FC = () => {
  const { isLiderCelula } = useAuth();

  return (
    <div className="portal-user">
      <Header />

      <main id="main-content" className="portal-wrap" tabIndex={-1}>
        <header className="portal-hero">
          <p className="portal-hero__label">Casa dos Discípulos</p>
          <h1 className="portal-hero__title">Portal do Discípulo</h1>
          <p className="portal-hero__subtitle">
            Seu espaço de formação, comunhão e crescimento.
          </p>
        </header>

        {/* Na Casa - Escala + Fala Aí */}
        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Na Casa
          </h2>
          <div className="portal-grid portal-grid--3">
            <NavLink
              to="/usuario/escala"
              className="portal-card"
              style={{ backgroundImage: `url(${imgEscala})` }}
              aria-label="Acessar Escala"
            >
              <span className="portal-card__overlay" />
              <span className="portal-card__title">Escala</span>
              <span className="portal-card__desc">Calendário e ministérios</span>
            </NavLink>
            <NavLink
              to="/usuario/escala/mapa"
              className="portal-card"
              style={{ backgroundImage: `url(${imgMapa})` }}
              aria-label="Acessar Mapa da Escala"
            >
              <span className="portal-card__overlay" />
              <span className="portal-card__title">Mapa da Escala</span>
              <span className="portal-card__desc">Visão geral dos eventos</span>
            </NavLink>
            <NavLink
              to="/usuario/fala-ai"
              className="portal-card"
              style={{ backgroundImage: `url(${imgFalaAi})` }}
              aria-label="Acessar Fala Aí, Discípulo"
            >
              <span className="portal-card__overlay" />
              <span className="portal-card__title">Fala Aí, Discípulo</span>
              <span className="portal-card__desc">Devocional e palavra do dia</span>
            </NavLink>
          </div>
        </section>

        {/* Secretaria das Células - Líderes */}
        {isLiderCelula && (
          <section className="portal-section">
            <h2 className="portal-section__title">
              <span className="portal-section__line" aria-hidden />
              Secretaria das Células
            </h2>
            <div className="portal-grid portal-grid--2">
              <NavLink
                to="/usuario/licoes"
                className="portal-card"
                style={{ backgroundImage: `url(${imgLicoes})` }}
                aria-label="Acessar Lições"
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">Lições</span>
                <span className="portal-card__desc">Conteúdo para as células</span>
              </NavLink>
              <NavLink
                to="/usuario/formularios"
                className="portal-card"
                style={{ backgroundImage: `url(${imgFormularios})` }}
                aria-label="Acessar Formulários"
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">Formulários</span>
                <span className="portal-card__desc">Relatórios e acompanhamento</span>
              </NavLink>
            </div>
          </section>
        )}

        {/* Escola de Discípulos */}
        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Escola de Discípulos
          </h2>
          <div className="portal-grid portal-grid--1">
            <NavLink
              to="/usuario/modulos"
              className="portal-card portal-card--wide"
              style={{ backgroundImage: `url(${imgModulos})` }}
              aria-label="Acessar Módulos"
            >
              <span className="portal-card__overlay" />
              <span className="portal-card__title">Módulos</span>
              <span className="portal-card__desc">Formação e crescimento com quizzes gamificados</span>
            </NavLink>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PortalDoDiscipuloUser;
