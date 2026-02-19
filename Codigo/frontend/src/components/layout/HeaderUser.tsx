import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "../../style/layout.css";
import iconeIgreja from "../../assets/logo.png";

const ProfileIcon = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const HeaderUser: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="top-bar-wrapper">
      <header className="cd-header">
        <div className="header-icone">
          <img src={iconeIgreja} alt="Igreja" />
        </div>

        <nav className="header-links">
          <Link to="/home">HOME</Link>
          <Link to="/portal/usuario">PORTAL DO DISCÍPULO</Link>
          <Link to="/sobre-nos">A CASA</Link>
        </nav>

        <button
          className="header-profile-btn"
          title="Sair"
          onClick={handleLogout}
        >
          <ProfileIcon />
        </button>
      </header>
    </div>
  );
};

export default HeaderUser;
