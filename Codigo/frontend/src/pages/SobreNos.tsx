import React from "react";
import { Link } from "react-router-dom";
import HeaderHome from "../components/layout/HeaderHome";
import Footer from "../components/layout/Footer";
import CartaoPix from "../components/layout/CartaoPix";
import "../style/homeModerna.css";

import logoCasa from "../assets/logo_casa.png";
import imagemHero from "../assets/equipe_casa.jpg";
import imagemMissao from "../assets/casal_leitura.jpeg";
import imagemVisao from "../assets/tres_mulheres.jpeg";
import imagemProgramacao from "../assets/DSC00719.jpg";
import imagemCelulas from "../assets/celulas/hero-celulas.jpg";

const INSTAGRAM_REEL = "https://www.instagram.com/reel/DPJpTVdESov/";
const INSTAGRAM = "https://www.instagram.com/casadosdiscipulos/";

/** Os cinco pilares citados na missão da Casa. */
const PILARES = ["Comunhão", "Celebração", "Discipulado", "Serviço", "Testemunho"];

/**
 * A Casa (/sobre-nos) — mesma linguagem da página inicial: painéis arredondados sobre fundo preto,
 * títulos condensados em creme com destaque em dourado champanhe e etiquetas nos cantos.
 */
const SobreNos: React.FC = () => (
  <div className="hm">
    <HeaderHome />

    <main id="main-content" tabIndex={-1} className="hm-paineis">
      {/* ---------- Abertura ---------- */}
      <section className="hm-painel hm-painel--hero hm-painel--hero-curto" aria-labelledby="sn-titulo">
        <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemHero})` }} aria-hidden />
        <div className="hm-painel__veu hm-painel__veu--forte" aria-hidden />
        <p className="hm-cantos" aria-hidden>
          <span>Missão e visão</span>
          <span>Belo Horizonte</span>
        </p>
        <div className="hm-painel__conteudo">
          <p className="hm-pre">Casa dos Discípulos</p>
          <h1 id="sn-titulo" className="hm-display hm-display--gigante">
            Conheça <em>a Casa.</em>
          </h1>
          <p className="hm-frase">Uma comunidade que compartilha o amor de Cristo.</p>
        </div>
      </section>

      {/* ---------- Nossa história ---------- */}
      <section className="hm-painel hm-painel--programacao" aria-labelledby="sn-historia">
        <p className="hm-cantos" aria-hidden>
          <span>Nossa história</span>
          <span>Assista</span>
        </p>
        <div className="hm-painel__conteudo">
          <h2 id="sn-historia" className="hm-display">Uma história de <em>fé e família</em></h2>
          <p className="hm-frase hm-frase--suave">
            Assista ao vídeo que conta a trajetória da Casa dos Discípulos e acompanhe o dia a dia da igreja
            no nosso Instagram.
          </p>
          <div className="hm-acoes">
            <a href={INSTAGRAM_REEL} target="_blank" rel="noopener noreferrer" className="hm-pilula hm-pilula--ouro">
              Assistir ao vídeo <span className="sr-only">no Instagram (abre em nova aba)</span>
            </a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hm-pilula">
              @casadosdiscipulos <span className="sr-only">no Instagram (abre em nova aba)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Missão e Visão ---------- */}
      <div className="hm-duplo">
        <section className="hm-painel hm-painel--metade" aria-labelledby="sn-missao">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemMissao})` }} aria-hidden />
          <div className="hm-painel__veu hm-painel__veu--forte" aria-hidden />
          <p className="hm-cantos" aria-hidden><span>Por que existimos</span><span>01</span></p>
          <div className="hm-painel__conteudo">
            <h2 id="sn-missao" className="hm-display hm-display--medio">Nossa <em>missão</em></h2>
            <p className="hm-frase">
              Compartilhar do amor de Deus em Cristo e glorificá-Lo com uma vida de comunhão, celebração,
              discipulado, serviço e testemunho no poder do Espírito Santo.
            </p>
          </div>
        </section>

        <section className="hm-painel hm-painel--metade" aria-labelledby="sn-visao">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemVisao})` }} aria-hidden />
          <div className="hm-painel__veu hm-painel__veu--forte" aria-hidden />
          <p className="hm-cantos" aria-hidden><span>Quem queremos ser</span><span>02</span></p>
          <div className="hm-painel__conteudo">
            <h2 id="sn-visao" className="hm-display hm-display--medio">Nossa <em>visão</em></h2>
            <p className="hm-frase">
              A Casa dos Discípulos é uma igreja acolhedora que compartilha o evangelho do Reino com
              simplicidade, integridade e amor.
            </p>
          </div>
        </section>
      </div>

      {/* ---------- Pilares ---------- */}
      <section className="hm-painel hm-painel--eventos" aria-labelledby="sn-pilares">
        <p className="hm-cantos" aria-hidden><span>Na Casa dos Discípulos</span><span>Todos os dias</span></p>
        <div className="hm-painel__conteudo">
          <h2 id="sn-pilares" className="hm-display">Como <em>vivemos</em></h2>
          <p className="hm-frase hm-frase--suave">Cinco marcas que guiam a nossa caminhada juntos.</p>
          <ol className="hm-pilares">
            {PILARES.map((p, i) => (
              <li key={p}>
                <span className="hm-pilares__numero" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <span className="hm-pilares__nome">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Dízimos e ofertas ---------- */}
      <section className="hm-painel hm-painel--campanha" aria-labelledby="sn-ofertas">
        <p className="hm-cantos" aria-hidden><span>Contribua</span><span>Dízimos e ofertas</span></p>
        <div className="hm-campanha">
          <div className="hm-campanha__texto">
            <h2 id="sn-ofertas" className="hm-display hm-display--escuro">
              Semeie na obra <em>da Casa.</em>
            </h2>
            <p>
              Seus dízimos e ofertas sustentam o cuidado com as pessoas, as células, a Escola de Discípulos e
              a campanha da nova sede.
            </p>
            <p className="hm-campanha__convite">Contribua pelo PIX ou por transferência bancária.</p>
          </div>
          <CartaoPix />
        </div>
      </section>

      {/* ---------- Próximos passos ---------- */}
      <div className="hm-duplo">
        <section className="hm-painel hm-painel--metade" aria-labelledby="sn-programacao">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemProgramacao})` }} aria-hidden />
          <div className="hm-painel__veu" aria-hidden />
          <p className="hm-cantos" aria-hidden><span>Venha nos visitar</span><span>Domingo · 18h30</span></p>
          <div className="hm-painel__conteudo">
            <h2 id="sn-programacao" className="hm-display hm-display--medio">Acompanhe nossa <em>programação</em></h2>
            <p className="hm-frase hm-frase--suave">Cultos, células, Escola de Discípulos e Sala de Oração.</p>
            <Link to="/#programacao" className="hm-pilula">Ver dias e horários</Link>
          </div>
        </section>

        <section className="hm-painel hm-painel--metade" aria-labelledby="sn-celulas">
          <div className="hm-painel__foto" style={{ backgroundImage: `url(${imagemCelulas})` }} aria-hidden />
          <div className="hm-painel__veu" aria-hidden />
          <p className="hm-cantos" aria-hidden><span>Células</span><span>Terça · 20h</span></p>
          <div className="hm-painel__conteudo">
            <h2 id="sn-celulas" className="hm-display hm-display--medio">Comunhão <em>perto de você</em></h2>
            <p className="hm-frase hm-frase--suave">Encontre uma célula perto da sua casa.</p>
            <Link to="/celulas" className="hm-pilula">Encontre sua célula</Link>
          </div>
        </section>
      </div>

      {/* ---------- Assinatura ---------- */}
      <section className="hm-assinatura" aria-labelledby="sn-assinatura">
        <img src={logoCasa} alt="" className="hm-assinatura__logo" loading="lazy" />
        <h2 id="sn-assinatura" className="sr-only">Casa dos Discípulos</h2>
        <p>Aqui é a nossa Casa e juntos estamos construindo algo eterno.</p>
        <Link to="/" className="hm-pilula hm-pilula--pequena">Voltar para o início</Link>
      </section>
    </main>

    <Footer />
  </div>
);

export default SobreNos;
