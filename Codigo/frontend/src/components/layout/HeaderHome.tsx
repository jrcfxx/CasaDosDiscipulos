import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import logoCasa from "../../assets/logo_mark.png";
import "../../style/layout.css";

/**
 * Header minimalista para Home e Sobre nós - estilo Central
 * Logo + Home, A Casa, Células, Campanha Nova Sede, Entrar.
 * No celular os links vão para um menu (☰); o botão Entrar continua sempre visível.
 */
const HeaderHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu ao trocar de página e com Esc
  useEffect(() => setMenuAberto(false), [location.pathname, location.hash]);
  useEffect(() => {
    if (!menuAberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [menuAberto]);

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/portal/admin" : "/portal/usuario");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className={`header-home${menuAberto ? " header-home--aberto" : ""}`}>
      <Link to="/" className="header-home__logo">
        <img src={logoCasa} alt="Casa dos Discípulos" />
      </Link>
      <nav id="menu-principal" className="header-home__nav" aria-label="Menu principal">
        <Link to="/" className="header-home__link">
          Home
        </Link>
        <Link to="/sobre-nos" className="header-home__link">
          A Casa
        </Link>
        <Link to="/celulas" className="header-home__link">
          Células
        </Link>
        <Link to="/#campanha-nova-sede" className="header-home__link" onClick={() => setMenuAberto(false)}>
          Campanha Nova Sede
        </Link>
      </nav>
      <div className="header-home__acoes">
        <button
          className="header-home__btn-login"
          onClick={handleLogin}
          aria-label={isAuthenticated ? "Ir para Portal" : "Fazer Login"}
        >
          {isAuthenticated ? "Portal" : "Entrar"}
        </button>
        <button
          type="button"
          className="header-home__menu"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span aria-hidden>{menuAberto ? "✕" : "☰"}</span>
        </button>
      </div>
    </header>
  );
};

export default HeaderHome;
