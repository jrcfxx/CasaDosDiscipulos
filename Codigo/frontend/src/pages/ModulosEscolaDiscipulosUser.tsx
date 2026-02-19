import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/ModulosEscolaDiscipulosUser.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import moduloService from "../services/moduloService";

type ModuloComProgresso = {
  id_modulo: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  status?: "nao_iniciado" | "em_andamento" | "concluido";
  nota_quiz?: number | null;
  data_conclusao?: string | null;
};

type RankItem = {
  id_usuario: number;
  nome: string;
  pontuacao: number;
  foto?: string;
};

const ModulosEscolaDiscipulosUser: React.FC = () => {
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<ModuloComProgresso[]>([]);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulosData, rankingData] = await Promise.all([
        moduloService.getActiveWithProgress(),
        moduloService.getRanking(10),
      ]);
      setModulos(modulosData);
      setRanking(rankingData);
      if (modulosData.length > 0 && !aberto) {
        setAberto(modulosData[0].id_modulo);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const isModuloDisponivel = (index: number): boolean => {
    for (let i = 0; i < index; i++) {
      if (modulos[i].status !== "concluido") return false;
    }
    return true;
  };

  const getIniciais = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="page">
      <Header />

      <main className="modulos-wrap">
        <h1 className="page-title">ESCOLA DE DISCÍPULOS</h1>

        {loading ? (
          <p className="loading-message">Carregando...</p>
        ) : (
          <section className="modulos-grid" aria-label="Conteúdo">
            <div className="col-esq">
              {modulos.map((m, index) => {
                const isOpen = aberto === m.id_modulo;
                const disponivel = isModuloDisponivel(index);
                const concluido = m.status === "concluido";

                return (
                  <article
                    key={m.id_modulo}
                    className={`mod-card ${isOpen ? "open" : ""} ${!disponivel ? "locked" : ""} ${concluido ? "concluido" : ""}`}
                  >
                    <button
                      className="mod-head"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setAberto(isOpen ? null : m.id_modulo)
                      }
                      disabled={!disponivel}
                    >
                      {m.titulo}
                      {concluido && <span className="mod-badge">✓</span>}
                      {!disponivel && <span className="mod-badge">🔒</span>}
                      <span className="chevron" aria-hidden>
                        ▾
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mod-body">
                        {m.descricao && (
                          <p className="mod-desc">{m.descricao}</p>
                        )}
                        {concluido && m.nota_quiz != null && (
                          <p className="mod-nota">Nota: {m.nota_quiz}</p>
                        )}
                        <button
                          className="btn-prim"
                          type="button"
                          onClick={() =>
                            navigate(`/usuario/modulos/preencher/${m.id_modulo}`)
                          }
                          disabled={!disponivel}
                        >
                          {concluido ? "Ver módulo" : "Realizar módulo"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <aside className="col-dir" aria-label="Ranking">
              <div className="panel">
                <h2 className="panel-title">RANKING</h2>
                <ul className="ranking-list">
                  {ranking.map((item, idx) => (
                    <li key={item.id_usuario} className="rank-item">
                      <div className="avatar" aria-hidden="true">
                        {item.foto ? (
                          <img src={item.foto} alt="" />
                        ) : (
                          getIniciais(item.nome)
                        )}
                      </div>
                      <div className="rank-info">
                        <strong>{item.nome}</strong>
                        <span>{item.pontuacao} pontos</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ModulosEscolaDiscipulosUser;
