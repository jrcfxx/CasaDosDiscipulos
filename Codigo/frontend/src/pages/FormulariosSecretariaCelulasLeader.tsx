import React, { useEffect, useState } from "react";
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
import formularioService, { type FormularioCampo } from "../services/formularioService";
import celulaService from "../services/celulaService";
import formularioRespostaService from "../services/formularioRespostaService";
import authService from "../services/authService";
import TextField from "../components/fields/TextField";
import TextareaField from "../components/fields/TextareaField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";
import { ASSETS_BASE } from "../config/api";
import { valorUpload, type ValorCampo } from "../types/campoConteudo";
import RelatorioFormulario from "../components/formularios/RelatorioFormulario";
import BotoesExportar from "../components/ui/BotoesExportar";
import Toast from "../components/ui/Toast";
import { exportarRespostasFormulario } from "../utils/exportacoes";
import Icone from "../components/ui/Icone";

type Formulario = {
  id_formulario: number;
  titulo: string;
  descricao?: string | null;
  ativo: boolean;
  /** semanal, quinzenal, mensal, bimestral (ou vazio) */
  frequencia?: string | null;
  campos?: FormularioCampo[];
};

type Resposta = {
  uid: number;
  id_formulario_campo: number;
  tipo: string;
  label: string;
  conteudo: ValorCampo;
  obrigatorio: boolean;
};

type Celula = { id_celula: number; nome: string };

const FREQUENCIA: Record<string, string> = {
  semanal: "toda semana",
  quinzenal: "a cada 15 dias",
  mensal: "todo mês",
  bimestral: "a cada 2 meses",
};

const vazio = (v: ValorCampo) => v == null || String(v).trim() === "";

const urlArquivo = (v: ValorCampo) => {
  const s = String(v);
  return s.startsWith("http") ? s : `${ASSETS_BASE}${s}`;
};

