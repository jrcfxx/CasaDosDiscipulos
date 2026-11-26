import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import Carousel, { type CarouselItem } from "../components/Carousel";
import Icone from "../components/ui/Icone";
import "../style/homeModerna.css";
import { getEventosAtivos } from "../services/eventoService";

import logoCasa from "../assets/logo_casa.png";
import imagemHero from "../assets/casal.jpg";
import imagemDiscipulado from "../assets/lendo_biblia.jpg";
import imagemCelulas from "../assets/celulas/hero-celulas.jpg";
import imagemEquipe from "../assets/equipe_casa.jpg";
import imagemPortal from "../assets/DSC00436.jpg";

const ENDERECO = "Rua Albertino Teixeira Dias, 381 – Teixeira Dias – Belo Horizonte, Minas Gerais";
const MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Rua Albertino Teixeira Dias, 381, Belo Horizonte, Minas Gerais")}`;
const INSTAGRAM = "https://www.instagram.com/casadosdiscipulos/";
const CHAVE_PIX = "34.455.752/0001-69";
const FORMULARIO_ESCOLA =
  "https://docs.google.com/forms/d/e/1FAIpQLSfk4IIu8u5k6bHX0q3QmtAHnNiEYciE8Zm000_jowTllXIhUQ/viewform";

const PROGRAMACAO = [
  { dia: "Domingo", hora: "18h30", atividade: "Culto de celebração" },
  { dia: "Terça-feira", hora: "20h", atividade: "Células" },
  { dia: "Quarta-feira", hora: "20h", atividade: "Escola de Discípulos" },
  { dia: "Sexta-feira", hora: "20h", atividade: "Sala de Oração" },
];

/**
 * Página inicial pública. Painéis grandes sobre fundo preto (estrutura inspirada no site da Central),
 * com a linguagem dos posts da Casa: títulos condensados em creme e âmbar e etiquetas nos cantos.
 */
