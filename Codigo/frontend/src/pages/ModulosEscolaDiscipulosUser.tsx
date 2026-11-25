import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/editorCasa.css";
import "../style/secretariaUsuario.css";

import PaginaSecretaria, {
  ListaSecretaria,
  ItemSecretaria,
  DetalheSecretaria,
  DetalheVazio,
  abasDoUsuario,
  filtrarItens,
} from "../components/secretaria/PaginaSecretaria";
import RankingCard, { type RankItem, type MinhaPosicao } from "../components/modulos/RankingCard";
import BotoesExportar from "../components/ui/BotoesExportar";
import { exportarRanking } from "../utils/exportacoes";
import { useAuth } from "../hooks/useAuth";
import { formatarConteudoCampo } from "../utils/moduloConteudoUtils";
import moduloService from "../services/moduloService";
import Icone, { type NomeIcone } from "../components/ui/Icone";

type ModuloComProgresso = {
  id_modulo: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  obrigatorio?: boolean | number;
  id_nivel?: number | null;
  nivel_nome?: string | null;
  pre_requisitos?: number[];
  campos?: Array<{ label?: string; tipo_campo?: string; conteudo?: unknown }>;
  status?: "nao_iniciado" | "em_andamento" | "concluido";
  nota_quiz?: number | null;
  pontuacao_maxima?: number | null;
  data_conclusao?: string | null;
};

const NOME_TIPO: Record<string, string> = {
  video: "Vídeo",
  textarea: "Texto",
  texto: "Texto curto",
  upload: "Arquivo",
  link: "Link",
  data: "Data",
  numero: "Número",
};

const ehOpcional = (obrigatorio: boolean | number | undefined) => obrigatorio === false || obrigatorio === 0;

