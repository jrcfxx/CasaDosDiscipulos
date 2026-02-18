import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../style/PortalDoDiscipuloUser.css";
import imgLicoes from "../assets/lendo_biblia.jpeg";
import imgFormularios from "../assets/lendo_biblia_.jpeg";
import imgModulos from "../assets/casal_leitura.jpeg";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PortalDoDiscipuloUser: React.FC = () => {
  const { isLider, isMembro } = useAuth();

  return (
    <div className="portal-user">
      <Header />

      <main className="portal-wrap">
        <h1 className="portal-title">PORTAL DO DISCÍPULO</h1>

        {/* Secretaria das Células - Apenas para Líderes */}
        {isLider && (
          <>
            <h2 className="portal-subtitle">SECRETARIA DAS CÉLULAS</h2>
            <div className="grid-2">
              <NavLink
                to="/usuario/licoes"
                className="portal-card"
                style={{ backgroundImage: `url(${imgLicoes})` }}
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">LIÇÕES</span>
              </NavLink>

              <NavLink
                to="/usuario/formularios"
                className="portal-card"
                style={{ backgroundImage: `url(${imgFormularios})` }}
              >
                <span className="portal-card__overlay" />
                <span className="portal-card__title">FORMULÁRIOS</span>
              </NavLink>
            </div>
          </>
        )}

        {/* Escola de Discípulos - Para Líderes e Membros */}
        <h2 className={`portal-subtitle ${isLider ? "mt-section" : ""}`}>
          ESCOLA DE DISCÍPULOS
        </h2>
        <div className="grid-1">
          <NavLink
            to="/usuario/modulos"
            className="portal-card portal-card--wide"
            style={{ backgroundImage: `url(${imgModulos})` }}
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
