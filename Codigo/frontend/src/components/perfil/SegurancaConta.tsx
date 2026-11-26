import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import CampoSenha from "../ui/CampoSenha";
import ConfirmModal from "../ui/ConfirmModal";
import Icone from "../ui/Icone";
import segurancaService, {
  ConfiguracaoDoisFatores, EventoSeguranca, SessaoAberta, StatusDoisFatores,
} from "../../services/segurancaService";
import { getErrorMessage } from "../../utils/errorUtils";
import { detalheEvento, formatarDataHora, rotuloEvento, tempoRelativo } from "../../utils/eventosSeguranca";

interface Props {
  /** Mensagem rápida na tela (Toast do Perfil) */
  avisar: (mensagem: string, tipo: "success" | "error" | "info") => void;
}

type Etapa2fa = "parado" | "configurando" | "codigos" | "desativando" | "renovando";
type Confirmacao = { titulo: string; mensagem: string; rotulo: string; perigo?: boolean; acao: () => Promise<void> };

/** Chave em blocos de 4 para digitar no app sem errar */
const emBlocos = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();
const ATIVIDADE_INICIAL = 6;

/**
 * Perfil → três cartões de segurança: verificação em duas etapas, aparelhos conectados e atividade recente.
 * Os ids (duas-etapas, aparelhos, atividade) são os destinos do menu lateral do Perfil.
 */
