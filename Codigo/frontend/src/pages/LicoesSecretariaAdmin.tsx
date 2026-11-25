import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../style/LicoesSecretariaAdmin.css";
import "../style/editorCasa.css";
import PaginaSecretaria, {
  DetalheSecretaria,
  DetalheVazio,
  ItemSecretaria,
  ListaSecretaria,
  filtrarItens,
  type FiltroStatus,
} from "../components/secretaria/PaginaSecretaria";

import Toast from "../components/ui/Toast";
import ConfirmModal from "../components/ui/ConfirmModal";
import FocusTrapComponent from "../components/ui/FocusTrap";
import BotaoCarregando from "../components/ui/BotaoCarregando";
import Icone from "../components/ui/Icone";
import EditorBlocos, { TIPOS_CONTEUDO, blocosDosCampos, type BlocoConteudo } from "../components/conteudo/EditorBlocos";
import { renderVideoPreview } from "../components/conteudo/renderVideoPreview";

import licaoService, { Licao } from "../services/licaoService";
import campoService from "../services/campoService";
import { uploadCampo, isImagePath } from "../services/uploadService";
import { ASSETS_BASE } from "../config/api";
import { useAcao } from "../hooks/useAcao";
import { erroDoModulo } from "../utils/validarModulo";
import { getErrorMessage } from "../utils/errorUtils";

type TipoDisponivel = { id_campo: number; tipo_campo: string };
const isAtivo = (l: Licao) => l.ativo === 1 || l.ativo === true;
const nomeDoTipo = (tipo: string) => TIPOS_CONTEUDO.find((t) => t.tipo === tipo)?.nome || "Conteúdo";

/** Mostra o conteúdo de um bloco no painel: imagem/arquivo, vídeo, link ou texto */
function ConteudoNoPainel({ valor }: { valor: unknown }) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (!texto) return <span className="licao-sem-conteudo">Sem conteúdo</span>;
  if (texto.startsWith("/uploads/")) {
    const nome = texto.split("/").pop() || "arquivo";
    const url = `${ASSETS_BASE}${texto}`;
    return (
      <div className="upload-preview-campo">
        {isImagePath(texto) && <img src={url} alt={nome} className="licao-previa-imagem" />}
        <a href={url} target="_blank" rel="noopener noreferrer" className="upload-link">
          <Icone nome="arquivo" tamanho={16} /> {nome}
        </a>
      </div>
    );
  }
  if (/(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.ogg)/i.test(texto)) return <>{renderVideoPreview(texto)}</>;
  if (/^https?:\/\//i.test(texto)) {
    return (
      <a href={texto} target="_blank" rel="noopener noreferrer" className="upload-link">
        {texto}
      </a>
    );
  }
  return <p className="licao-texto">{texto}</p>;
}

