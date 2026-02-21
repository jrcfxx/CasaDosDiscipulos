import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../style/PortalDoDiscipuloUser.css";
import imgLicoes from "../assets/lendo_biblia.jpeg";
import imgFormularios from "../assets/lendo_biblia_.jpeg";
import imgModulos from "../assets/casal_leitura.jpeg";
import imgEscala from "../assets/presenca.jpeg";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PortalDoDiscipuloUser: React.FC = () => {
  const { isLiderCelula, isLiderMinisterio } = useAuth();

  return (
    <div className="portal-user">
      <Header />

      <main id="main-content" className="portal-wrap" tabIndex={-1}>
        <h1 className="portal-title">PORTAL DO DISCÍPULO</h1>

        {/* Na Casa - Escala + Fala Aí - Todos os usuários */}
        <h2 className="portal-subtitle">NA CASA</h2>
        <div className="grid-2 grid-na-casa">
          <NavLink
            to="/usuario/escala"
            className="portal-card"
            style={{ backgroundImage: `url(${imgEscala})` }}
            aria-label="Escala"
          >
            <span className="portal-card__overlay" />
            <span className="portal-card__title">ESCALA</span>
          </NavLink>
          <NavLink
            to="/usuario/escala/mapa"
            className="portal-card"
            style={{ backgroundImage: `url(${imgEscala})` }}
            aria-label="Mapa da Escala"
          >
            <span className="portal-card__overlay" />
            <span className="portal-card__title">MAPA DA ESCALA</span>
          </NavLink>
          <NavLink
            to="/usuario/fala-ai"
            className="portal-card"
            style={{ backgroundImage: `url(${imgModulos})` }}
            aria-label="Fala Aí, Discípulo"
          >
            <span className="portal-card__overlay" />
            <span className="portal-card__title">FALA AÍ, DISCÍPULO</span>
          </NavLink>
        </div>

        {/* Secretaria das Células - Apenas para Líderes de Célula */}
        {isLiderCelula && (
          <>
            <h2 className="portal-subtitle mt-section">
              SECRETARIA DAS CÉLULAS
            </h2>
            <div className="grid-2">
              <NavLink
                to="/usuario/licoes"
                className="portal-card"
                style={{ backgroundImage: `url(${imgLicoes})` }}
                aria-label="Lições"
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">LIÇÕES</span>
              </NavLink>

              <NavLink
                to="/usuario/formularios"
                className="portal-card"
                style={{ backgroundImage: `url(${imgFormularios})` }}
                aria-label="Formulários"
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">FORMULÁRIOS</span>
              </NavLink>
            </div>
          </>
        )}

        {/* Escola de Discípulos - Para Líderes e Membros */}
        <h2 className="portal-subtitle mt-section">
          ESCOLA DE DISCÍPULOS
        </h2>
        <div className="grid-1">
          <NavLink
            to="/usuario/modulos"
            className="portal-card portal-card--wide"
            style={{ backgroundImage: `url(${imgModulos})` }}
            aria-label="Módulos"
          >
            <span className="portal-card__overlay" />
            <span className="portal-card__title">MÓDULOS</span>
          </NavLink>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PortalDoDiscipuloUser;
