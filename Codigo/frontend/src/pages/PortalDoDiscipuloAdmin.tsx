import React from "react";
import { Link } from "react-router-dom";
import "../style/PortalDoDiscipuloAdmin.css";

import imgLicoes from "../assets/maos_dadas.jpeg";
import imgCelulas from "../assets/celulas.jpg";
import imgFormularios from "../assets/formulario_oficial.jpg";
import imgModulos from "../assets/casal_leitura.jpeg";
import imgQuiz from "../assets/quizz.jpg";
import imgEventos from "../assets/presenca.jpeg";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

interface PortalProps {
  onNavigate: (tela: string) => void;
}

const PortalDoDiscipuloAdmin: React.FC<PortalProps> = ({ onNavigate }) => {
  return (
    <div className="portal page-with-fixed-header">
      <Header />

      <main className="portal-wrap">
        <h1 className="portal-title">PORTAL DO DISCÍPULO</h1>

        {}
        <section className="portal-section">
          <h2 className="portal-subtitle">SECRETARIA DAS CÉLULAS</h2>

          <div className="portal-grid">
            <Link
              to="/admin/celulas"
              className="portal-card"
              style={{ backgroundImage: `url(${imgCelulas})` }}
              aria-label="Células"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">CÉLULAS</span>
            </Link>

            <Link
              to="/admin/licoes"
              className="portal-card"
              style={{ backgroundImage: `url(${imgLicoes})` }}
              aria-label="Lições"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">LIÇÕES</span>
            </Link>

            <Link
              to="/admin/formularios"
              className="portal-card"
              style={{ backgroundImage: `url(${imgFormularios})` }}
              aria-label="Formulários"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">FORMULÁRIOS</span>
            </Link>
          </div>
        </section>

        {}
        <section className="portal-section">
          <h2 className="portal-subtitle">ESCOLA DE DISCÍPULOS</h2>

          {}
          <div className="portal-grid">
            <Link
              to="/admin/modulos"
              className="portal-card"
              style={{ backgroundImage: `url(${imgModulos})` }}
              aria-label="Módulos"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">MÓDULOS</span>
            </Link>

            <Link
              to="/admin/quizzes"
              className="portal-card"
              style={{ backgroundImage: `url(${imgQuiz})` }}
              aria-label="Quiz"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">QUIZ</span>
            </Link>
          </div>
        </section>

        {}
        <section className="portal-section">
          <h2 className="portal-subtitle">EVENTOS</h2>

          <div className="portal-grid">
            <Link
              to="/admin/eventos"
              className="portal-card"
              style={{ backgroundImage: `url(${imgEventos})` }}
              aria-label="Eventos"
            >
              <div className="portal-card__overlay" />
              <span className="portal-card__title">GERENCIAR EVENTOS</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PortalDoDiscipuloAdmin;
