import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import Carousel from "../components/Carousel";
import "../style/HomePage.css";
import { getEventosAtivos } from "../services/eventoService";

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
  const location = useLocation();
  const [eventos, setEventos] = useState<any[]>([]);

  useEffect(() => {
    fetchEventos();
  }, []);

  useEffect(() => {
    if (location.hash === "#campanha-nova-sede") {
      const el = document.getElementById("campanha-nova-sede");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const fetchEventos = async () => {
    try {
      const data = await getEventosAtivos();
      setEventos(data);
    } catch {
      setEventos([]);
    }
  };

  return (
    <div className="home-page">
      <HeaderHome />

      <main id="main-content" className="home-content" tabIndex={-1}>
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
              <span className="home-culto-card__dia">Quarta-feira</span>
              <span className="home-culto-card__hora">20h</span>
              <span className="home-culto-card__tipo">Escola de Discípulos</span>
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

        {/* Participe - Escola de Discípulos / Células */}
        <section className="home-participe">
          <p className="home-participe__label">— Nossos ministérios</p>
          <h2 className="home-participe__titulo">
            Participe e encontre seu lugar
          </h2>
          <p className="home-participe__texto">
            A Escola de Discípulos e as Células são pilares da nossa comunhão.
            Encontre o seu lugar e cresça conosco.
          </p>

          <div className="home-ministerios-grid">
            <article className="home-ministerio-card">
              <div className="home-ministerio-card__img-wrap">
                <img
                  src={imagemDiscipulado}
                  alt="Escola de Discípulos"
                  className="home-ministerio-card__img"
                  loading="lazy"
                />
              </div>
              <div className="home-ministerio-card__body">
                <h3 className="home-ministerio-card__titulo">Escola de Discípulos</h3>
                <p className="home-ministerio-card__texto">
                  Aprenda a seguir os passos de Cristo, aprofundando sua fé e
                  crescendo espiritualmente em comunhão com outros irmãos.
                </p>
              </div>
            </article>

            <article className="home-ministerio-card">
              <div className="home-ministerio-card__img-wrap">
                <img
                  src={imagemCelulas}
                  alt="Células de Comunhão"
                  className="home-ministerio-card__img"
                  loading="lazy"
                />
              </div>
              <div className="home-ministerio-card__body">
                <h3 className="home-ministerio-card__titulo">Células</h3>
                <p className="home-ministerio-card__texto">
                  Pequenos grupos que se reúnem para compartilhar a vida,
                  estudar a Palavra e fortalecer os laços de amor e comunhão na
                  família de Deus.
                </p>
                <button
                  className="home-ministerio-card__cta"
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
          <div className="home-plataforma__card">
            <p className="home-plataforma__label">— Aprendizado bíblico</p>
            <h2 className="home-plataforma__titulo">
              Cresça na Fé com Nossa Plataforma
            </h2>
            <p className="home-plataforma__texto">
              Módulos interativos, quizzes desafiadores e um sistema de pontuação que
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

        {/* Campanha Nova Sede */}
        <section id="campanha-nova-sede" className="home-campanha">
          <div className="home-campanha__wrap">
            <p className="home-campanha__label">— Campanha Nova Sede!</p>
            <h2 className="home-campanha__titulo">
              <span className="home-campanha__titulo-light">Aqui é a </span>
              <span className="home-campanha__titulo-bold">nossa Casa.</span>
            </h2>
            <p className="home-campanha__tagline">
              O novo espaço começa no nosso coração e se manifesta nas nossas atitudes.
            </p>
            <button
              type="button"
              className="home-campanha__expand"
              onClick={() => document.getElementById("home-campanha-detalhes")?.scrollIntoView({ behavior: "smooth" })}
              aria-label="Ver detalhes da campanha"
            >
              Leia a Legenda
            </button>
          </div>

          <div id="home-campanha-detalhes" className="home-campanha__detalhes">
            <div className="home-campanha__detalhes-wrap">
              <h3 className="home-campanha__detalhes-titulo">Quer contribuir com a Casa?</h3>
              <p className="home-campanha__detalhes-sub">Faça parte deste novo tempo</p>
              <p className="home-campanha__detalhes-texto">
                Iniciamos a campanha de ofertas para a conquista do nosso novo espaço, um lugar para acolher vidas e viver tudo o que Deus ainda fará entre nós.
              </p>
              <p className="home-campanha__detalhes-texto home-campanha__detalhes-cta">
                Participe desse passo de fé! Contribua mensalmente e semeie nesse propósito.
              </p>

              <div className="home-campanha__pix-area">
                <div className="home-campanha__pix-box">
                  <p className="home-campanha__pix-label">Chave PIX</p>
                  <p className="home-campanha__pix-chave">34.455.752/0001-69</p>
                  <div className="home-campanha__qr-wrap" aria-hidden="true">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("34.455.752/0001-69")}`}
                      alt="QR Code PIX - Chave 34.455.752/0001-69"
                      className="home-campanha__qr-img"
                      width={180}
                      height={180}
                    />
                  </div>
                  <p className="home-campanha__qr-hint">Escaneie o QR CODE</p>
                </div>

                <div className="home-campanha__conta">
                  <p className="home-campanha__conta-titulo">Conta Corrente</p>
                  <p className="home-campanha__conta-item"><strong>Banco:</strong> Stone (197)</p>
                  <p className="home-campanha__conta-item"><strong>Agência:</strong> 0001</p>
                  <p className="home-campanha__conta-item"><strong>Conta Corrente:</strong> 574293-7</p>
                  <p className="home-campanha__conta-item"><strong>CNPJ:</strong> 34.455.752/0001-69</p>
                  <p className="home-campanha__conta-item home-campanha__conta-razao">Comunidade Cristã Casa dos Discípulos</p>
                </div>
              </div>

              <p className="home-campanha__footer-text">
                Aqui é a nossa casa e juntos estamos construindo algo eterno!
              </p>
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
