import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import CampoSenha from "../ui/CampoSenha";
import segurancaService, {
  ConfiguracaoDoisFatores, EventoSeguranca, SessaoAberta, StatusDoisFatores,
} from "../../services/segurancaService";
import { getErrorMessage } from "../../utils/errorUtils";
import { detalheEvento, formatarDataHora, rotuloEvento, tempoRelativo } from "../../utils/eventosSeguranca";
import "../../style/segurancaConta.css";

interface Props {
  /** Mensagem rápida na tela (Toast do Perfil) */
  avisar: (mensagem: string, tipo: "success" | "error" | "info") => void;
}

type Etapa2fa = "parado" | "configurando" | "codigos" | "desativando" | "renovando";

/** Chave em blocos de 4 para digitar no app sem errar */
const emBlocos = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();

/**
 * Perfil → Segurança: verificação em duas etapas, aparelhos conectados e atividade recente da conta.
 */
const SegurancaConta: React.FC<Props> = ({ avisar }) => {
  const idBase = useId();
  const [status, setStatus] = useState<StatusDoisFatores | null>(null);
  const [sessoes, setSessoes] = useState<SessaoAberta[]>([]);
  const [acessos, setAcessos] = useState<EventoSeguranca[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [etapa, setEtapa] = useState<Etapa2fa>("parado");
  const [config, setConfig] = useState<ConfiguracaoDoisFatores | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [codigosNovos, setCodigosNovos] = useState<string[]>([]);
  const [guardou, setGuardou] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro2fa, setErro2fa] = useState("");
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

  const encerrar = async (s: SessaoAberta) => {
    if (s.atual && !window.confirm("Encerrar este aparelho? Você vai sair da conta agora.")) return;
    try {
      await segurancaService.encerrarMinhaSessao(s.referencia);
      if (s.atual) {
        window.location.assign("/login");
        return;
      }
      setSessoes((lista) => lista.filter((x) => x.referencia !== s.referencia));
      avisar(`${s.dispositivo || "Aparelho"} desconectado`, "success");
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível encerrar"), "error");
    }
  };

  const encerrarOutras = async () => {
    if (!window.confirm("Sair da conta em todos os outros aparelhos?")) return;
    try {
      const r = await segurancaService.encerrarOutrasSessoes();
      avisar(r.message, "success");
      await carregar();
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível encerrar"), "error");
    }
  };

  if (carregando) {
    return (
      <section className="perfil-card sg" aria-labelledby={`${idBase}-titulo`}>
        <h2 id={`${idBase}-titulo`} className="sg-titulo">Segurança da conta</h2>
        <p className="sg-texto" role="status">Carregando…</p>
      </section>
    );
  }

  const outras = sessoes.filter((s) => !s.atual).length;
  const pedeCodigo = etapa === "configurando" || etapa === "desativando" || etapa === "renovando";

  return (
    <section className="perfil-card sg" aria-labelledby={`${idBase}-titulo`}>
      <h2 id={`${idBase}-titulo`} className="sg-titulo">Segurança da conta</h2>

      {/* ---------- Verificação em duas etapas ---------- */}
      <div className="sg-bloco">
        <div className="sg-bloco__topo">
          <h3 className="sg-subtitulo">Verificação em duas etapas</h3>
          <span className={`sg-selo ${status?.ativo ? "sg-selo--ok" : "sg-selo--off"}`}>
            {status?.ativo ? "Ativa" : "Desligada"}
          </span>
        </div>

        {etapa === "parado" && !status?.ativo && (
          <>
            <p className="sg-texto">
              Além da senha, a conta pede um código que muda a cada 30 segundos no seu celular. Mesmo que alguém
              descubra sua senha, não consegue entrar. Recomendado para quem cuida de dados de outras pessoas.
            </p>
            <button type="button" className="btn-save sg-botao" onClick={comecar} disabled={ocupado} aria-busy={ocupado}>
              Ativar verificação em duas etapas
            </button>
          </>
        )}

        {etapa === "parado" && status?.ativo && (
          <>
            <p className="sg-texto">
              Sua conta pede o código do aplicativo autenticador a cada entrada.{" "}
              {status.codigos_restantes > 0
                ? `Você ainda tem ${status.codigos_restantes} código(s) de recuperação.`
                : "Você não tem mais códigos de recuperação: gere novos."}
            </p>
            {status.codigos_restantes <= 2 && (
              <p className="sg-alerta" role="note">Poucos códigos de recuperação restantes. Gere novos e guarde em lugar seguro.</p>
            )}
            <div className="sg-acoes">
              <button type="button" className="btn-cancel sg-botao" onClick={() => { limparFormulario(); setEtapa("renovando"); }}>
                Gerar novos códigos de recuperação
              </button>
              <button type="button" className="btn-cancel sg-botao sg-botao--perigo" onClick={() => { limparFormulario(); setEtapa("desativando"); }}>
                Desativar
              </button>
            </div>
          </>
        )}

        {etapa === "configurando" && config && (
          <ol className="sg-passos">
            <li>
              Instale um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator ou Authy).
            </li>
            <li>
              No aplicativo, toque em <strong>adicionar</strong> e leia este QR code:
              <div className="sg-qr">
                <img src={config.qrcode} alt="QR code para configurar o aplicativo autenticador" width={200} height={200} />
              </div>
              <details className="sg-chave">
                <summary>Não consegue ler? Digite a chave</summary>
                <code aria-label="Chave para digitar no aplicativo">{emBlocos(config.segredo)}</code>
              </details>
            </li>
            <li>Digite abaixo o código de 6 dígitos que apareceu no aplicativo.</li>
          </ol>
        )}

        {etapa === "codigos" && (
          <div className="sg-codigos">
            <h4 ref={tituloCodigos} tabIndex={-1} className="sg-subtitulo">Guarde seus códigos de recuperação</h4>
            <p className="sg-texto">
              Se perder o celular, cada código abaixo permite entrar <strong>uma vez</strong>. Eles não aparecem de
              novo: baixe, imprima ou anote e guarde em lugar seguro (não no mesmo celular).
            </p>
            <ul className="sg-codigos__lista" aria-label="Códigos de recuperação">
              {codigosNovos.map((c) => (
                <li key={c}><code>{c}</code></li>
              ))}
            </ul>
            <div className="sg-acoes">
              <button type="button" className="btn-cancel sg-botao" onClick={baixarCodigos}>Baixar (.txt)</button>
              <button type="button" className="btn-cancel sg-botao" onClick={copiarCodigos}>Copiar</button>
            </div>
            <label className="sg-check">
              <input type="checkbox" checked={guardou} onChange={(e) => setGuardou(e.target.checked)} />
              Guardei os códigos em lugar seguro
            </label>
            <button
              type="button"
              className="btn-save sg-botao"
              disabled={!guardou}
              onClick={() => { setCodigosNovos([]); setEtapa("parado"); }}
            >
              Concluir
            </button>
          </div>
        )}

        {pedeCodigo && (
          <form className="sg-form" onSubmit={confirmar} noValidate>
            {etapa === "desativando" && (
              <div className="form-group">
                <label htmlFor={`${idBase}-senha`} className="form-label">Sua senha</label>
                <CampoSenha
                  id={`${idBase}-senha`}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="form-input"
                  autoComplete="current-password"
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor={`${idBase}-codigo`} className="form-label">
                {etapa === "configurando" ? "Código do aplicativo" : "Código do aplicativo ou de recuperação"}
              </label>
              <input
                ref={campoCodigo}
                id={`${idBase}-codigo`}
                className="form-input sg-codigo"
                value={codigo}
                onChange={(e) => setCodigo(etapa === "configurando" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 12))}
                inputMode={etapa === "configurando" ? "numeric" : "text"}
                autoComplete="one-time-code"
                placeholder="000000"
                required
                aria-invalid={erro2fa ? true : undefined}
                aria-describedby={erro2fa ? `${idBase}-erro` : undefined}
              />
              {erro2fa && <p id={`${idBase}-erro`} className="sg-erro" role="alert">{erro2fa}</p>}
            </div>
            <div className="sg-acoes">
              <button type="button" className="btn-cancel sg-botao" onClick={cancelar}>Cancelar</button>
              <button
                type="submit"
                className={`btn-save sg-botao${etapa === "desativando" ? " sg-botao--perigo-cheio" : ""}`}
                disabled={ocupado || !codigo || (etapa === "desativando" && !senha)}
                aria-busy={ocupado}
              >
                {etapa === "configurando" ? "Ativar" : etapa === "desativando" ? "Desativar" : "Gerar códigos"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ---------- Aparelhos conectados ---------- */}
      <div className="sg-bloco">
        <div className="sg-bloco__topo">
          <h3 className="sg-subtitulo">Aparelhos conectados</h3>
          {outras > 0 && (
            <button type="button" className="sg-link" onClick={encerrarOutras}>
              Sair dos outros aparelhos ({outras})
            </button>
          )}
        </div>
        <p className="sg-texto">
          Não reconhece algum? Encerre e troque sua senha. Por segurança, a conta sai sozinha depois de alguns dias sem uso.
        </p>
        <ul className="sg-lista">
          {sessoes.map((s) => (
            <li key={s.referencia} className="sg-item">
              <div className="sg-item__info">
                <span className="sg-item__nome">
                  {s.dispositivo || "Aparelho"}
                  {s.atual && <span className="sg-selo sg-selo--ok">Este aparelho</span>}
                </span>
                <span className="sg-item__meta">
                  Último uso {tempoRelativo(s.ultimo_uso)} · entrou em {formatarDataHora(s.criada_em)}
                  {s.ip ? ` · IP ${s.ip}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="sg-link"
                onClick={() => encerrar(s)}
                aria-label={`Encerrar ${s.dispositivo || "aparelho"}${s.atual ? " (este aparelho)" : ""}`}
              >
                {s.atual ? "Sair" : "Encerrar"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Atividade recente ---------- */}
      <div className="sg-bloco">
        <h3 className="sg-subtitulo">Atividade recente</h3>
        {acessos.length === 0 ? (
          <p className="sg-texto">Nenhuma atividade registrada ainda.</p>
        ) : (
          <ul className="sg-lista">
            {acessos.map((a) => {
              const detalhe = detalheEvento(a);
              return (
                <li key={a.id_log} className={`sg-item sg-item--${a.resultado}`}>
                  <span className="sg-item__marca" aria-hidden />
                  <div className="sg-item__info">
                    <span className="sg-item__nome">
                      {rotuloEvento(a)}
                      {a.resultado !== "sucesso" && (
                        <span className="sg-selo sg-selo--erro">{a.resultado === "bloqueado" ? "Bloqueado" : "Recusado"}</span>
                      )}
                    </span>
                    <span className="sg-item__meta">
                      {formatarDataHora(a.criado_em)} · {a.dispositivo}
                      {a.ip ? ` · IP ${a.ip}` : ""}
                      {detalhe ? ` · ${detalhe}` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default SegurancaConta;
