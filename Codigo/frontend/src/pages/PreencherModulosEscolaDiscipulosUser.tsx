import React, { useState } from "react";
import "../style/PreencherModulosEscolaDiscipulosUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PreencherModulosEscolaDiscipulosUser: React.FC = () => {
  const [resposta, setResposta] = useState<string>("");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resposta) return alert("Escolha uma alternativa antes de enviar.");
    alert(`Resposta enviada: ${resposta}`);
  };

  return (
    <div className="modulo-user">
      <Header />

      {/* CONTEÚDO */}
      <main className="modulo-content">
        <h1 className="modulo-title">NOME DO MÓDULO</h1>

        <section className="modulo-card" aria-label="Conteúdo do módulo">
          <p className="modulo-desc">
            texto texto texto texto texto texto texto texto texto texto texto
            texto texto texto texto texto texto texto texto texto texto texto
            texto texto texto texto texto texto texto texto texto texto texto
            texto texto texto texto texto texto texto texto texto texto texto
            texto texto texto texto texto texto texto.
          </p>

          {/* SOMENTE SIMULAÇÃO */}
          <div className="video-wrap" aria-label="Vídeo do módulo">
            <div className="video-thumb">
              <button
                className="play-btn"
                aria-label="Reproduzir vídeo"
                onClick={() => alert("Simulação de player")}
              >
                <span className="play-triangle" />
              </button>
            </div>
          </div>

          {/* Quiz */}
          <form className="quiz" onSubmit={enviar} aria-labelledby="quizTitle">
            <h2 id="quizTitle">quiz X</h2>
            <p className="quiz-pergunta">questão 1</p>
            <p className="quiz-enunciado">
              texto texto texto texto texto texto texto texto texto:
            </p>

            <fieldset className="quiz-opcoes">
              <label className="opcao">
                <input
                  type="radio"
                  name="resp"
                  value="a"
                  checked={resposta === "a"}
                  onChange={(e) => setResposta(e.target.value)}
                />
                <span className="bolinha" aria-hidden="true" />
                <span>a) texto</span>
              </label>

              <label className="opcao">
                <input
                  type="radio"
                  name="resp"
                  value="b"
                  checked={resposta === "b"}
                  onChange={(e) => setResposta(e.target.value)}
                />
                <span className="bolinha" aria-hidden="true" />
                <span>b) texto</span>
              </label>

              <label className="opcao">
                <input
                  type="radio"
                  name="resp"
                  value="c"
                  checked={resposta === "c"}
                  onChange={(e) => setResposta(e.target.value)}
                />
                <span className="bolinha" aria-hidden="true" />
                <span>c) texto</span>
              </label>
            </fieldset>

            <button className="btn-enviar" type="submit">
              Enviar resposta
            </button>
          </form>
        </section>
      </main>

      {/* RODAPÉ */}
      <Footer />
    </div>
  );
};

export default PreencherModulosEscolaDiscipulosUser;
