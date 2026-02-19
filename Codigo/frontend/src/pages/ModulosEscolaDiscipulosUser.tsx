import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/ModulosEscolaDiscipulosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import RankingCard, { type RankItem, type MinhaPosicao } from "../components/modulos/RankingCard";
import { formatarConteudoCampo } from "../utils/moduloConteudoUtils";
import moduloService from "../services/moduloService";

type ModuloComProgresso = {
  id_modulo: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  obrigatorio?: boolean;
  id_nivel?: number | null;
  nivel_nome?: string | null;
  pre_requisitos?: number[];
  campos?: Array<{ label?: string; tipo_campo?: string; conteudo?: unknown }>;
  status?: "nao_iniciado" | "em_andamento" | "concluido";
  nota_quiz?: number | null;
  data_conclusao?: string | null;
};

const ModulosEscolaDiscipulosUser: React.FC = () => {
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<ModuloComProgresso[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<ModuloComProgresso | null>(null);
  const [quizVinculado, setQuizVinculado] = useState<{ id_quiz: number; titulo?: string } | null>(null);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [minhaPosicao, setMinhaPosicao] = useState<MinhaPosicao | null>(null);
  const [nivelEscola, setNivelEscola] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progressData, rankingData, posicaoData] = await Promise.all([
        moduloService.getActiveWithProgress(),
        moduloService.getRanking(20),
        moduloService.getMinhaPosicao(),
      ]);
      setModulos(progressData.modulos as ModuloComProgresso[]);
      setNivelEscola(progressData.nivel_escola_nome ?? null);
      setRanking(rankingData as RankItem[]);
      setMinhaPosicao(posicaoData ?? null);
      if (progressData.modulos.length > 0 && !selectedModulo) {
        const primeiro = progressData.modulos[0] as ModuloComProgresso;
        setSelectedModulo(primeiro);
        await loadQuizVinculado(primeiro.id_modulo);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizVinculado = async (moduloId: number) => {
    try {
      const quiz = await moduloService.getQuizVinculado(moduloId);
      setQuizVinculado(quiz);
    } catch {
      setQuizVinculado(null);
    }
  };

  const handleSelectModulo = async (modulo: ModuloComProgresso) => {
    setSelectedModulo(modulo);
    await loadQuizVinculado(modulo.id_modulo);
  };

  const isOpcional = (obrigatorio: boolean | number | undefined) =>
    obrigatorio === false || obrigatorio === 0;

  const isModuloDisponivel = (index: number): boolean => {
    const modulo = modulos[index];
    if (!modulo) return false;

    const preReqs = modulo.pre_requisitos || [];
    if (preReqs.length > 0) {
      const concluidos = new Set(
        modulos.filter((m) => m.status === "concluido").map((m) => m.id_modulo)
      );
      return preReqs.every((id) => concluidos.has(id));
    }

    if (isOpcional(modulo.obrigatorio)) return true;

    const obrigatoriosAntes = modulos
      .slice(0, index)
      .filter((m) => !isOpcional(m.obrigatorio));
    return obrigatoriosAntes.every((m) => m.status === "concluido");
  };

  return (
    <div className="modulos-page page-with-fixed-header">
      <Header />
      <main className="page">
        <div className="page-title" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          ESCOLA DE DISCÍPULOS
          <span
            className="nivel-badge"
            style={{
              background: "rgba(2, 134, 155, 0.2)",
              color: "#02869b",
              padding: "0.4rem 1rem",
              borderRadius: "999px",
              fontSize: "0.95rem",
              fontWeight: 700,
            }}
            aria-label={nivelEscola ? `Nível ${nivelEscola}` : "Nível"}
          >
            {nivelEscola ?? "Sem nível"}
          </span>
        </div>

        {loading && <p className="loading-message">Carregando...</p>}

        <section className="modules-layout" style={{ display: loading ? "none" : "grid" }}>
          {/* Coluna esquerda - Lista de Módulos */}
          <aside className="panel modules-left" aria-label="Lista de módulos">
            <div className="list-header">
              <h2>Módulos</h2>
              <span className="count">{modulos.length}</span>
            </div>
            <div className="list">
              {modulos.map((m, index) => {
                const disponivel = isModuloDisponivel(index);
                const concluido = m.status === "concluido";
                const isSelected = selectedModulo?.id_modulo === m.id_modulo;
                return (
                  <div
                    key={m.id_modulo}
                    className={`mod-item ${isSelected ? "selected" : ""} ${!disponivel ? "locked" : ""} ${concluido ? "concluido" : ""}`}
                    onClick={() => disponivel && handleSelectModulo(m)}
                    style={{
                      cursor: disponivel ? "pointer" : "not-allowed",
                      opacity: disponivel ? 1 : 0.6,
                    }}
                  >
                    <div className="mod-item__info">
                      <span className="mod-item__ordem">#{m.ordem}</span>
                      <span className="mod-item__name">{m.titulo}</span>
                      {isOpcional(m.obrigatorio) && (
                        <span className="mod-item__opcional-badge" title="Módulo opcional">Opcional</span>
                      )}
                      {concluido && <span style={{ marginLeft: "0.5rem" }}>✓</span>}
                      {!disponivel && <span style={{ marginLeft: "0.5rem" }}>🔒</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Coluna central - Conteúdo do Módulo */}
          <section className="panel modules-center" aria-label="Conteúdo do módulo">
            {selectedModulo ? (
              <div className="module-card">
                <div className="module-header">
                  <div className="module-title-area">
                    <h2 className="module-title">{selectedModulo.titulo}</h2>
                    {selectedModulo.status === "concluido" && (
                      <span className="badge badge-active">Concluído</span>
                    )}
                  </div>
                  <button
                    className="btn-edit"
                    onClick={() =>
                      navigate(`/usuario/modulos/preencher/${selectedModulo.id_modulo}`)
                    }
                    disabled={!isModuloDisponivel(
                      modulos.findIndex((m) => m.id_modulo === selectedModulo.id_modulo)
                    )}
                  >
                    {selectedModulo.status === "concluido" ? "Ver módulo" : "Realizar módulo"}
                  </button>
                </div>

                {selectedModulo.descricao && (
                  <div className="module-description">
                    <h3>Descrição</h3>
                    <p>{selectedModulo.descricao}</p>
                  </div>
                )}

                <div className="module-meta">
                  {selectedModulo && isOpcional(selectedModulo.obrigatorio) && (
                    <div className="meta-item">
                      <span className="meta-label">Tipo:</span>
                      <span className="meta-value meta-value-opcional">Opcional</span>
                    </div>
                  )}
                  {selectedModulo && !isOpcional(selectedModulo.obrigatorio) && selectedModulo.nivel_nome && (
                    <div className="meta-item">
                      <span className="meta-label">Nível:</span>
                      <span className="meta-value">{selectedModulo.nivel_nome}</span>
                    </div>
                  )}
                  {selectedModulo.pre_requisitos && selectedModulo.pre_requisitos.length > 0 && (
                    <div className="meta-item meta-item-block">
                      <span className="meta-label">Pré-requisitos:</span>
                      <span className="meta-value">
                        {modulos
                          .filter((m) => selectedModulo.pre_requisitos!.includes(m.id_modulo))
                          .map((m) => m.titulo)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Ordem:</span>
                    <span className="meta-value">{selectedModulo.ordem}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Quiz:</span>
                    <span className="meta-value">
                      {quizVinculado ? (
                        <span className="quiz-linked">
                          {quizVinculado.titulo || `Quiz #${quizVinculado.id_quiz}`}
                        </span>
                      ) : (
                        <span className="quiz-none">Nenhum</span>
                      )}
                    </span>
                  </div>
                  {selectedModulo.status === "concluido" &&
                    selectedModulo.nota_quiz != null && (
                      <div className="meta-item">
                        <span className="meta-label">Sua nota:</span>
                        <span className="meta-value">{selectedModulo.nota_quiz}</span>
                      </div>
                    )}
                </div>

                {selectedModulo.campos && selectedModulo.campos.length > 0 ? (
                  <div className="module-fields">
                    <h3>Conteúdo</h3>
                    <div className="campos-grid">
                      {selectedModulo.campos.map((campo, index) => (
                        <div key={index} className="campo-card">
                          <div className="campo-label">{campo.label || "Sem label"}</div>
                          <div className="campo-conteudo">
                            {formatarConteudoCampo(campo.conteudo)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="module-empty">
                    <p>Este módulo não possui conteúdo adicional.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="module-placeholder">
                <p>Selecione um módulo na lista para visualizar</p>
              </div>
            )}
          </section>

          {/* Coluna direita - Ranking (igual ao admin) com posição motivacional */}
          <aside className="panel modules-right" aria-label="Ranking">
            <RankingCard
              ranking={ranking}
              limit={20}
              title="RANKING"
              subtitle="Top 20 Discípulos"
              theme="light"
              minhaPosicao={minhaPosicao}
            />
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ModulosEscolaDiscipulosUser;
