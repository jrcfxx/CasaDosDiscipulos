import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "../../style/layout.css";

/**
 * Header minimalista para Home e Sobre nós - Home, Sobre nós e Login
 */
const HeaderHome: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/portal/admin" : "/portal/usuario");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="header-home">
      <nav className="header-home__nav">
        <Link to="/" className="header-home__link">
          Home
        </Link>
        <Link to="/sobre-nos" className="header-home__link">
          Sobre nós
        </Link>
        <button
          className="header-home__btn-login"
          onClick={handleLogin}
          aria-label={isAuthenticated ? "Ir para Portal" : "Fazer Login"}
        >
          {isAuthenticated ? "Portal" : "Entrar"}
        </button>
      </nav>
    </header>
  );
};

export default HeaderHome;
