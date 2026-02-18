import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPublic from "../components/layout/HeaderPublic";
import Footer from "../components/layout/Footer";
import Carousel from "../components/Carousel";
import "../style/HomePage.css";
import axios from "axios";

import logoCasa from "../assets/logo_casa.png";
import imagemHero from "../assets/casal.jpg";
import imagemDiscipulado from "../assets/lendo_biblia.jpg";
import imagemCelulas from "../assets/celulas.jpg";

/**
 * HomePage Component
 * Página inicial pública com informações sobre a Casa dos Discípulos
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3001/api/evento/ativos"
      );
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const handleConhecerCasa = () => {
    navigate("/sobre-nos");
  };

  return (
    <div className="home-page">
      <HeaderPublic />

      <main className="home-content">
        {/* Logo Section */}
        <section className="home-logo">
          <img
            src={logoCasa}
            alt="Casa dos Discípulos"
            className="home-logo__image"
            loading="eager"
          />
        </section>

        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero__image-wrapper">
            <img
              src={imagemHero}
              alt="Seguindo o Mestre por amor"
              className="home-hero__image"
              loading="eager"
            />
            <div className="home-hero__overlay">
              <h1 className="home-hero__title">
                Seguindo o<br />
                Mestre por
                <br />
                Amor
              </h1>
              <button
                className="home-hero__cta"
                onClick={handleConhecerCasa}
                aria-label="Conhecer a Casa dos Discípulos"
              >
                Conheça a Casa
              </button>
            </div>
          </div>
        </section>

        {/* Ministérios Section */}
        <section className="home-ministerios">
          <div className="home-ministerios__grid">
            {/* Card Discipulado */}
            <article className="home-card-flip">
              <div className="home-card-flip__inner">
                <div className="home-card-flip__front">
                  <img
                    src={imagemDiscipulado}
                    alt="Escola de Discípulos"
                    className="home-card-flip__image"
                    loading="lazy"
                  />
                  <div className="home-card-flip__title">Discipulado</div>
                </div>
                <div className="home-card-flip__back">
                  <h3>Discipulado</h3>
                  <p>
                    Na Escola de Discípulos, você aprende a seguir os passos de
                    Cristo, aprofundando sua fé e crescendo espiritualmente em
                    comunhão com outros irmãos.
                  </p>
                </div>
              </div>
            </article>

            {/* Card Células */}
            <article className="home-card-flip">
              <div className="home-card-flip__inner">
                <div className="home-card-flip__front">
                  <img
                    src={imagemCelulas}
                    alt="Células de Comunhão"
                    className="home-card-flip__image"
                    loading="lazy"
                  />
                  <div className="home-card-flip__title">Células</div>
                </div>
                <div className="home-card-flip__back">
                  <h3>Células</h3>
                  <p>
                    Pequenos grupos que se reúnem para compartilhar a vida,
                    estudar a Palavra e fortalecer os laços de amor e comunhão
                    na família de Deus.
                  </p>
                  <button
                    className="home-card-flip__cta"
                    onClick={() =>
                      window.open(
                        "https://my.forms.app/form/6156f37483c907649990ca8f",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    aria-label="Encontre sua Célula"
                  >
                    Encontre sua Célula
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Eventos Section */}
        <section className="home-eventos">
          <Carousel items={eventos} autoPlayInterval={5000} />
        </section>

        {/* Plataforma de Estudos Section */}
        <section className="home-plataforma">
          <div className="home-plataforma__container">
            <div className="home-plataforma__content">
              <h2 className="home-plataforma__title">
                Cresça na Fé com Nossa Plataforma de Estudos
              </h2>
              <p className="home-plataforma__description">
                Junte-se à nossa comunidade e tenha acesso exclusivo a módulos
                interativos, quizzes desafiadores e um sistema de pontuação que
                torna o aprendizado bíblico envolvente e gratificante.
              </p>

              <div className="home-plataforma__features">
                <div className="home-plataforma__feature">
                  <div className="home-plataforma__feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <h3 className="home-plataforma__feature-title">
                    Módulos de Estudo
                  </h3>
                  <p className="home-plataforma__feature-text">
                    Conteúdo estruturado para aprofundar seu conhecimento
                    bíblico
                  </p>
                </div>

                <div className="home-plataforma__feature">
                  <div className="home-plataforma__feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <h3 className="home-plataforma__feature-title">
                    Quizzes Interativos
                  </h3>
                  <p className="home-plataforma__feature-text">
                    Teste seus conhecimentos com questões desafiadoras
                  </p>
                </div>

                <div className="home-plataforma__feature">
                  <div className="home-plataforma__feature-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                  </div>
                  <h3 className="home-plataforma__feature-title">
                    Ranking & Pontos
                  </h3>
                  <p className="home-plataforma__feature-text">
                    Acompanhe seu progresso e veja sua evolução
                  </p>
                </div>
              </div>

              <button
                className="home-plataforma__cta"
                onClick={() =>
                  window.open(
                    "https://docs.google.com/forms/d/e/1FAIpQLSfk4IIu8u5k6bHX0q3QmtAHnNiEYciE8Zm000_jowTllXIhUQ/viewform",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                aria-label="Fazer Login na Plataforma"
              >
                Faça Parte da Nossa Comunidade
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