const LicoesSecretariaAdmin: React.FC = () => {
  const acaoSalvar = useAcao();
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [selecionada, setSelecionada] = useState<Licao | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const [tipos, setTipos] = useState<TipoDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tipo: "success" | "error" | "info" } | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Licao | null>(null);

  // Editor
  const [editorAberto, setEditorAberto] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [blocos, setBlocos] = useState<BlocoConteudo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [alterado, setAlterado] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const tituloRef = useRef<HTMLInputElement | null>(null);

  const avisar = (texto: string, tipo: "success" | "error" | "info" = "success") => setAviso({ texto, tipo });
  const tipoPorId = (id: number) => tipos.find((t) => t.id_campo === id)?.tipo_campo;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [lista, campos] = await Promise.all([licaoService.getAll(), campoService.getByModalidade("licao")]);
        setLicoes(lista || []);
        setSelecionada((sel) => sel ?? (lista || [])[0] ?? null);
        setTipos((campos || []).map((c) => ({ id_campo: c.id_campo, tipo_campo: String(c.tipo_campo) })));
      } catch (e) {
        avisar(getErrorMessage(e, "Não foi possível carregar as lições."), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recarregar = async (manterId?: number) => {
    const lista = await licaoService.getAll();
    setLicoes(lista || []);
    setSelecionada((sel) => {
      const id = manterId ?? sel?.id_licao;
      return (lista || []).find((l) => l.id_licao === id) ?? (lista || [])[0] ?? null;
    });
  };

  const alternar = async (l: Licao) => {
    const novo = !isAtivo(l);
    try {
      // Só o status (antes mandava tudo e o servidor apagava e recriava os conteúdos)
      await licaoService.update(l.id_licao, { ativo: novo });
      const mudar = (x: Licao) => (x.id_licao === l.id_licao ? { ...x, ativo: novo ? 1 : 0 } : x);
      setLicoes((lista) => lista.map(mudar));
      setSelecionada((sel) => (sel ? mudar(sel) : sel));
      avisar(novo ? "Lição liberada para os líderes." : "Lição escondida dos líderes.");
    } catch (e) {
      avisar(getErrorMessage(e, "Não foi possível alterar a lição."), "error");
    }
  };

  const excluir = async () => {
    if (!paraExcluir) return;
    try {
      await licaoService.delete(paraExcluir.id_licao);
      await recarregar();
      avisar("Lição excluída.");
    } catch (e) {
      avisar(getErrorMessage(e, "Não foi possível excluir a lição."), "error");
    } finally {
      setParaExcluir(null);
    }
  };

  const abrirNova = () => {
    setIdEditando(null);
    setTitulo("");
    setDescricao("");
    setAtivo(true);
    setBlocos([]);
    setErro(null);
    setAlterado(false);
    setEditorAberto(true);
    setTimeout(() => tituloRef.current?.focus(), 80);
  };

  const abrirEdicao = async (id: number) => {
    try {
      const l = await licaoService.getById(id);
      setIdEditando(l.id_licao);
      setTitulo(l.titulo ?? "");
      setDescricao(l.descricao ?? "");
      setAtivo(isAtivo(l));
      setBlocos(blocosDosCampos(l.campos ?? [], tipoPorId));
      setErro(null);
      setAlterado(false);
      setEditorAberto(true);
      setTimeout(() => tituloRef.current?.focus(), 80);
    } catch (e) {
      avisar(getErrorMessage(e, "Não foi possível abrir a lição."), "error");
    }
  };

  const fechar = () => {
    setConfirmarDescarte(false);
    setEditorAberto(false);
    setAlterado(false);
  };

  const pedirFechar = () => {
    if (acaoSalvar.executando) return;
    if (alterado) setConfirmarDescarte(true);
    else fechar();
  };

  const mudou = () => {
    setAlterado(true);
    setErro(null);
  };

  const salvar = async () => {
    const problema =
      blocos.length === 0
        ? titulo.trim().length < 3
          ? "O título precisa ter pelo menos 3 letras."
          : "Adicione pelo menos um conteúdo à lição."
        : erroDoModulo({ titulo, conteudos: blocos.map((b) => ({ tipo: b.tipo, label: b.label, conteudo: b.conteudo })) });
    if (problema) {
      setErro(problema.replace("nome do módulo", "título da lição"));
      if (titulo.trim().length < 3) tituloRef.current?.focus();
      return;
    }
    try {
      const campos = [];
      for (const b of blocos) {
        let conteudo = b.conteudo;
        if (conteudo instanceof File) {
          try {
            conteudo = await uploadCampo(conteudo);
          } catch (e) {
            throw new Error(`Não foi possível enviar o arquivo de "${b.label}". ${getErrorMessage(e, "")}`.trim());
          }
        }
        campos.push({ id_campo: b.id_campo, label: b.label.trim(), conteudo: typeof conteudo === "string" || typeof conteudo === "number" ? conteudo : "" });
      }
      const dados = { titulo: titulo.trim(), descricao: descricao.trim() || null, ativo, campos };
      if (idEditando) {
        await licaoService.update(idEditando, dados);
        await recarregar(idEditando);
        avisar("Lição salva.");
      } else {
        const nova = await licaoService.create(dados);
        await recarregar(nova.id_licao);
        avisar(ativo ? "Lição criada. Os líderes já podem ver em Lições." : "Lição criada (escondida dos líderes por enquanto).");
      }
      fechar();
    } catch (e) {
      setErro(getErrorMessage(e, "Não foi possível salvar a lição."));
    }
  };

  const qtd = (l: Licao | null) => l?.campos?.length || 0;

  const editor = editorAberto
    ? createPortal(
        <FocusTrapComponent
          active={editorAberto && !confirmarDescarte}
          focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="ec-fundo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ec-licao-titulo"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !confirmarDescarte) pedirFechar();
            }}
          >
            <div className="ec-editor">
              <div className="ec-editor__topo">
                <div>
                  <p className="ec-editor__sobretitulo">Secretaria das Células · Lição</p>
                  <h2 id="ec-licao-titulo">{idEditando ? "Editar lição" : "Nova lição"}</h2>
                </div>
                <button type="button" className="ec-fechar" onClick={pedirFechar} aria-label="Fechar">
                  <Icone nome="fechar" tamanho={20} />
                </button>
              </div>

              <form
                className="ec-editor__form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  acaoSalvar.executar(salvar);
                }}
              >
                <div className="ec-editor__rolagem">
                  <details className="ec-passos" open={!idEditando}>
                    <summary>
                      <Icone nome="livro" tamanho={16} /> Como funciona a lição
                    </summary>
                    <ol>
                      <li>
                        <strong>Dê um título</strong>
                        <span>É o tema que o líder vê na lista de lições (ex.: "Semana 12 – Perdão").</span>
                      </li>
                      <li>
                        <strong>Monte o material</strong>
                        <span>Vídeo, texto do ensino, perguntas para a célula, PDF de apoio…</span>
                      </li>
                      <li>
                        <strong>Organize</strong>
                        <span>
                          Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para mudar a ordem. O líder vê nessa ordem.
                        </span>
                      </li>
                      <li>
                        <strong>Libere</strong>
                        <span>Com a lição liberada, os líderes de célula veem em Lições para usar na reunião.</span>
                      </li>
                    </ol>
                  </details>

                  <section className="ec-secao" aria-labelledby="ec-licao-info">
                    <h3 id="ec-licao-info" className="ec-secao__titulo">
                      <span className="ec-secao__num">1</span> Informações
                    </h3>
                    <div className="ec-campo">
                      <label className="ec-rotulo" htmlFor="licaoTitulo">
                        Título <span className="ec-obrigatorio">obrigatório</span>
                      </label>
                      <input
                        id="licaoTitulo"
                        ref={tituloRef}
                        className="ec-input"
                        maxLength={255}
                        value={titulo}
                        onChange={(e) => {
                          setTitulo(e.target.value);
                          mudou();
                        }}
                        placeholder="Ex.: Semana 12 – O poder do perdão"
                      />
                    </div>
                    <div className="ec-campo">
                      <label className="ec-rotulo" htmlFor="licaoDescricao">
                        Resumo para o líder <span className="ec-opcional">opcional</span>
                      </label>
                      <textarea
                        id="licaoDescricao"
                        className="ec-input ec-input--area"
                        maxLength={1000}
                        rows={3}
                        value={descricao}
                        onChange={(e) => {
                          setDescricao(e.target.value);
                          mudou();
                        }}
                        placeholder="Ex.: Objetivo da reunião e como conduzir a conversa."
                      />
                    </div>
                    <label className="ec-chave" htmlFor="licaoAtivo">
                      <input
                        id="licaoAtivo"
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
                        <strong>{ativo ? "Liberada para os líderes" : "Escondida dos líderes"}</strong>
                        <small>
                          {ativo
                            ? "Os líderes de célula veem esta lição em Lições assim que você salvar."
                            : "Fica salva, mas os líderes não veem. Use enquanto ainda está montando."}
                        </small>
                      </span>
                    </label>
                  </section>

                  <section className="ec-secao" aria-labelledby="ec-licao-conteudo">
                    <div className="ec-secao__cabecalho">
                      <h3 id="ec-licao-conteudo" className="ec-secao__titulo">
                        <span className="ec-secao__num">2</span> Material da lição
                      </h3>
                      <span className="ec-resumo">
                        {blocos.length} {blocos.length === 1 ? "conteúdo" : "conteúdos"}
                      </span>
                    </div>
                    <p className="ec-dica">
                      O líder vê nesta ordem. Arraste pela alça <Icone nome="arrastar" tamanho={13} /> para reorganizar.
                    </p>
                    <EditorBlocos
                      blocos={blocos}
                      onChange={(novos) => {
                        setBlocos(novos);
                        mudou();
                      }}
                      tiposDisponiveis={tipos.filter((t) => t.tipo_campo !== "quiz")}
                      quem="o líder"
                      onIndisponivel={() => avisar("Esse tipo de conteúdo não está disponível.", "error")}
                    />
                  </section>
                </div>

                <div className="ec-editor__rodape">
                  {erro ? (
                    <p className="ec-erro" role="alert">
                      <Icone nome="alerta" tamanho={16} /> {erro}
                    </p>
                  ) : (
                    <p className="ec-rodape-info">
                      {blocos.length
                        ? `${blocos.length} ${blocos.length === 1 ? "conteúdo" : "conteúdos"} · ${ativo ? "liberada" : "escondida"}`
                        : "Adicione pelo menos um conteúdo para salvar."}
                    </p>
                  )}
                  <div className="ec-editor__botoes">
                    <button type="button" className="ec-btn ec-btn--fantasma" onClick={pedirFechar} disabled={acaoSalvar.executando}>
                      Cancelar
                    </button>
                    <BotaoCarregando
                      type="submit"
                      className="ec-btn ec-btn--primario"
                      carregando={acaoSalvar.executando}
                      textoCarregando={idEditando ? "Salvando…" : "Criando…"}
                    >
                      {idEditando ? "Salvar alterações" : "Criar lição"}
                    </BotaoCarregando>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </FocusTrapComponent>,
        document.body
      )
    : null;

  const licoesVisiveis = filtrarItens(licoes, busca, filtro, (l) => l.titulo, isAtivo);
  const liberadas = licoes.filter(isAtivo).length;

  return (
    <>
      <PaginaSecretaria
        area="Secretaria das Células"
        titulo="Lições"
        icone="livro"
        descricao="O material das reuniões de célula. Os líderes veem as lições liberadas e usam na reunião: vídeo, ensino, perguntas e arquivos de apoio."
        acao={{ rotulo: "Nova lição", onClick: abrirNova }}
        numeros={[
          { valor: licoes.length, rotulo: licoes.length === 1 ? "lição" : "lições" },
          { valor: liberadas, rotulo: liberadas === 1 ? "liberada" : "liberadas" },
          { valor: licoes.length - liberadas, rotulo: "escondidas" },
        ]}
      >
        <div className="sc-corpo">
          <ListaSecretaria
            titulo="Lições"
            total={licoes.length}
            busca={busca}
            onBusca={setBusca}
            filtro={filtro}
            onFiltro={setFiltro}
            placeholderBusca="Buscar lição pelo título"
            vazio={loading ? "Carregando…" : licoes.length ? "Nenhuma lição com esse filtro." : "Nenhuma lição ainda. Crie a primeira no botão Nova lição."}
            quantidadeVisivel={licoesVisiveis.length}
          >
            {licoesVisiveis.map((l) => (
              <ItemSecretaria
                key={l.id_licao}
                titulo={l.titulo}
                meta={`${qtd(l)} ${qtd(l) === 1 ? "conteúdo" : "conteúdos"}`}
                ativo={isAtivo(l)}
                selecionado={selecionada?.id_licao === l.id_licao}
                icone="livro"
                onSelecionar={() => setSelecionada(l)}
                onAlternar={() => alternar(l)}
              />
            ))}
          </ListaSecretaria>

          {selecionada ? (
            <DetalheSecretaria
              titulo={selecionada.titulo}
              ativo={isAtivo(selecionada)}
              status={isAtivo(selecionada) ? "Liberada para os líderes" : "Escondida dos líderes"}
              acoes={
                <>
                  <button type="button" className="sc-btn sc-btn--primario" onClick={() => abrirEdicao(selecionada.id_licao)}>
                    <Icone nome="editar" tamanho={15} /> Editar lição
                  </button>
                  <button
                    type="button"
                    className="sc-btn sc-btn--perigo"
                    onClick={() => setParaExcluir(selecionada)}
                    aria-label={`Excluir a lição ${selecionada.titulo}`}
                    title="Excluir lição"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </>
              }
            >
              {selecionada.descricao && (
                <p className="sc-descricao">
                  <strong>Resumo para o líder</strong>
                  {selecionada.descricao}
                </p>
              )}
              <div className="ec-numeros">
                <div>
                  <strong>{qtd(selecionada)}</strong>
                  <span>{qtd(selecionada) === 1 ? "conteúdo" : "conteúdos"}</span>
                </div>
                <div>
                  <strong>{(selecionada.campos || []).filter((c) => (c.tipo_campo || tipoPorId(c.id_campo)) === "video").length}</strong>
                  <span>vídeos</span>
                </div>
                <div>
                  <strong className="ec-numeros__texto">{isAtivo(selecionada) ? "Liberada" : "Escondida"}</strong>
                  <span>para os líderes</span>
                </div>
              </div>
              <p className="ec-lembrete">
                <Icone nome="alerta" tamanho={15} />
                {isAtivo(selecionada)
                  ? "Os líderes de célula veem esta lição em Lições, na ordem abaixo."
                  : "Escondida: os líderes não veem. Ative pelo botão da lista ou em Editar."}
              </p>


              <h3 className="sc-subtitulo">
                <Icone nome="olho" tamanho={17} /> Como o líder vê
              </h3>
              {qtd(selecionada) > 0 ? (
              <ol className="ec-previa">
                {(selecionada.campos || []).map((c, i) => (
                  <li key={i} className="campo-card campo-card--pergunta">
                    <span className="ec-selo ec-selo--pergunta">
                      {i + 1}. {nomeDoTipo(String(c.tipo_campo || tipoPorId(c.id_campo) || ""))}
                    </span>
                    <div className="campo-label">{c.label || "Sem título"}</div>
                    <div className="campo-conteudo">
                      <ConteudoNoPainel valor={c.conteudo} />
                    </div>
                  </li>
                ))}
              </ol>
              ) : (
                <p className="sc-vazio-conteudo">Esta lição ainda não tem conteúdo. Clique em Editar lição para montar o material.</p>
              )}
            </DetalheSecretaria>
          ) : (
            <DetalheVazio
              icone="livro"
              texto={licoes.length ? "Escolha uma lição na lista para ver o material." : "Ainda não há lições. Crie a primeira para os líderes usarem na célula."}
              acao={{ rotulo: "Nova lição", onClick: abrirNova }}
            />
          )}
        </div>
      </PaginaSecretaria>

      {editor}

      <ConfirmModal
        open={confirmarDescarte}
        title="Descartar alterações?"
        message="Você mudou esta lição e ainda não salvou. Se sair agora, as mudanças se perdem."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        variant="danger"
        onConfirm={fechar}
        onCancel={() => setConfirmarDescarte(false)}
      />
      <ConfirmModal
        open={!!paraExcluir}
        title="Excluir lição"
        message={`Excluir "${paraExcluir?.titulo ?? ""}"? Ela some para os líderes e não tem volta. Para só esconder, deixe a lição Inativa.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={excluir}
        textoCarregando="Excluindo…"
        onCancel={() => setParaExcluir(null)}
      />
      {aviso && <Toast message={aviso.texto} onClose={() => setAviso(null)} variant={aviso.tipo} />}
    </>
  );
};

export default LicoesSecretariaAdmin;
