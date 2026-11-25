import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/editorCasa.css";

import ConfirmModal from "../ui/ConfirmModal";
import Toast from "../ui/Toast";
import BotaoCarregando from "../ui/BotaoCarregando";
import Icone from "../ui/Icone";
import EditorBlocos, { blocosDosCampos, type BlocoConteudo } from "../conteudo/EditorBlocos";
import moduloService from "../../services/moduloService";
import campoService from "../../services/campoService";
import { showAllNiveis } from "../../services/nivel";
import { uploadCampo } from "../../services/uploadService";
import type { Campo } from "../../types";
import QuizField from "../fields/QuizField";
import { erroDoModulo } from "../../utils/validarModulo";
import { getErrorMessage } from "../../utils/errorUtils";

type Nivel = { id_nivel: number; nome: string; ordem: number };

/**
 * Editor de módulo da Escola de Discípulos (criar e editar usam o mesmo).
 * O lugar do módulo na trilha muda arrastando na lista de módulos, não aqui.
 */
export default function EditorModulo({ idModulo }: { idModulo?: number }) {
  const navigate = useNavigate();
  const editando = !!idModulo;
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [obrigatorio, setObrigatorio] = useState(true);
  const [idNivel, setIdNivel] = useState<number | "">("");
  const [preRequisitos, setPreRequisitos] = useState<number[]>([]);
  const [blocos, setBlocos] = useState<BlocoConteudo[]>([]);
  const [quizId, setQuizId] = useState<number | null>(null);
  const [quizOriginal, setQuizOriginal] = useState<number | null>(null);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<Campo[]>([]);
  const [outrosModulos, setOutrosModulos] = useState<{ id_modulo: number; titulo: string; obrigatorio?: boolean }[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tipo: "success" | "error" } | null>(null);
  const [alterado, setAlterado] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const tituloRef = useRef<HTMLInputElement>(null);

  const mudou = () => {
    setAlterado(true);
    setErro(null);
  };

  useEffect(() => {
    campoService.getByModalidade("modulo").then(setTiposDisponiveis).catch(() => setTiposDisponiveis([]));
    showAllNiveis()
      .then((n) => setNiveis(Array.isArray(n) ? n : []))
      .catch(() => setNiveis([]));
    moduloService
      .getAll()
      .then((mods) =>
        setOutrosModulos(
          mods
            .filter((m) => m.id_modulo !== idModulo)
            .map((m) => ({ id_modulo: m.id_modulo, titulo: m.titulo, obrigatorio: m.obrigatorio !== false }))
        )
      )
      .catch(() => setOutrosModulos([]));
  }, [idModulo]);

  useEffect(() => {
    if (!idModulo) {
      setTimeout(() => tituloRef.current?.focus(), 60);
      return;
    }
    (async () => {
      try {
        const m = await moduloService.getById(idModulo);
        setTitulo(m.titulo || "");
        setDescricao(m.descricao || "");
        setAtivo(m.ativo !== false && (m.ativo as unknown) !== 0);
        const obs = m.obrigatorio as boolean | number | undefined;
        setObrigatorio(obs !== false && obs !== 0);
        setIdNivel(m.id_nivel ?? "");
        setPreRequisitos(m.pre_requisitos || []);
        setBlocos(blocosDosCampos(m.campos || []));
        const quiz = await moduloService.getQuizVinculado(idModulo).catch(() => null);
        setQuizId(quiz?.id_quiz ?? null);
        setQuizOriginal(quiz?.id_quiz ?? null);
      } catch (e) {
        setAviso({ texto: getErrorMessage(e, "Não foi possível abrir o módulo."), tipo: "error" });
        setTimeout(() => navigate("/admin/modulos"), 1500);
      } finally {
        setCarregando(false);
      }
    })();
  }, [idModulo, navigate]);

  // Aviso do navegador ao fechar/atualizar a aba com mudanças não salvas
  useEffect(() => {
    if (!alterado) return;
    const antes = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", antes);
    return () => window.removeEventListener("beforeunload", antes);
  }, [alterado]);

  const sair = () => {
    if (salvando) return;
    if (alterado) setConfirmarSaida(true);
    else navigate("/admin/modulos");
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    const problema = erroDoModulo({
      titulo,
      conteudos: blocos.map((b) => ({ tipo: b.tipo, label: b.label, conteudo: b.conteudo })),
    });
    if (problema) {
      setErro(problema);
      if (titulo.trim().length < 3) tituloRef.current?.focus();
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const campos = [];
      for (const b of blocos) {
        let conteudo = b.conteudo;
        if (conteudo instanceof File) {
          try {
            conteudo = await uploadCampo(conteudo);
          } catch (err) {
            throw new Error(`Não foi possível enviar o arquivo de "${b.label}". ${getErrorMessage(err, "")}`.trim());
          }
        }
        campos.push({ id_campo: b.id_campo, label: b.label.trim(), conteudo: typeof conteudo === "string" || typeof conteudo === "number" ? conteudo : "" });
      }
      const dados = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        ativo,
        obrigatorio,
        // null tira o nível (opcional não conta para nível)
        id_nivel: obrigatorio && idNivel ? Number(idNivel) : null,
        pre_requisitos: preRequisitos,
        campos,
      };

      let id = idModulo;
      if (id) {
        await moduloService.update(id, dados);
      } else {
        id = (await moduloService.create(dados)).id_modulo;
      }

      // Quiz: vincula, troca ou tira
      if (quizId !== quizOriginal) {
        try {
          if (quizOriginal) await moduloService.desvincularQuiz(id, quizOriginal);
          if (quizId) await moduloService.vincularQuiz(id, quizId);
        } catch {
          setAlterado(false);
          setAviso({ texto: "O módulo foi salvo, mas o quiz não foi vinculado. Escolha o quiz de novo.", tipo: "error" });
          if (!editando) setTimeout(() => navigate(`/admin/modulos/editar/${id}`), 1800);
          setSalvando(false);
          return;
        }
      }

      setAlterado(false);
      setAviso({ texto: editando ? "Módulo salvo." : "Módulo criado. Ele entrou no fim da trilha.", tipo: "success" });
      // O botão segue em "Salvando…" até sair (clicar de novo criaria outro igual)
      setTimeout(() => navigate("/admin/modulos"), 1000);
    } catch (err) {
      setErro(getErrorMessage(err, "Não foi possível salvar o módulo."));
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="ec-pagina">
        <p className="ec-carregando">Carregando o módulo…</p>
      </div>
    );
  }

  return (
    <div className="ec-pagina">
      <div className="ec-editor ec-editor--pagina">
        <div className="ec-editor__topo">
          <div>
            <p className="ec-editor__sobretitulo">Escola de Discípulos · Módulo</p>
            <h1 id="ec-modulo-titulo">{editando ? "Editar módulo" : "Novo módulo"}</h1>
          </div>
          <button type="button" className="ec-fechar" onClick={sair} aria-label="Voltar para a lista de módulos">
            <Icone nome="fechar" tamanho={20} />
          </button>
        </div>

        <form className="ec-editor__form" noValidate onSubmit={salvar} aria-labelledby="ec-modulo-titulo">
          <div className="ec-editor__rolagem">
            <details className="ec-passos" open={!editando}>
              <summary>
                <Icone nome="livro" tamanho={16} /> Como funciona o módulo
              </summary>
              <ol>
                <li>
                  <strong>Dê nome e descrição</strong>
                  <span>É o que o aluno vê no card do módulo na Escola de Discípulos.</span>
                </li>
                <li>
                  <strong>Defina o lugar na trilha</strong>
                  <span>Obrigatório segue a sequência e sobe o nível; opcional fica livre a qualquer momento.</span>
                </li>
                <li>
                  <strong>Monte as aulas</strong>
                  <span>
                    Adicione vídeos, textos e arquivos e arraste pela alça <Icone nome="arrastar" tamanho={13} /> para ordenar.
                  </span>
                </li>
                <li>
                  <strong>Escolha um quiz (opcional)</strong>
                  <span>Com quiz, o aluno conclui o módulo respondendo. Os quizzes são criados na tela Quizzes.</span>
                </li>
              </ol>
            </details>

            <section className="ec-secao" aria-labelledby="ec-mod-info">
              <h2 id="ec-mod-info" className="ec-secao__titulo">
                <span className="ec-secao__num">1</span> Informações
              </h2>
              <div className="ec-campo">
                <label className="ec-rotulo" htmlFor="moduleName">
                  Nome do módulo <span className="ec-obrigatorio">obrigatório</span>
                </label>
                <input
                  id="moduleName"
                  ref={tituloRef}
                  className="ec-input"
                  maxLength={255}
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    mudou();
                  }}
                  placeholder="Ex.: Discipulado 1 – Ser Casa"
                />
              </div>
              <div className="ec-campo">
                <label className="ec-rotulo" htmlFor="moduleDescription">
                  Descrição <span className="ec-opcional">opcional</span>
                </label>
                <textarea
                  id="moduleDescription"
                  className="ec-input ec-input--area"
                  maxLength={1000}
                  rows={3}
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value);
                    mudou();
                  }}
                  placeholder="Ex.: O que significa fazer parte da família da Casa."
                />
              </div>
              <label className="ec-chave" htmlFor="moduleAtivo">
                <input
                  id="moduleAtivo"
                  type="checkbox"
                  role="switch"
                  checked={ativo}
                  onChange={(e) => {
                    setAtivo(e.target.checked);
                    mudou();
                  }}
                />
                <span className="ec-chave__trilho" aria-hidden />
                <span className="ec-chave__texto">
                  <strong>{ativo ? "Liberado para os discípulos" : "Escondido dos discípulos"}</strong>
                  <small>
                    {ativo
                      ? "Aparece na Escola de Discípulos assim que você salvar."
                      : "Fica salvo, mas ninguém vê. Use enquanto ainda está montando."}
                  </small>
                </span>
              </label>
            </section>

            <section className="ec-secao" aria-labelledby="ec-mod-trilha">
              <h2 id="ec-mod-trilha" className="ec-secao__titulo">
                <span className="ec-secao__num">2</span> Lugar na trilha
              </h2>
              <div className="ec-opcoes" role="radiogroup" aria-label="Tipo do módulo">
                <label className={`ec-opcao${obrigatorio ? " ec-opcao--marcada" : ""}`}>
                  <input
                    type="radio"
                    name="tipoModulo"
                    checked={obrigatorio}
                    onChange={() => {
                      setObrigatorio(true);
                      mudou();
                    }}
                  />
                  <span>
                    <strong>Obrigatório</strong>
                    <small>Faz parte da sequência: libera depois dos anteriores e pode subir o nível do discípulo.</small>
                  </span>
                </label>
                <label className={`ec-opcao${!obrigatorio ? " ec-opcao--marcada" : ""}`}>
                  <input
                    type="radio"
                    name="tipoModulo"
                    checked={!obrigatorio}
                    onChange={() => {
                      setObrigatorio(false);
                      mudou();
                    }}
                  />
                  <span>
                    <strong>Opcional</strong>
                    <small>Livre a qualquer momento, não bloqueia nada e não conta para o nível.</small>
                  </span>
                </label>
              </div>

              {obrigatorio && (
                <div className="ec-campo">
                  <label className="ec-rotulo" htmlFor="moduleNivel">
                    Nível ao concluir <span className="ec-opcional">opcional</span>
                  </label>
                  <select
                    id="moduleNivel"
                    className="ec-input"
                    value={idNivel}
                    onChange={(e) => {
                      setIdNivel(e.target.value ? Number(e.target.value) : "");
                      mudou();
                    }}
                  >
                    <option value="">Nenhum (não muda o nível)</option>
                    {niveis.map((n) => (
                      <option key={n.id_nivel} value={n.id_nivel}>
                        {n.nome}
                      </option>
                    ))}
                  </select>
                  <p className="ec-dica">Quem concluir este módulo chega a esse nível. Os níveis são cadastrados em Gerenciar Usuários.</p>
                </div>
              )}

              <div className="ec-campo">
                <span className="ec-rotulo">
                  Pré-requisitos <span className="ec-opcional">opcional</span>
                </span>
                <p className="ec-dica">
                  Marque os módulos que o discípulo precisa concluir antes deste. Sem nenhum marcado, vale a ordem da lista de
                  módulos (que você muda arrastando lá).
                </p>
                {outrosModulos.length === 0 ? (
                  <p className="ec-dica">Ainda não há outros módulos.</p>
                ) : (
                  <div className="ec-checklist">
                    {outrosModulos.map((m) => (
                      <label key={m.id_modulo} className={`ec-check${preRequisitos.includes(m.id_modulo) ? " ec-check--marcado" : ""}`}>
                        <input
                          type="checkbox"
                          checked={preRequisitos.includes(m.id_modulo)}
                          onChange={(e) => {
                            setPreRequisitos((prev) =>
                              e.target.checked ? [...prev, m.id_modulo] : prev.filter((x) => x !== m.id_modulo)
                            );
                            mudou();
                          }}
                        />
                        <span>{m.titulo}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="ec-secao" aria-labelledby="ec-mod-aulas">
              <div className="ec-secao__cabecalho">
                <h2 id="ec-mod-aulas" className="ec-secao__titulo">
                  <span className="ec-secao__num">3</span> Conteúdo das aulas
                </h2>
                <span className="ec-resumo">
                  {blocos.length} {blocos.length === 1 ? "conteúdo" : "conteúdos"}
                </span>
              </div>
              <p className="ec-dica">
                O discípulo vê nesta ordem. Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para reorganizar.
              </p>

              <EditorBlocos
                blocos={blocos}
                onChange={(novos) => {
                  setBlocos(novos);
                  mudou();
                }}
                tiposDisponiveis={tiposDisponiveis.map((c) => ({ id_campo: c.id_campo, tipo_campo: String(c.tipo_campo) }))}
                quem="o discípulo"
                onIndisponivel={() => setAviso({ texto: "Esse tipo de conteúdo não está disponível.", tipo: "error" })}
              />
            </section>

            <section className="ec-secao" aria-labelledby="ec-mod-quiz">
              <h2 id="ec-mod-quiz" className="ec-secao__titulo">
                <span className="ec-secao__num">4</span> Quiz do módulo <span className="ec-opcional">opcional</span>
              </h2>
              <p className="ec-dica">
                Com quiz, o discípulo conclui o módulo respondendo às perguntas e ganha os pontos. Sem quiz, ele conclui
                marcando o módulo como feito. Os quizzes são criados na tela Quizzes da Secretaria.
              </p>
              <div className="ec-item__corpo field-wrapper">
                <QuizField
                  name="quizModulo"
                  label="Quiz"
                  value={quizId}
                  onChange={(v) => {
                    setQuizId(v);
                    mudou();
                  }}
                />
              </div>
            </section>
          </div>

          <div className="ec-editor__rodape">
            {erro ? (
              <p className="ec-erro" role="alert">
                <Icone nome="alerta" tamanho={16} /> {erro}
              </p>
            ) : (
              <p className="ec-rodape-info">
                {obrigatorio ? "Obrigatório" : "Opcional"} · {blocos.length} {blocos.length === 1 ? "conteúdo" : "conteúdos"}
                {quizId ? " · com quiz" : ""}
              </p>
            )}
            <div className="ec-editor__botoes">
              <button type="button" className="ec-btn ec-btn--fantasma" onClick={sair} disabled={salvando}>
                Cancelar
              </button>
              <BotaoCarregando
                type="submit"
                className="ec-btn ec-btn--primario"
                carregando={salvando}
                textoCarregando={editando ? "Salvando…" : "Criando…"}
              >
                {editando ? "Salvar alterações" : "Criar módulo"}
              </BotaoCarregando>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={confirmarSaida}
        title="Sair sem salvar?"
        message="Você mudou este módulo e ainda não salvou. Se sair agora, as mudanças se perdem."
        confirmLabel="Sair sem salvar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={() => navigate("/admin/modulos")}
        onCancel={() => setConfirmarSaida(false)}
      />
      {aviso && <Toast message={aviso.texto} onClose={() => setAviso(null)} variant={aviso.tipo} />}
    </div>
  );
}
