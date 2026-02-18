import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { getUserProfile } from "../../services/usuario";
import "../../style/layout.css";
import iconeIgreja from "../../assets/logo.png";
import perfilDefault from "../../assets/perfil-preto.png";

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

const HeaderAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUserPhoto() {
      try {
        const data = await getUserProfile();
        if (data?.foto) {
          const fotoUrl = data.foto.startsWith("http")
            ? data.foto
            : `http://localhost:3001${data.foto}`;
          console.log("Foto header do banco:", data.foto);
          console.log("URL header da foto:", fotoUrl);
          setUserPhoto(fotoUrl);
        }
      } catch (err) {
        console.error("Erro ao carregar foto do usuário:", err);
      }
    }

    fetchUserPhoto();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const handlePerfil = () => {
    setDropdownOpen(false);
    navigate("/perfil");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const togglePortalDropdown = () => {
    setPortalDropdownOpen(!portalDropdownOpen);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        portalDropdownRef.current &&
        !portalDropdownRef.current.contains(event.target as Node)
      ) {
        setPortalDropdownOpen(false);
      }
    };

    if (dropdownOpen || portalDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, portalDropdownOpen]);

  return (
    <div className="top-bar-wrapper">
      <header className="cd-header">
        <div className="header-icone">
          <img src={iconeIgreja} alt="Igreja" />
        </div>

        <nav className="header-links">
          <Link to="/home">HOME</Link>

          <div className="nav-dropdown-container" ref={portalDropdownRef}>
            <button className="nav-dropdown-btn" onClick={togglePortalDropdown}>
              PORTAL DO DISCÍPULO
              <svg
                className={`dropdown-arrow ${portalDropdownOpen ? "open" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {portalDropdownOpen && (
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-section nav-dropdown-portal">
                  <Link
                    to="/portal/admin"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Portal
                  </Link>
                </div>

                <div className="nav-dropdown-section">
                  <p className="nav-dropdown-title">SECRETARIA DAS CÉLULAS</p>
                  <Link
                    to="/admin/licoes"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Lições
                  </Link>
                  <Link
                    to="/admin/formularios"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Formulários
                  </Link>
                </div>

                <div className="nav-dropdown-section">
                  <p className="nav-dropdown-title">ESCOLA DE DISCÍPULOS</p>
                  <Link
                    to="/admin/modulos"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Módulos
                  </Link>
                  <Link
                    to="/admin/quizzes"
                    onClick={() => setPortalDropdownOpen(false)}
                  >
                    Quiz
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link to="/admin/usuarios">GERENCIAR USUÁRIOS</Link>
        </nav>

        <div className="header-profile-container" ref={dropdownRef}>
          <button
            className="header-profile-btn"
            title="Perfil"
            onClick={toggleDropdown}
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="Foto de perfil"
                className="header-profile-photo"
              />
            ) : (
              <ProfileIcon />
            )}
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handlePerfil}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
                Editar Perfil
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default HeaderAdmin;
