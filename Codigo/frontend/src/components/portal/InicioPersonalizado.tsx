import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInicio } from "../../services/usuario";
import "../../style/inicio.css";

export interface ResumoInicio {
  primeiro_nome: string | null;
  pontuacao: number;
  nivel: string | null;
  escola: { concluidos: number; total: number };
  modulo_para_continuar: { id_modulo: number; titulo: string; status: string; nivel: string | null } | null;
  proximas_escalas: { id_escala_evento: number; titulo: string; data_hora: string; area: string }[];
  palavra_do_dia: { texto: string; referencia: string | null; data: string } | null;
  notificacoes_nao_lidas: number;
}

const semTeste = (t: string) => t.replace(/^\[TESTE\]\s*/, "");

/** "Domingo, 16/11 às 19:00" — horários do sistema são de Brasília */
export function formatarDataEscala(iso: string): string {
  const d = new Date(String(iso).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const dia = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} às ${hora}`;
}

function saudacao(agora = new Date()): string {
  const h = agora.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Início personalizado do Portal: o que a pessoa precisa saber ao entrar.
 * Se a consulta falhar, o painel some e o portal continua funcionando normalmente.
 */
const InicioPersonalizado: React.FC = () => {
  const [resumo, setResumo] = useState<ResumoInicio | null>(null);
  const [estado, setEstado] = useState<"carregando" | "ok" | "erro">("carregando");

  useEffect(() => {
    let ativo = true;
    getInicio()
      .then((r: ResumoInicio) => {
        if (!ativo) return;
        setResumo(r);
        setEstado("ok");
      })
      .catch(() => ativo && setEstado("erro"));
    return () => {
      ativo = false;
    };
  }, []);

  if (estado === "erro") return null;

  if (estado === "carregando" || !resumo) {
    return (
      <section className="inicio" aria-busy="true" aria-label="Carregando seu resumo">
        <div className="inicio__saudacao inicio__esqueleto inicio__esqueleto--titulo" />
        <div className="inicio__cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className="inicio-card inicio__esqueleto" />
          ))}
        </div>
      </section>
    );
  }

  const { escola, modulo_para_continuar: modulo, proximas_escalas: escalas, palavra_do_dia: palavra } = resumo;
  const pct = escola.total > 0 ? Math.round((escola.concluidos / escola.total) * 100) : 0;

  return (
    <section className="inicio" aria-labelledby="inicio-titulo">
      <div className="inicio__saudacao">
        <h2 id="inicio-titulo">
          {saudacao()}
          {resumo.primeiro_nome ? `, ${resumo.primeiro_nome}` : ""}!
        </h2>
        <p className="inicio__meta">
          {resumo.nivel && <span className="inicio__selo">{resumo.nivel}</span>}
          <span>{resumo.pontuacao} pontos</span>
          {resumo.notificacoes_nao_lidas > 0 && (
            <span className="inicio__aviso">
              {resumo.notificacoes_nao_lidas === 1
                ? "1 notificação nova"
                : `${resumo.notificacoes_nao_lidas} notificações novas`}
            </span>
          )}
        </p>
      </div>

      <div className="inicio__cards">
        {/* Próxima escala */}
        <article className="inicio-card">
          <h3 className="inicio-card__rotulo">Sua próxima escala</h3>
          {escalas.length > 0 ? (
            <>
              <p className="inicio-card__destaque">{escalas[0].titulo}</p>
              <p className="inicio-card__texto">
                {formatarDataEscala(escalas[0].data_hora)} · {escalas[0].area}
              </p>
              {escalas.length > 1 && (
                <p className="inicio-card__extra">
                  + {escalas.length - 1} {escalas.length - 1 === 1 ? "outra escala" : "outras escalas"} em breve
                </p>
              )}
            </>
          ) : (
            <p className="inicio-card__texto">Você não está escalado nos próximos dias.</p>
          )}
          <Link to="/usuario/escala?ver=minhas" className="inicio-card__link">
            Ver escala
          </Link>
        </article>

        {/* Escola de Discípulos */}
        <article className="inicio-card">
          <h3 className="inicio-card__rotulo">Escola de Discípulos</h3>
          {modulo ? (
            <>
              <p className="inicio-card__destaque">{semTeste(modulo.titulo)}</p>
              <p className="inicio-card__texto">
                {modulo.status === "em_andamento" ? "Você parou aqui" : "Próximo módulo"}
              </p>
            </>
          ) : (
            <p className="inicio-card__destaque">
              {escola.total > 0 ? "Você concluiu todos os módulos!" : "Novos módulos em breve"}
            </p>
          )}
          {escola.total > 0 && (
            <div className="inicio-progresso">
              <div
                className="inicio-progresso__barra"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={escola.total}
                aria-valuenow={escola.concluidos}
                aria-label="Módulos concluídos"
              >
                <span style={{ width: `${pct}%` }} />
              </div>
              <span className="inicio-progresso__texto">
                {escola.concluidos} de {escola.total}
              </span>
            </div>
          )}
          <Link
            to={modulo ? `/usuario/modulos/preencher/${modulo.id_modulo}` : "/usuario/modulos"}
            className="inicio-card__link"
          >
            {modulo ? (modulo.status === "em_andamento" ? "Continuar" : "Começar") : "Ver módulos"}
          </Link>
        </article>

        {/* Palavra do dia */}
        <article className="inicio-card inicio-card--palavra">
          <h3 className="inicio-card__rotulo">Palavra do dia</h3>
          {palavra ? (
            <blockquote className="inicio-card__citacao">
              <p>{palavra.texto}</p>
              {palavra.referencia && <cite>{palavra.referencia}</cite>}
            </blockquote>
          ) : (
            <p className="inicio-card__texto">Nenhuma palavra publicada ainda.</p>
          )}
          <Link to="/usuario/fala-ai" className="inicio-card__link">
            Abrir Fala Aí
          </Link>
        </article>
      </div>
    </section>
  );
};

export default InicioPersonalizado;