const SegurancaConta: React.FC<Props> = ({ avisar }) => {
  const idBase = useId();
  const [status, setStatus] = useState<StatusDoisFatores | null>(null);
  const [sessoes, setSessoes] = useState<SessaoAberta[]>([]);
  const [acessos, setAcessos] = useState<EventoSeguranca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [verTudo, setVerTudo] = useState(false);

  const [etapa, setEtapa] = useState<Etapa2fa>("parado");
  const [config, setConfig] = useState<ConfiguracaoDoisFatores | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [codigosNovos, setCodigosNovos] = useState<string[]>([]);
  const [guardou, setGuardou] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro2fa, setErro2fa] = useState("");
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);
  const tituloCodigos = useRef<HTMLHeadingElement>(null);

  const carregar = useCallback(async () => {
    try {
      const [st, ss, ac] = await Promise.all([
        segurancaService.statusDoisFatores(),
        segurancaService.minhasSessoes(),
        segurancaService.meusAcessos(),
      ]);
      setStatus(st);
      setSessoes(ss);
      setAcessos(ac);
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível carregar a segurança da conta"), "error");
    } finally {
      setCarregando(false);
    }
  }, [avisar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (etapa === "configurando" || etapa === "desativando" || etapa === "renovando") campoCodigo.current?.focus();
    if (etapa === "codigos") tituloCodigos.current?.focus();
  }, [etapa]);

  const limparFormulario = () => {
    setCodigo("");
    setSenha("");
    setErro2fa("");
  };

  const cancelar = () => {
    limparFormulario();
    setConfig(null);
    setEtapa("parado");
  };

  const comecar = async () => {
    setOcupado(true);
    try {
      setConfig(await segurancaService.iniciarDoisFatores());
      limparFormulario();
      setEtapa("configurando");
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível começar a configuração"), "error");
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro2fa("");
    setOcupado(true);
    try {
      if (etapa === "configurando") {
        const r = await segurancaService.ativarDoisFatores(codigo);
        setCodigosNovos(r.codigos_recuperacao);
        setGuardou(false);
        setConfig(null);
        setEtapa("codigos");
        avisar("Verificação em duas etapas ativada. Os outros aparelhos foram desconectados.", "success");
      } else if (etapa === "renovando") {
        const r = await segurancaService.novosCodigosRecuperacao(codigo);
        setCodigosNovos(r.codigos_recuperacao);
        setGuardou(false);
        setEtapa("codigos");
      } else if (etapa === "desativando") {
        await segurancaService.desativarDoisFatores(senha, codigo);
        setEtapa("parado");
        avisar("Verificação em duas etapas desativada.", "info");
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      setErro2fa(getErrorMessage(err, "Código incorreto"));
      setCodigo("");
      campoCodigo.current?.focus();
    } finally {
      setOcupado(false);
    }
  };

  const copiarCodigos = async () => {
    try {
      await navigator.clipboard.writeText(codigosNovos.join("\n"));
      avisar("Códigos copiados", "success");
    } catch {
      avisar("Não foi possível copiar. Anote os códigos.", "error");
    }
  };

  const baixarCodigos = () => {
    const texto =
      "Casa dos Discípulos — códigos de recuperação\n" +
      "Cada código vale uma vez. Use se perder o celular com o aplicativo autenticador.\n\n" +
      codigosNovos.join("\n") + "\n";
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "codigos-recuperacao-casa-dos-discipulos.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pedirEncerrar = (s: SessaoAberta) =>
    setConfirmacao({
      titulo: s.atual ? "Sair deste aparelho?" : "Desconectar aparelho?",
      mensagem: s.atual
        ? "Você vai sair da conta agora e precisará entrar de novo."
        : `${s.dispositivo || "Esse aparelho"} sai da sua conta na hora. Se não reconhece esse acesso, troque também sua senha.`,
      rotulo: s.atual ? "Sair" : "Desconectar",
      perigo: true,
      acao: async () => {
        await segurancaService.encerrarMinhaSessao(s.referencia);
        if (s.atual) {
          window.location.assign("/login");
          return;
        }
        setSessoes((lista) => lista.filter((x) => x.referencia !== s.referencia));
        avisar(`${s.dispositivo || "Aparelho"} desconectado`, "success");
      },
    });

  const pedirEncerrarOutras = () =>
    setConfirmacao({
      titulo: "Sair dos outros aparelhos?",
      mensagem: "Todos os aparelhos, menos este, saem da sua conta agora.",
      rotulo: "Sair dos outros",
      perigo: true,
      acao: async () => {
        const r = await segurancaService.encerrarOutrasSessoes();
        avisar(r.message, "success");
        await carregar();
      },
    });

  const outras = sessoes.filter((s) => !s.atual).length;
  const pedeCodigo = etapa === "configurando" || etapa === "desativando" || etapa === "renovando";
  const atividade = verTudo ? acessos : acessos.slice(0, ATIVIDADE_INICIAL);

  const topo = (icone: Parameters<typeof Icone>[0]["nome"], titulo: string, texto: string, idTitulo: string, extra?: React.ReactNode) => (
    <header className="pf-cartao__topo">
      <span className="pf-cartao__icone" aria-hidden><Icone nome={icone} tamanho={20} /></span>
      <div className="pf-cartao__titulos">
        <h2 id={idTitulo}>{titulo}</h2>
        <p>{texto}</p>
      </div>
      {extra}
    </header>
  );

  return (
    <>
      {/* ---------- Verificação em duas etapas ---------- */}
      <section id="duas-etapas" className="pf-cartao" aria-labelledby={`${idBase}-2fa`}>
        {topo(
          "escudo",
          "Verificação em duas etapas",
          "Além da senha, um código do seu celular a cada entrada.",
          `${idBase}-2fa`,
          !carregando && (
            <span className={`pf-estado ${status?.ativo ? "pf-estado--ok" : ""}`}>
              <span className="pf-estado__ponto" aria-hidden />
              {status?.ativo ? "Ativa" : "Desligada"}
            </span>
          )
        )}

        {carregando && <p className="pf-texto" role="status">Carregando…</p>}

        {!carregando && etapa === "parado" && !status?.ativo && (
          <div className="pf-destaque">
            <div>
              <p className="pf-destaque__titulo">Proteja sua conta mesmo se alguém descobrir sua senha</p>
              <p className="pf-texto">
                Você usa um aplicativo gratuito no celular (Google Authenticator, Microsoft Authenticator ou Authy)
                que mostra um código novo a cada 30 segundos. Leva 2 minutos para configurar.
              </p>
            </div>
            <button type="button" className="sc-btn sc-btn--primario" onClick={comecar} disabled={ocupado} aria-busy={ocupado}>
              Ativar agora
            </button>
          </div>
        )}

        {!carregando && etapa === "parado" && status?.ativo && (
          <>
            <p className="pf-texto">
              Sua conta pede o código do aplicativo a cada entrada.{" "}
              {status.codigos_restantes > 0
                ? <>Você tem <strong>{status.codigos_restantes}</strong> código(s) de recuperação para usar se perder o celular.</>
                : "Você não tem mais códigos de recuperação: gere novos."}
            </p>
            {status.codigos_restantes <= 2 && (
              <p className="pf-alerta" role="note">
                <Icone nome="alerta" tamanho={16} /> Poucos códigos de recuperação. Gere novos e guarde em lugar seguro.
              </p>
            )}
            <div className="pf-acoes pf-acoes--inicio">
              <button type="button" className="sc-btn sc-btn--contorno" onClick={() => { limparFormulario(); setEtapa("renovando"); }}>
                Gerar novos códigos de recuperação
              </button>
              <button type="button" className="sc-btn sc-btn--perigo" onClick={() => { limparFormulario(); setEtapa("desativando"); }}>
                Desativar
              </button>
            </div>
          </>
        )}

        {etapa === "configurando" && config && (
          <div className="pf-config">
            <ol className="pf-passos">
              <li>
                <span className="pf-passos__num" aria-hidden>1</span>
                <div>
                  <strong>Instale o aplicativo</strong>
                  <p className="pf-texto">Google Authenticator, Microsoft Authenticator ou Authy (grátis na loja do celular).</p>
                </div>
              </li>
              <li>
                <span className="pf-passos__num" aria-hidden>2</span>
                <div>
                  <strong>Leia o QR code</strong>
                  <p className="pf-texto">No aplicativo, toque em <em>adicionar conta</em> e aponte a câmera.</p>
                  <details className="pf-chave">
                    <summary>Não consegue ler? Digite a chave</summary>
                    <code aria-label="Chave para digitar no aplicativo">{emBlocos(config.segredo)}</code>
                  </details>
                </div>
              </li>
              <li>
                <span className="pf-passos__num" aria-hidden>3</span>
                <div>
                  <strong>Digite o código de 6 dígitos</strong>
                  <p className="pf-texto">O que aparece no aplicativo agora, logo abaixo.</p>
                </div>
              </li>
            </ol>
            <div className="pf-qr">
              <img src={config.qrcode} alt="QR code para configurar o aplicativo autenticador" width={196} height={196} />
            </div>
          </div>
        )}

        {etapa === "codigos" && (
          <div className="pf-codigos">
            <h3 ref={tituloCodigos} tabIndex={-1}>Guarde seus códigos de recuperação</h3>
            <p className="pf-texto">
              Se perder o celular, cada código abaixo permite entrar <strong>uma vez</strong>. Eles não aparecem de
              novo: baixe, imprima ou anote, e guarde longe do celular.
            </p>
            <ul className="pf-codigos__lista" aria-label="Códigos de recuperação">
              {codigosNovos.map((c) => <li key={c}><code>{c}</code></li>)}
            </ul>
            <div className="pf-acoes pf-acoes--inicio">
              <button type="button" className="sc-btn sc-btn--contorno" onClick={baixarCodigos}>Baixar (.txt)</button>
              <button type="button" className="sc-btn sc-btn--contorno" onClick={copiarCodigos}>Copiar</button>
            </div>
            <label className="pf-check">
              <input type="checkbox" checked={guardou} onChange={(e) => setGuardou(e.target.checked)} />
              Guardei os códigos em lugar seguro
            </label>
            <div className="pf-acoes pf-acoes--inicio">
              <button
                type="button"
                className="sc-btn sc-btn--primario"
                disabled={!guardou}
                onClick={() => { setCodigosNovos([]); setEtapa("parado"); }}
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {pedeCodigo && (
          <form className="pf-form pf-form--compacto" onSubmit={confirmar} noValidate>
            {etapa === "desativando" && (
              <div className="pf-campo">
                <label htmlFor={`${idBase}-senha`}>Sua senha</label>
                <CampoSenha id={`${idBase}-senha`} value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
              </div>
            )}
            <div className="pf-campo">
              <label htmlFor={`${idBase}-codigo`}>
                {etapa === "configurando" ? "Código do aplicativo" : "Código do aplicativo ou de recuperação"}
              </label>
              <input
                ref={campoCodigo}
                id={`${idBase}-codigo`}
                className="pf-codigo"
                value={codigo}
                onChange={(e) =>
                  setCodigo(etapa === "configurando" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 12))
                }
                inputMode={etapa === "configurando" ? "numeric" : "text"}
                autoComplete="one-time-code"
                placeholder="000000"
                aria-invalid={erro2fa ? true : undefined}
                aria-describedby={erro2fa ? `${idBase}-erro` : undefined}
              />
              {erro2fa && <p id={`${idBase}-erro`} className="pf-campo__erro" role="alert">{erro2fa}</p>}
            </div>
            <div className="pf-acoes pf-acoes--inicio">
              <button
                type="submit"
                className={`sc-btn ${etapa === "desativando" ? "pf-btn-perigo" : "sc-btn--primario"}`}
                disabled={ocupado || !codigo || (etapa === "desativando" && !senha)}
                aria-busy={ocupado}
              >
                {etapa === "configurando" ? "Ativar" : etapa === "desativando" ? "Desativar" : "Gerar códigos"}
              </button>
              <button type="button" className="sc-btn sc-btn--contorno" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        )}
      </section>

      {/* ---------- Aparelhos conectados ---------- */}
      <section id="aparelhos" className="pf-cartao" aria-labelledby={`${idBase}-aparelhos`}>
        {topo(
          "celular",
          "Aparelhos conectados",
          "Onde sua conta está aberta. Por segurança, ela sai sozinha após 1 hora sem uso.",
          `${idBase}-aparelhos`
        )}
        {!carregando && (
          <ul className="pf-lista">
            {sessoes.map((s) => (
              <li key={s.referencia} className="pf-linha">
                <span className={`pf-linha__icone${s.atual ? " pf-linha__icone--atual" : ""}`} aria-hidden>
                  <Icone nome={/iPhone|Android|iPad/.test(s.dispositivo || "") ? "celular" : "projecao"} tamanho={18} />
                </span>
                <div className="pf-linha__info">
                  <span className="pf-linha__titulo">
                    {s.dispositivo || "Aparelho"}
                    {s.atual && <span className="pf-chip pf-chip--teal">Este aparelho</span>}
                  </span>
                  <span className="pf-linha__meta">
                    {s.atual ? "Em uso agora" : `Último uso ${tempoRelativo(s.ultimo_uso)}`} · entrou em {formatarDataHora(s.criada_em)}
                    {s.ip ? ` · IP ${s.ip}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="sc-btn sc-btn--contorno"
                  onClick={() => pedirEncerrar(s)}
                  aria-label={`${s.atual ? "Sair deste aparelho" : "Desconectar"} ${s.dispositivo || ""}`.trim()}
                >
                  {s.atual ? "Sair" : "Desconectar"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {outras > 0 && (
          <footer className="pf-cartao__rodape">
            <p className="pf-pendente pf-pendente--neutro">Não reconhece algum? Desconecte e troque sua senha.</p>
            <div className="pf-acoes">
              <button type="button" className="sc-btn sc-btn--perigo" onClick={pedirEncerrarOutras}>
                Sair dos outros aparelhos ({outras})
              </button>
            </div>
          </footer>
        )}
      </section>

      {/* ---------- Atividade recente ---------- */}
      <section id="atividade" className="pf-cartao" aria-labelledby={`${idBase}-atividade`}>
        {topo("historico", "Atividade recente", "Entradas e mudanças importantes na sua conta.", `${idBase}-atividade`)}
        {!carregando && acessos.length === 0 && <p className="pf-texto">Nenhuma atividade registrada ainda.</p>}
        {acessos.length > 0 && (
          <ol className="pf-linha-tempo">
            {atividade.map((a) => {
              const detalhe = detalheEvento(a);
              const problema = a.resultado !== "sucesso";
              return (
                <li key={a.id_log} className={problema ? "pf-linha-tempo__item pf-linha-tempo__item--alerta" : "pf-linha-tempo__item"}>
                  <span className="pf-linha-tempo__marca" aria-hidden />
                  <div className="pf-linha__info">
                    <span className="pf-linha__titulo">
                      {rotuloEvento(a)}
                      {problema && <span className="pf-chip pf-chip--alerta">{a.resultado === "bloqueado" ? "Bloqueado" : "Recusado"}</span>}
                    </span>
                    <span className="pf-linha__meta">
                      <time dateTime={a.criado_em}>{formatarDataHora(a.criado_em)}</time> · {a.dispositivo}
                      {a.ip ? ` · IP ${a.ip}` : ""}
                      {detalhe ? ` · ${detalhe}` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {acessos.length > ATIVIDADE_INICIAL && (
          <div className="pf-acoes pf-acoes--inicio">
            <button type="button" className="pf-link" onClick={() => setVerTudo((v) => !v)} aria-expanded={verTudo}>
              {verTudo ? "Mostrar menos" : `Ver tudo (${acessos.length})`}
            </button>
          </div>
        )}
      </section>

      <ConfirmModal
        open={!!confirmacao}
        title={confirmacao?.titulo || ""}
        message={confirmacao?.mensagem || ""}
        confirmLabel={confirmacao?.rotulo}
        variant={confirmacao?.perigo ? "danger" : "default"}
        textoCarregando="Desconectando…"
        onCancel={() => setConfirmacao(null)}
        onConfirm={async () => {
          if (!confirmacao) return;
          try {
            await confirmacao.acao();
          } catch (err) {
            avisar(getErrorMessage(err, "Não foi possível desconectar"), "error");
          } finally {
            setConfirmacao(null);
          }
        }}
      />
    </>
  );
};

export default SegurancaConta;