const ModulosEscolaDiscipulosUser: React.FC = () => {
  const { isLider, isAdmin, isLiderCelula } = useAuth();
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<ModuloComProgresso[]>([]);
  const [selecionado, setSelecionado] = useState<ModuloComProgresso | null>(null);
  const [quizVinculado, setQuizVinculado] = useState<{ id_quiz: number; titulo?: string } | null>(null);
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [minhaPosicao, setMinhaPosicao] = useState<MinhaPosicao | null>(null);
  const [nivelEscola, setNivelEscola] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarQuiz = async (idModulo: number) => {
    try {
      setQuizVinculado(await moduloService.getQuizVinculado(idModulo));
    } catch {
      setQuizVinculado(null);
    }
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const [progresso, rankingData, posicao] = await Promise.all([
        moduloService.getActiveWithProgress(),
        moduloService.getRanking(20),
        moduloService.getMinhaPosicao(),
      ]);
      const lista = progresso.modulos as ModuloComProgresso[];
      setModulos(lista);
      setNivelEscola(progresso.nivel_escola_nome ?? null);
      setRanking(rankingData as RankItem[]);
      setMinhaPosicao(posicao ?? null);
      // Abre no próximo passo da trilha: o primeiro liberado que ainda não foi concluído
      const proximo = lista.find((m, i) => m.status !== "concluido" && disponivelEm(lista, i)) ?? lista[0];
      if (proximo) {
        setSelecionado(proximo);
        await carregarQuiz(proximo.id_modulo);
      }
    } catch (err) {
      console.error("Erro ao carregar módulos:", err);
    } finally {
      setLoading(false);
    }
  };

  const selecionar = async (m: ModuloComProgresso) => {
    setSelecionado(m);
    await carregarQuiz(m.id_modulo);
  };

  const indice = (m: ModuloComProgresso) => modulos.findIndex((x) => x.id_modulo === m.id_modulo);
  const disponivel = (m: ModuloComProgresso) => disponivelEm(modulos, indice(m));

  /** O que falta para liberar um módulo bloqueado, em palavras */
  const motivoBloqueio = (m: ModuloComProgresso): string => {
    const concluidos = new Set(modulos.filter((x) => x.status === "concluido").map((x) => x.id_modulo));
    const preReqs = m.pre_requisitos || [];
    const faltam =
      preReqs.length > 0
        ? modulos.filter((x) => preReqs.includes(x.id_modulo) && !concluidos.has(x.id_modulo))
        : modulos.slice(0, indice(m)).filter((x) => !ehOpcional(x.obrigatorio) && x.status !== "concluido");
    if (faltam.length === 0) return "Este módulo ainda não está liberado.";
    return `Para liberar, conclua antes: ${faltam.map((x) => `"${x.titulo}"`).join(", ")}.`;
  };

  const obrigatorios = modulos.filter((m) => !ehOpcional(m.obrigatorio));
  const concluidosObrig = obrigatorios.filter((m) => m.status === "concluido").length;
  const totalConcluidos = modulos.filter((m) => m.status === "concluido").length;
  const percentual = obrigatorios.length ? Math.round((concluidosObrig / obrigatorios.length) * 100) : 0;
  const visiveis = filtrarItens(modulos, busca, "todos", (m) => m.titulo, () => true);

  const estadoDe = (m: ModuloComProgresso): { icone: NomeIcone; estado?: "concluido" | "bloqueado" | "andamento"; meta: string } => {
    if (m.status === "concluido") return { icone: "concluido", estado: "concluido", meta: "Concluído" };
    if (!disponivel(m)) return { icone: "cadeado", estado: "bloqueado", meta: "Bloqueado" };
    if (m.status === "em_andamento") return { icone: "formatura", estado: "andamento", meta: "Em andamento" };
    const n = m.campos?.length || 0;
    return { icone: "formatura", meta: `Liberado · ${n} ${n === 1 ? "conteúdo" : "conteúdos"}` };
  };

  const sel = selecionado;
  const selLiberado = sel ? disponivel(sel) : false;
  const selConcluido = sel?.status === "concluido";

  return (
    <PaginaSecretaria
      area="Escola de Discípulos"
      titulo="Minha trilha"
      icone="formatura"
      descricao="Siga os módulos na ordem: assista às aulas, leia o conteúdo e, quando houver, responda ao quiz para concluir. Cada módulo concluído libera o próximo."
      abas={abasDoUsuario(Boolean(isLiderCelula))}
      rotuloAbas="Minhas áreas"
      numeros={[
        { valor: nivelEscola ?? "Sem nível", rotulo: "seu nível" },
        { valor: `${totalConcluidos}/${modulos.length}`, rotulo: "concluídos" },
        ...(minhaPosicao && minhaPosicao.pontuacao > 0 ? [{ valor: `${minhaPosicao.posicao}º`, rotulo: "no ranking" }] : []),
      ]}
    >
      {obrigatorios.length > 0 && (
        <div className="su-progresso">
          <div className="su-progresso__textos">
            <strong>Progresso na trilha</strong>
            <span>
              {concluidosObrig} de {obrigatorios.length} módulos obrigatórios · {percentual}%
            </span>
          </div>
          <div
            className="su-progresso__barra"
            role="progressbar"
            aria-label="Progresso na trilha"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentual}
          >
            <span style={{ width: `${percentual}%` }} />
          </div>
        </div>
      )}

      <div className="sc-corpo sc-corpo--com-ranking">
        <ListaSecretaria
          titulo="Módulos"
          total={modulos.length}
          busca={busca}
          onBusca={setBusca}
          placeholderBusca="Buscar módulo pelo nome"
          dica={
            <>
              <Icone nome="cadeado" tamanho={13} /> Os bloqueados abrem quando você conclui os anteriores.
            </>
          }
          vazio={loading ? "Carregando…" : modulos.length ? "Nenhum módulo com esse nome." : "Ainda não há módulos liberados para você."}
          quantidadeVisivel={visiveis.length}
        >
          {visiveis.map((m) => {
            const e = estadoDe(m);
            return (
              <ItemSecretaria
                key={m.id_modulo}
                titulo={m.titulo}
                meta={e.meta}
                selo={ehOpcional(m.obrigatorio) ? "Opcional" : undefined}
                ativo
                estado={e.estado}
                selecionado={sel?.id_modulo === m.id_modulo}
                icone={e.icone}
                onSelecionar={() => selecionar(m)}
                antes={
                  <span className="sc-item__posicao su-posicao" aria-hidden>
                    {indice(m) + 1}
                  </span>
                }
              />
            );
          })}
        </ListaSecretaria>

        {sel ? (
          <DetalheSecretaria
            titulo={sel.titulo}
            ativo={selLiberado}
            status={`${selConcluido ? "Concluído" : selLiberado ? (sel.status === "em_andamento" ? "Em andamento" : "Liberado") : "Bloqueado"} · ${
              ehOpcional(sel.obrigatorio) ? "opcional" : "obrigatório"
            }`}
            acoes={
              selLiberado ? (
                <button
                  type="button"
                  className={`sc-btn ${selConcluido ? "sc-btn--contorno" : "sc-btn--primario"}`}
                  onClick={() => navigate(`/usuario/modulos/preencher/${sel.id_modulo}`)}
                >
                  <Icone nome={selConcluido ? "olho" : "proximo"} tamanho={15} />
                  {selConcluido ? "Rever aulas" : sel.status === "em_andamento" ? "Continuar" : "Começar módulo"}
                </button>
              ) : (
                <span className="su-bloqueado">
                  <Icone nome="cadeado" tamanho={15} /> Bloqueado
                </span>
              )
            }
          >
            {sel.descricao && (
              <p className="sc-descricao">
                <strong>Sobre este módulo</strong>
                {sel.descricao}
              </p>
            )}

            <div className="ec-numeros">
              <div>
                <strong>{indice(sel) + 1}º</strong>
                <span>na trilha</span>
              </div>
              <div>
                <strong>{sel.campos?.length || 0}</strong>
                <span>{(sel.campos?.length || 0) === 1 ? "conteúdo" : "conteúdos"}</span>
              </div>
              <div>
                {selConcluido && sel.nota_quiz != null ? (
                  <>
                    <strong>
                      {sel.nota_quiz}
                      {sel.pontuacao_maxima != null ? `/${sel.pontuacao_maxima}` : ""}
                    </strong>
                    <span>sua nota no quiz</span>
                  </>
                ) : (
                  <>
                    <strong className="ec-numeros__texto">{quizVinculado ? "Com quiz" : "Sem quiz"}</strong>
                    <span>{quizVinculado ? "nota mínima de 50%" : "conclui com um clique"}</span>
                  </>
                )}
              </div>
            </div>

            {!selLiberado ? (
              <p className="ec-lembrete">
                <Icone nome="cadeado" tamanho={15} />
                {motivoBloqueio(sel)}
              </p>
            ) : selConcluido ? (
              <p className="su-aviso su-aviso--ok">
                <Icone nome="concluido" tamanho={16} />
                Você concluiu este módulo
                {sel.data_conclusao ? ` em ${new Date(sel.data_conclusao).toLocaleDateString("pt-BR")}` : ""}. Pode rever as aulas quando quiser.
              </p>
            ) : (
              <p className="ec-lembrete">
                <Icone nome="alerta" tamanho={15} />
                {quizVinculado
                  ? `Veja as aulas e responda ao quiz "${quizVinculado.titulo || "do módulo"}". Com pelo menos 50% de acerto o módulo é concluído.`
                  : "Veja as aulas e clique em Concluir módulo no fim da página."}
                {!ehOpcional(sel.obrigatorio) && sel.nivel_nome ? ` Ao concluir, você chega ao nível ${sel.nivel_nome}.` : ""}
              </p>
            )}

            <h3 className="sc-subtitulo">
              <Icone nome="lista" tamanho={17} /> O que tem neste módulo
            </h3>
            {sel.campos && sel.campos.length > 0 ? (
              selLiberado ? (
                <ol className="ec-previa">
                  {sel.campos.map((campo, i) => (
                    <li key={i} className="campo-card campo-card--pergunta">
                      <span className="ec-selo ec-selo--pergunta">
                        {i + 1}. {NOME_TIPO[String(campo.tipo_campo)] || "Conteúdo"}
                      </span>
                      <div className="campo-label">{campo.label || "Sem título"}</div>
                      <div className="campo-conteudo">{formatarConteudoCampo(campo.conteudo)}</div>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="su-sumario">
                  {sel.campos.map((campo, i) => (
                    <li key={i}>
                      <span className="ec-selo ec-selo--pergunta">{NOME_TIPO[String(campo.tipo_campo)] || "Conteúdo"}</span>
                      {campo.label || "Sem título"}
                    </li>
                  ))}
                </ol>
              )
            ) : (
              <p className="sc-vazio-conteudo">Este módulo não tem aulas cadastradas.</p>
            )}
          </DetalheSecretaria>
        ) : (
          <DetalheVazio
            icone="formatura"
            texto={loading ? "Carregando sua trilha…" : modulos.length ? "Escolha um módulo na lista." : "Ainda não há módulos para você. Fale com seu líder."}
          />
        )}

        <aside className="sc-lateral" aria-label="Ranking">
          <RankingCard
            ranking={ranking}
            limit={20}
            title="RANKING"
            subtitle="Top 20 Discípulos"
            theme="light"
            minhaPosicao={minhaPosicao}
            headerAction={
              isLider || isAdmin ? (
                <BotoesExportar
                  tema="claro"
                  rotuloExcel="Excel"
                  onExcel={async () => exportarRanking(await moduloService.getRankingCompleto())}
                />
              ) : undefined
            }
          />
        </aside>
      </div>
    </PaginaSecretaria>
  );
};

/** Mesma regra do servidor: pré-requisitos, ou os obrigatórios anteriores concluídos (opcionais sempre livres) */
function disponivelEm(modulos: ModuloComProgresso[], index: number): boolean {
  const modulo = modulos[index];
  if (!modulo) return false;
  const preReqs = modulo.pre_requisitos || [];
  if (preReqs.length > 0) {
    const concluidos = new Set(modulos.filter((m) => m.status === "concluido").map((m) => m.id_modulo));
    return preReqs.every((id) => concluidos.has(id));
  }
  if (ehOpcional(modulo.obrigatorio)) return true;
  return modulos
    .slice(0, index)
    .filter((m) => !ehOpcional(m.obrigatorio))
    .every((m) => m.status === "concluido");
}

export default ModulosEscolaDiscipulosUser;
