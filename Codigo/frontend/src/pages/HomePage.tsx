import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import Carousel from "../components/Carousel";
import "../style/HomePage.css";
import axios from "axios";
import { API_BASE } from "../config/api";

import logoCasa from "../assets/logo_casa.png";
import imagemHero from "../assets/casal.jpg";
import imagemDiscipulado from "../assets/lendo_biblia.jpg";
import imagemCelulas from "../assets/celulas.jpg";

/**
 * HomePage Component
 * Estrutura inspirada em central.online - clean, moderno
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/evento/ativos`);
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  return (
    <div className="home-page">
      <HeaderHome />

      <main className="home-content">
        {/* Hero - tipografia forte */}
        <section className="home-hero">
          <div
            className="home-hero__bg"
            style={{ backgroundImage: `url(${imagemHero})` }}
          />
          <div className="home-hero__overlay" />
          <div className="home-hero__content">
            <p className="home-hero__sub">— Comunidade Cristã</p>
            <h1 className="home-hero__title">
              Aqui é a nossa Casa.
            </h1>
            <p className="home-hero__tagline">
              Juntos estamos construindo algo eterno.
            </p>
            <button
              className="home-hero__cta"
              onClick={() => navigate("/sobre-nos")}
              aria-label="Conhecer a Casa dos Discípulos"
            >
              Conheça a Casa
            </button>
          </div>
        </section>

        {/* Participe dos cultos - estilo Central */}
        <section className="home-cultos">
          <h2 className="home-cultos__titulo">Participe dos nossos cultos</h2>
          <p className="home-cultos__texto">
            Cada oportunidade de estar em comunhão com a igreja de Cristo é única e especial.
            Confira a nossa agenda e programe-se para estar conosco.
          </p>
          <div className="home-cultos__grid">
            <div className="home-culto-card">
              <span className="home-culto-card__dia">Domingo</span>
              <span className="home-culto-card__hora">18h30</span>
              <span className="home-culto-card__tipo">Culto</span>
            </div>
            <div className="home-culto-card">
              <span className="home-culto-card__dia">Terça-feira</span>
              <span className="home-culto-card__hora">20h</span>
              <span className="home-culto-card__tipo">Células</span>
            </div>
            <div className="home-culto-card">
              <span className="home-culto-card__dia">Sexta-feira</span>
              <span className="home-culto-card__hora">20h</span>
              <span className="home-culto-card__tipo">Vigília</span>
            </div>
          </div>
          <p className="home-cultos__endereco">
            Rua Albertino Teixeira Dias, 381 – Tx. Dias – Belo Horizonte/MG
          </p>
        </section>

        {/* Participe - Discipulado / Células */}
        <section className="home-participe">
          <h2 className="home-participe__titulo">
            Participe dos nossos ministérios
          </h2>
          <p className="home-participe__texto">
            Cada oportunidade de estar em comunhão com a igreja de Cristo é
            única e especial. Confira nossas áreas e encontre seu lugar.
          </p>

          <div className="home-cards">
            <article className="home-card">
              <div className="home-card__img-wrap">
                <img
                  src={imagemDiscipulado}
                  alt="Escola de Discípulos"
                  className="home-card__img"
                  loading="lazy"
                />
              </div>
              <div className="home-card__body">
                <h3 className="home-card__titulo">Discipulado</h3>
                <p className="home-card__texto">
                  Na Escola de Discípulos, você aprende a seguir os passos de
                  Cristo, aprofundando sua fé e crescendo espiritualmente em
                  comunhão com outros irmãos.
                </p>
              </div>
            </article>

            <article className="home-card">
              <div className="home-card__img-wrap">
                <img
                  src={imagemCelulas}
                  alt="Células de Comunhão"
                  className="home-card__img"
                  loading="lazy"
                />
              </div>
              <div className="home-card__body">
                <h3 className="home-card__titulo">Células</h3>
                <p className="home-card__texto">
                  Pequenos grupos que se reúnem para compartilhar a vida,
                  estudar a Palavra e fortalecer os laços de amor e comunhão na
                  família de Deus.
                </p>
                <button
                  className="home-card__cta"
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
            </article>
          </div>
        </section>

        {/* Plataforma de Estudos */}
        <section className="home-plataforma">
          <div className="home-plataforma__wrap">
            <h2 className="home-plataforma__titulo">
              Cresça na Fé com Nossa Plataforma de Estudos
            </h2>
            <p className="home-plataforma__texto">
              Junte-se à nossa comunidade e tenha acesso exclusivo a módulos
              interativos, quizzes desafiadores e um sistema de pontuação que
              torna o aprendizado bíblico envolvente e gratificante.
            </p>
            <button
              className="home-plataforma__cta"
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSfk4IIu8u5k6bHX0q3QmtAHnNiEYciE8Zm000_jowTllXIhUQ/viewform",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              aria-label="Fazer parte da comunidade"
            >
              Faça Parte da Nossa Comunidade
            </button>
          </div>
        </section>

        {/* Contribua - Campanha Nova Sede */}
        <section id="contribua" className="home-contribua">
          <div className="home-contribua__wrap">
            <p className="home-contribua__label">— Campanha Nova Sede</p>
            <h2 className="home-contribua__titulo">Quer contribuir com a Casa?</h2>
            <p className="home-contribua__subtitulo">Faça parte deste novo tempo</p>
            <p className="home-contribua__texto">
              Iniciamos a campanha de ofertas para a conquista do nosso novo espaço, um lugar para acolher vidas e viver tudo o que Deus ainda fará entre nós. Participe desse passo de fé!
            </p>
            <div className="home-contribua__pix">
              <p className="home-contribua__pix-label">Chave PIX</p>
              <p className="home-contribua__pix-chave">34.455.752/0001-69</p>
              <p className="home-contribua__pix-sub">Conta Corrente · Stone (197) · Ag. 0001 · CC 574293-7</p>
            </div>
          </div>
        </section>

        {/* Eventos */}
        <section className="home-eventos" aria-label="Próximos eventos">
          <Carousel items={eventos} autoPlayInterval={5000} />
        </section>

        {/* Logo rodapé da home */}
        <section className="home-logo-rodape">
          <img
            src={logoCasa}
            alt="Casa dos Discípulos"
            className="home-logo-rodape__img"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
