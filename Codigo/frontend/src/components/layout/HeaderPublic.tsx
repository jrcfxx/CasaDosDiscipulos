import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "../../style/layout.css";
import iconeIgreja from "../../assets/logo.png";

const LoginIcon = () => (
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
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
    <polyline points="10 17 15 12 10 7"></polyline>
    <line x1="15" y1="12" x2="3" y2="12"></line>
  </svg>
);

/**
 * HeaderPublic Component
 * Header para páginas públicas com botão de login
 */
const HeaderPublic: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleLoginClick = () => {
    if (isAuthenticated) {
      // Se já está logado, vai para o portal apropriado
      navigate(isAdmin ? "/portal/admin" : "/portal/usuario");
    } else {
      // Se não está logado, vai para login
      navigate("/login");
    }
  };

  return (
    <div className="top-bar-wrapper">
      <header className="cd-header">
        <Link to="/" className="header-icone header-logo-link">
          <img src={iconeIgreja} alt="Casa dos Discípulos" />
        </Link>

        <nav className="header-links">
          <Link to="/home">HOME</Link>
          <Link to="/sobre-nos">A CASA</Link>
        </nav>

        <button
          className="header-login-btn"
          title={isAuthenticated ? "Ir para Portal" : "Fazer Login"}
          onClick={handleLoginClick}
        >
          <LoginIcon />
          <span>{isAuthenticated ? "Portal" : "Entrar"}</span>
        </button>
      </header>
    </div>
  );
};

export default HeaderPublic;
