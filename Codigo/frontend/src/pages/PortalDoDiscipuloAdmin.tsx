import React from "react";
import { Link } from "react-router-dom";
import "../style/Portal.css";

import imgEscala from "../assets/DSC00436.jpg";
import imgMapa from "../assets/DSC00309.jpg";
import imgFalaAi from "../assets/oracao-cabeca-baixa.jpg";
import imgCelulas from "../assets/DSC00719.jpg";
import imgLicoes from "../assets/IMG_5684.jpg";
import imgFormularios from "../assets/DSC00438.jpg";
import imgModulos from "../assets/IMG_6568.jpg";
import imgQuiz from "../assets/IMG_6936.jpg";
import imgEventos from "../assets/DSC00719.jpg";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

interface PortalProps {
  onNavigate: (tela: string) => void;
}

const PortalDoDiscipuloAdmin: React.FC<PortalProps> = ({ onNavigate }) => {
  return (
    <div className="portal page-with-fixed-header">
      <Header />

      <main id="main-content" className="portal-wrap" tabIndex={-1}>
        <header className="portal-hero">
          <p className="portal-hero__label">Casa dos Discípulos</p>
          <h1 className="portal-hero__title">Portal do Discípulo</h1>
          <p className="portal-hero__subtitle">
            Espaço de formação, comunhão e crescimento. Área administrativa.
          </p>
        </header>

        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Na Casa
          </h2>
          <div className="portal-grid portal-grid--3">
            <Link
              to="/usuario/escala"
              className="portal-card"
              style={{ backgroundImage: `url(${imgEscala})` }}
              aria-label="Escala"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Escala</span>
              <span className="portal-card__desc">Calendário e ministérios</span>
            </Link>
            <Link
              to="/usuario/escala/mapa"
              className="portal-card"
              style={{ backgroundImage: `url(${imgMapa})` }}
              aria-label="Mapa da Escala"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Mapa da Escala</span>
              <span className="portal-card__desc">Visão geral dos eventos</span>
            </Link>
            <Link
              to="/usuario/fala-ai"
              className="portal-card"
              style={{ backgroundImage: `url(${imgFalaAi})` }}
              aria-label="Fala Aí Discípulo"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Fala Aí, Discípulo</span>
              <span className="portal-card__desc">Devocional e palavra do dia</span>
            </Link>
          </div>
        </section>

        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Secretaria das Células
          </h2>
          <div className="portal-grid portal-grid--3">
            <Link
              to="/admin/celulas"
              className="portal-card"
              style={{ backgroundImage: `url(${imgCelulas})` }}
              aria-label="Células"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Células</span>
              <span className="portal-card__desc">Gerenciar células</span>
            </Link>
            <Link
              to="/admin/licoes"
              className="portal-card"
              style={{ backgroundImage: `url(${imgLicoes})` }}
              aria-label="Lições"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Lições</span>
              <span className="portal-card__desc">Conteúdo para as células</span>
            </Link>
            <Link
              to="/admin/formularios"
              className="portal-card"
              style={{ backgroundImage: `url(${imgFormularios})` }}
              aria-label="Formulários"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Formulários</span>
              <span className="portal-card__desc">Relatórios e acompanhamento</span>
            </Link>
          </div>
        </section>

        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Escola de Discípulos
          </h2>
          <div className="portal-grid portal-grid--2">
            <Link
              to="/admin/modulos"
              className="portal-card"
              style={{ backgroundImage: `url(${imgModulos})` }}
              aria-label="Módulos"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Módulos</span>
              <span className="portal-card__desc">Formação e conteúdo</span>
            </Link>
            <Link
              to="/admin/quizzes"
              className="portal-card"
              style={{ backgroundImage: `url(${imgQuiz})` }}
              aria-label="Quiz"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Quiz</span>
              <span className="portal-card__desc">Gerenciar quizzes</span>
            </Link>
          </div>
        </section>

        <section className="portal-section">
          <h2 className="portal-section__title">
            <span className="portal-section__line" aria-hidden />
            Eventos
          </h2>
          <div className="portal-grid portal-grid--1">
            <Link
              to="/admin/eventos"
              className="portal-card portal-card--wide"
              style={{ backgroundImage: `url(${imgEventos})` }}
              aria-label="Eventos"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">Gerenciar Eventos</span>
              <span className="portal-card__desc">Criar e administrar eventos</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PortalDoDiscipuloAdmin;