/** Formulários da célula: o líder envia o relatório e acompanha o que já foi enviado */
export default function FormulariosSecretariaCelulasLeader() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [celulas, setCelulas] = useState<Celula[]>([]);
  const [selecionado, setSelecionado] = useState<Formulario | null>(null);
  const [celula, setCelula] = useState<number | null>(null);
  const [aba, setAba] = useState<"preencher" | "relatorio">("preencher");
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviadoEm, setEnviadoEm] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const idUsuario = authService.getUser()?.id_usuario;
        const [lista, minhas] = await Promise.all([
          formularioService.getAll(),
          idUsuario ? celulaService.getByLider(idUsuario) : celulaService.getAtivas(),
        ]);
        const forms = (lista || []).map((f) => ({ ...f, ativo: f.ativo === 1 || f.ativo === true })) as Formulario[];
        setFormularios(forms);
        setCelulas(minhas);
        setSelecionado(forms.find((f) => f.ativo) ?? forms[0] ?? null);
        if (minhas.length > 0) setCelula(minhas[0].id_celula);
      } catch {
        setToast("Erro ao carregar os formulários. Recarregue a página.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setRespostas(
      (selecionado?.campos ?? []).map((c, i) => ({
        uid: i,
        id_formulario_campo: c.id ?? c.id_campo ?? i,
        tipo: c.tipo_campo || "texto",
        label: c.label || `Pergunta ${i + 1}`,
        conteudo: "",
        obrigatorio: Boolean(c.obrigatorio),
      }))
    );
    setTentouEnviar(false);
    setEnviadoEm(null);
  }, [selecionado]);

  const mudar = (uid: number, v: ValorCampo) => setRespostas((rs) => rs.map((r) => (r.uid === uid ? { ...r, conteudo: v } : r)));

  const faltando = respostas.filter((r) => r.obrigatorio && vazio(r.conteudo));
  const respondidas = respostas.filter((r) => !vazio(r.conteudo)).length;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selecionado) return;
    setTentouEnviar(true);
    if (celula === null) {
      setToast("Erro: escolha a célula deste relatório.");
      document.getElementById("su-celula")?.focus();
      return;
    }
    if (faltando.length > 0) {
      setToast(`Erro: faltam ${faltando.length} ${faltando.length === 1 ? "pergunta obrigatória" : "perguntas obrigatórias"}.`);
      document.getElementById(`campo_${faltando[0].uid}`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      await formularioRespostaService.criar({
        id_formulario: selecionado.id_formulario,
        id_celula: celula,
        campos: respostas.map((r) => ({ id_formulario_campo: r.id_formulario_campo, resposta: String(r.conteudo ?? "") })),
      });
      setRespostas((rs) => rs.map((r) => ({ ...r, conteudo: "" })));
      setTentouEnviar(false);
      setEnviadoEm(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setToast("Relatório enviado. Obrigado!");
    } catch {
      setToast("Erro ao enviar. Confira sua conexão e tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  const campo = (r: Resposta) => {
    const comum = {
      id: `campo_${r.uid}`,
      name: `campo_${r.uid}`,
      label: "",
      onChange: (v: ValorCampo) => mudar(r.uid, v),
    };
    switch (r.tipo) {
      case "textarea":
        return <TextareaField {...comum} placeholder="Escreva sua resposta" value={r.conteudo} rows={4} />;
      case "numero":
        return <NumberField {...comum} placeholder="0" value={r.conteudo} />;
      case "data":
        return <DateField {...comum} value={r.conteudo} />;
      case "link":
        return <LinkField {...comum} placeholder="https://" value={r.conteudo} />;
      case "upload":
        return (
          <>
            <UploadField {...comum} value={valorUpload(r.conteudo)} />
            {!vazio(r.conteudo) && (
              <div className="upload-preview-campo">
                <a href={urlArquivo(r.conteudo)} target="_blank" rel="noopener noreferrer">
                  <Icone nome="arquivo" tamanho={16} /> {String(r.conteudo).split("/").pop()}
                </a>
              </div>
            )}
          </>
        );
      case "video":
        return (
          <>
            <VideoField {...comum} value={r.conteudo} />
            {!vazio(r.conteudo) && (
              <div className="video-preview-campo">
                <video controls src={urlArquivo(r.conteudo)} aria-label="Vídeo enviado">
                  <track kind="captions" srcLang="pt-BR" label="Legendas" />
                </video>
              </div>
            )}
          </>
        );
      default:
        return <TextField {...comum} placeholder="Sua resposta" value={r.conteudo} />;
    }
  };

  /** Setas esquerda/direita alternam entre as duas abas (padrão de abas acessíveis) */
  const trocarAbaPorSeta = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const nova = aba === "preencher" ? "relatorio" : "preencher";
    setAba(nova);
    document.getElementById(`su-aba-${nova}`)?.focus();
  };

  const visiveis = filtrarItens(formularios, busca, "todos", (f) => f.titulo, () => true);
  const ativos = formularios.filter((f) => f.ativo).length;

  return (
    <PaginaSecretaria
      area="Secretaria das Células"
      titulo="Formulários"
      icone="lista"
      descricao="Os relatórios da sua célula. Escolha o formulário, preencha e envie; na aba Relatório você vê o que já foi enviado em cada período."
      abas={abasDoUsuario(true)}
      rotuloAbas="Minhas áreas"
      numeros={[
        { valor: ativos, rotulo: ativos === 1 ? "formulário aberto" : "formulários abertos" },
        { valor: celulas.length, rotulo: celulas.length === 1 ? "célula sua" : "células suas" },
      ]}
    >
      <div className="sc-corpo">
        <ListaSecretaria
          titulo="Formulários"
          total={formularios.length}
          busca={busca}
          onBusca={setBusca}
          placeholderBusca="Buscar formulário pelo nome"
          vazio={loading ? "Carregando…" : formularios.length ? "Nenhum formulário com esse nome." : "Ainda não há formulários para preencher."}
          quantidadeVisivel={visiveis.length}
        >
          {visiveis.map((f) => {
            const n = f.campos?.length || 0;
            return (
              <ItemSecretaria
                key={f.id_formulario}
                titulo={f.titulo}
                meta={`${n} ${n === 1 ? "pergunta" : "perguntas"}${f.frequencia && FREQUENCIA[f.frequencia] ? ` · ${FREQUENCIA[f.frequencia]}` : ""}`}
                selo={f.ativo ? undefined : "Fechado"}
                ativo={f.ativo}
                selecionado={selecionado?.id_formulario === f.id_formulario}
                icone="lista"
                onSelecionar={() => setSelecionado(f)}
              />
            );
          })}
        </ListaSecretaria>

        {selecionado ? (
          <DetalheSecretaria
            titulo={selecionado.titulo}
            ativo={selecionado.ativo}
            status={`${selecionado.ativo ? "Aberto para envio" : "Fechado para novos envios"}${
              selecionado.frequencia && FREQUENCIA[selecionado.frequencia] ? ` · enviar ${FREQUENCIA[selecionado.frequencia]}` : ""
            }`}
            acoes={
              aba === "relatorio" ? (
                <BotoesExportar
                  tema="claro"
                  rotuloExcel="Exportar (Excel)"
                  onExcel={async () => {
                    const dados = await formularioRespostaService.exportacao(selecionado.id_formulario);
                    await exportarRespostasFormulario(selecionado.titulo, dados, null, (p) => (p.startsWith("/") ? `${ASSETS_BASE}${p}` : p));
                  }}
                />
              ) : null
            }
          >
            <div className="su-segmento" role="tablist" aria-label="O que fazer com o formulário">
              <button
                type="button"
                role="tab"
                id="su-aba-preencher"
                aria-controls="su-painel"
                aria-selected={aba === "preencher"}
                tabIndex={aba === "preencher" ? 0 : -1}
                onClick={() => setAba("preencher")}
                onKeyDown={trocarAbaPorSeta}
              >
                <Icone nome="editar" tamanho={15} /> Preencher
              </button>
              <button
                type="button"
                role="tab"
                id="su-aba-relatorio"
                aria-controls="su-painel"
                aria-selected={aba === "relatorio"}
                tabIndex={aba === "relatorio" ? 0 : -1}
                onClick={() => setAba("relatorio")}
                onKeyDown={trocarAbaPorSeta}
              >
                <Icone nome="calendario" tamanho={15} /> Relatório das minhas células
              </button>
            </div>

            <div id="su-painel" role="tabpanel" aria-labelledby={aba === "preencher" ? "su-aba-preencher" : "su-aba-relatorio"}>
              {aba === "relatorio" ? (
                <RelatorioFormulario
                  idFormulario={selecionado.id_formulario}
                  frequencia={selecionado.frequencia}
                  titulo={selecionado.titulo}
                />
              ) : !selecionado.ativo ? (
                <p className="ec-lembrete">
                  <Icone nome="cadeado" tamanho={15} />
                  Este formulário está fechado pela secretaria e não recebe novos envios. Veja o que já foi enviado na aba Relatório.
                </p>
              ) : respostas.length === 0 ? (
                <p className="sc-vazio-conteudo">Este formulário ainda não tem perguntas.</p>
              ) : (
                <form className="su-form" onSubmit={enviar} noValidate>
                  {selecionado.descricao && (
                    <p className="sc-descricao">
                      <strong>Como preencher</strong>
                      {selecionado.descricao}
                    </p>
                  )}

                  <div className="su-celula">
                    <label htmlFor="su-celula">
                      Célula<span className="su-pergunta__obrigatoria" aria-hidden> *</span>
                    </label>
                    {celulas.length === 0 ? (
                      <p className="su-pergunta__erro" id="su-celula">
                        Você ainda não está como líder de nenhuma célula. Fale com a secretaria.
                      </p>
                    ) : (
                      <select
                        id="su-celula"
                        value={celula ?? ""}
                        onChange={(e) => setCelula(e.target.value ? Number(e.target.value) : null)}
                        required
                        aria-invalid={tentouEnviar && celula === null}
                      >
                        <option value="">Escolha a célula</option>
                        {celulas.map((c) => (
                          <option key={c.id_celula} value={c.id_celula}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <ol className="su-perguntas">
                    {respostas.map((r, i) => {
                      const erro = tentouEnviar && r.obrigatorio && vazio(r.conteudo);
                      return (
                        <li key={r.uid} className={`su-pergunta${erro ? " su-pergunta--erro" : ""}`}>
                          <span className="su-pergunta__numero" aria-hidden>
                            {i + 1}
                          </span>
                          <div className="su-pergunta__corpo">
                            <label className="su-pergunta__rotulo" htmlFor={`campo_${r.uid}`}>
                              {r.label}
                              {r.obrigatorio && (
                                <>
                                  <span className="su-pergunta__obrigatoria" aria-hidden>
                                    {" "}
                                    *
                                  </span>
                                  <span className="sr-only"> (obrigatória)</span>
                                </>
                              )}
                            </label>
                            <div className="su-campo">{campo(r)}</div>
                            {erro && (
                              <p className="su-pergunta__erro" role="alert">
                                Responda esta pergunta para enviar.
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="su-enviar">
                    {enviadoEm ? (
                      <p className="su-enviar__info su-enviar__info--ok" role="status">
                        <Icone nome="concluido" tamanho={16} /> Enviado às {enviadoEm}. Pode enviar outro se precisar.
                      </p>
                    ) : (
                      <p className="su-enviar__info">
                        {respondidas} de {respostas.length} respondidas
                        {respostas.some((r) => r.obrigatorio) ? " · * obrigatória" : ""}
                      </p>
                    )}
                    <button type="submit" className="sc-btn sc-btn--primario" disabled={enviando || celulas.length === 0} aria-busy={enviando}>
                      {enviando ? (
                        <>
                          <span className="btn-spinner" aria-hidden /> Enviando…
                        </>
                      ) : (
                        <>
                          <Icone nome="proximo" tamanho={15} /> Enviar relatório
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </DetalheSecretaria>
        ) : (
          <DetalheVazio icone="lista" texto={loading ? "Carregando formulários…" : "Escolha um formulário na lista."} />
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} variant={toast.startsWith("Erro") ? "error" : "success"} />}
    </PaginaSecretaria>
  );
}