const HomePage: React.FC = () => {
  const location = useLocation();
  const [eventos, setEventos] = useState<CarouselItem[]>([]);
  const [pixCopiado, setPixCopiado] = useState(false);

  useEffect(() => {
    getEventosAtivos().then((d) => setEventos(Array.isArray(d) ? d : [])).catch(() => setEventos([]));
  }, []);

  useEffect(() => {
    if (location.hash === "#campanha-nova-sede" || location.hash === "#programacao") {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
      setPixCopiado(true);
      window.setTimeout(() => setPixCopiado(false), 2500);
    } catch {
      /* sem permissão: a chave continua visível para copiar à mão */
    }
  };

  return (
    <div className="hm">
      <HeaderHome />

      <main id="main-content" tabIndex={-1} className="hm-paineis">
        {/* ---------- Abertura ---------- */}
        <section className="hm-painel hm-painel--hero" aria-labelledby="hm-titulo">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemHero})` }} aria-hidden />
          <div className="hm-painel__veu hm-painel__veu--forte" aria-hidden />
          <p className="hm-cantos" aria-hidden>
            <span>Comunidade Cristã</span>
            <span>Belo Horizonte</span>
          </p>
          <div className="hm-painel__conteudo">
            <p className="hm-pre">Casa dos Discípulos</p>
            <h1 id="hm-titulo" className="hm-display hm-display--gigante">
              Aqui é a <em>nossa Casa.</em>
            </h1>
            <p className="hm-frase">Juntos estamos construindo algo eterno.</p>
            <div className="hm-acoes">
              <Link to="/sobre-nos" className="hm-pilula hm-pilula--ouro">Conheça a Casa</Link>
              <a href="#programacao" className="hm-pilula">Acompanhe nossa programação</a>
            </div>
          </div>
        </section>

        {/* ---------- Programação ---------- */}
        <section id="programacao" className="hm-painel hm-painel--programacao" aria-labelledby="hm-programacao">
          <p className="hm-cantos" aria-hidden>
            <span>Na Casa dos Discípulos</span>
            <span>Toda semana</span>
          </p>
          <div className="hm-painel__conteudo">
            <h2 id="hm-programacao" className="hm-display">Acompanhe nossa <em>programação</em></h2>
            <p className="hm-frase hm-frase--suave">
              Cada oportunidade de estar em comunhão com a igreja de Cristo é única e especial.
              Confira os dias e horários e programe-se para estar conosco.
            </p>
            <ul className="hm-agenda">
              {PROGRAMACAO.map((p) => (
                <li key={p.dia}>
                  <span className="hm-agenda__dia">{p.dia}</span>
                  <span className="hm-agenda__hora">{p.hora}</span>
                  <span className="hm-agenda__atividade">{p.atividade}</span>
                </li>
              ))}
            </ul>
            <p className="hm-endereco">
              <Icone nome="mapa" tamanho={18} />
              <span>{ENDERECO}</span>
            </p>
            <a href={MAPA} target="_blank" rel="noopener noreferrer" className="hm-pilula">
              Como chegar <span className="sr-only">(abre o mapa em nova aba)</span>
            </a>
          </div>
        </section>

        {/* ---------- Células e Escola ---------- */}
        <div className="hm-duplo">
          <section className="hm-painel hm-painel--metade" aria-labelledby="hm-celulas">
            <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemCelulas})` }} aria-hidden />
            <div className="hm-painel__veu" aria-hidden />
            <p className="hm-cantos" aria-hidden><span>Células</span><span>Terça · 20h</span></p>
            <div className="hm-painel__conteudo">
              <h2 id="hm-celulas" className="hm-display hm-display--medio">Comunhão <em>perto de você</em></h2>
              <p className="hm-frase hm-frase--suave">
                Pequenos grupos que se reúnem nas casas para compartilhar a vida, estudar a Palavra e
                fortalecer os laços de amor na família de Deus.
              </p>
              <Link to="/celulas" className="hm-pilula">Encontre sua célula</Link>
            </div>
          </section>

          <section className="hm-painel hm-painel--metade" aria-labelledby="hm-escola">
            <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemDiscipulado})` }} aria-hidden />
            <div className="hm-painel__veu" aria-hidden />
            <p className="hm-cantos" aria-hidden><span>Aprendizado bíblico</span><span>Quarta · 20h</span></p>
            <div className="hm-painel__conteudo">
              <h2 id="hm-escola" className="hm-display hm-display--medio">Escola de <em>Discípulos</em></h2>
              <p className="hm-frase hm-frase--suave">
                Um caminho de formação para seguir os passos de Cristo, com módulos interativos, quizzes
                e pontuação que acompanha o seu progresso.
              </p>
              <a href={FORMULARIO_ESCOLA} target="_blank" rel="noopener noreferrer" className="hm-pilula">
                Faça parte <span className="sr-only">da Escola de Discípulos (abre em nova aba)</span>
              </a>
            </div>
          </section>
        </div>

        {/* ---------- Campanha Nova Sede ---------- */}
        <section id="campanha-nova-sede" className="hm-painel hm-painel--campanha" aria-labelledby="hm-campanha">
          <p className="hm-cantos" aria-hidden><span>Campanha</span><span>Nova Sede</span></p>
          <div className="hm-campanha">
            <div className="hm-campanha__texto">
              <h2 id="hm-campanha" className="hm-display hm-display--escuro">
                O novo espaço começa no <em>nosso coração.</em>
              </h2>
              <p>
                Iniciamos a campanha de ofertas para a conquista do nosso novo espaço, um lugar para acolher
                vidas e viver tudo o que Deus ainda fará entre nós.
              </p>
              <p className="hm-campanha__convite">
                Participe desse passo de fé! Contribua mensalmente e semeie nesse propósito.
              </p>
            </div>

            <div className="hm-oferta" aria-label="Como contribuir">
              <div className="hm-oferta__pix">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&data=${encodeURIComponent(CHAVE_PIX)}`}
                  alt={`QR Code do PIX, chave ${CHAVE_PIX}`}
                  className="hm-oferta__qr"
                  width={140}
                  height={140}
                />
                <div className="hm-oferta__chave">
                  <span className="hm-oferta__rotulo">Chave PIX (CNPJ)</span>
                  <strong>{CHAVE_PIX}</strong>
                  <button type="button" className="hm-pilula hm-pilula--pequena" onClick={copiarPix}>
                    {pixCopiado ? "Chave copiada" : "Copiar chave"}
                  </button>
                  <span className="sr-only" role="status" aria-live="polite">{pixCopiado ? "Chave PIX copiada" : ""}</span>
                </div>
              </div>
              <dl className="hm-oferta__conta">
                <div><dt>Banco</dt><dd>Stone (197)</dd></div>
                <div><dt>Agência</dt><dd>0001</dd></div>
                <div><dt>Conta corrente</dt><dd>574293-7</dd></div>
                <div><dt>CNPJ</dt><dd>{CHAVE_PIX}</dd></div>
                <div className="hm-oferta__inteiro"><dt>Favorecido</dt><dd>Comunidade Cristã Casa dos Discípulos</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* ---------- Próximos eventos ---------- */}
        {eventos.length > 0 && (
          <section className="hm-painel hm-painel--eventos" aria-labelledby="hm-eventos">
            <p className="hm-cantos" aria-hidden><span>Agenda</span><span>Marca na agenda</span></p>
            <div className="hm-painel__conteudo">
              <h2 id="hm-eventos" className="hm-display">Próximos <em>eventos</em></h2>
              <div className="hm-eventos">
                <Carousel items={eventos} autoPlayInterval={6000} />
              </div>
            </div>
          </section>
        )}

        {/* ---------- A Casa e o Portal ---------- */}
        <div className="hm-duplo">
          <section className="hm-painel hm-painel--metade" aria-labelledby="hm-conheca">
            <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemEquipe})` }} aria-hidden />
            <div className="hm-painel__veu" aria-hidden />
            <p className="hm-cantos" aria-hidden><span>Missão e visão</span><span>A Casa</span></p>
            <div className="hm-painel__conteudo">
              <h2 id="hm-conheca" className="hm-display hm-display--medio">Conheça a <em>Casa</em></h2>
              <p className="hm-frase hm-frase--suave">Nossa história, nossa missão e as pessoas que caminham com a gente.</p>
              <Link to="/sobre-nos" className="hm-pilula">Saiba mais</Link>
            </div>
          </section>

          <section className="hm-painel hm-painel--metade" aria-labelledby="hm-portal">
            <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemPortal})` }} aria-hidden />
            <div className="hm-painel__veu" aria-hidden />
            <p className="hm-cantos" aria-hidden><span>Para membros</span><span>Portal</span></p>
            <div className="hm-painel__conteudo">
              <h2 id="hm-portal" className="hm-display hm-display--medio">Portal do <em>Discípulo</em></h2>
              <p className="hm-frase hm-frase--suave">Sua escala, a Escola de Discípulos e a sua célula, tudo no celular.</p>
              <Link to="/login" className="hm-pilula">Entrar no Portal</Link>
            </div>
          </section>
        </div>

        {/* ---------- Assinatura ---------- */}
        <section className="hm-assinatura" aria-labelledby="hm-assinatura">
          <img src={logoCasa} alt="" className="hm-assinatura__logo" loading="lazy" />
          <h2 id="hm-assinatura" className="sr-only">Casa dos Discípulos</h2>
          <p>Aqui é a nossa Casa e juntos estamos construindo algo eterno.</p>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hm-pilula hm-pilula--pequena">
            @casadosdiscipulos <span className="sr-only">no Instagram (abre em nova aba)</span>
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
