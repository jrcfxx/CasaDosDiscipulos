import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PaginaSecretaria from "../components/secretaria/PaginaSecretaria";
import Toast from "../components/ui/Toast";
import Icone from "../components/ui/Icone";
import segurancaService, {
  FiltrosEventos, PaginaEventos, ResumoSeguranca, SessaoAberta,
} from "../services/segurancaService";
import { getErrorMessage } from "../utils/errorUtils";
import {
  FILTROS_EVENTO, detalheEvento, formatarDataHora, rotuloEvento, tempoRelativo,
} from "../utils/eventosSeguranca";
import "../style/secretariaUsuario.css";
import "../style/segurancaAdmin.css";

type Aba = "alertas" | "registro" | "aparelhos";
const ABAS: Array<{ id: Aba; nome: string }> = [
  { id: "alertas", nome: "Alertas" },
  { id: "registro", nome: "Registro de acessos" },
  { id: "aparelhos", nome: "Aparelhos conectados" },
];
const TIPOS: Record<string, string> = { administrador: "Admin", lider: "Líder", membro: "Membro" };
const POR_PAGINA = 50;

const formatoDia = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

/**
 * Painel de segurança (admin): alertas, registro de todas as entradas e ações nas contas,
 * e os aparelhos conectados agora — com como agir em cada caso.
 */
const SegurancaAdmin: React.FC = () => {
  const [aba, setAba] = useState<Aba>("alertas");
  const [resumo, setResumo] = useState<ResumoSeguranca | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "success" | "error" | "info" } | null>(null);
  const abasRef = useRef<Array<HTMLButtonElement | null>>([]);

  const avisar = useCallback((msg: string, tipo: "success" | "error" | "info") => setToast({ msg, tipo }), []);

  const carregarResumo = useCallback(async () => {
    try {
      setResumo(await segurancaService.resumo());
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível carregar o resumo"), "error");
    }
  }, [avisar]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const trocarPorSeta = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const prox = (i + (e.key === "ArrowRight" ? 1 : ABAS.length - 1)) % ABAS.length;
    setAba(ABAS[prox].id);
    abasRef.current[prox]?.focus();
  };

  const totalAlertas =
    (resumo?.contas_bloqueadas.length || 0) + (resumo?.ips_suspeitos.length || 0) + (resumo?.admins_sem_2fa.length || 0);

  return (
    <PaginaSecretaria
      area="Administração"
      titulo="Segurança"
      descricao="Quem entrou, quem errou a senha, de onde, e o que mudou nas contas. Registros ficam guardados por 180 dias."
      icone="escudo"
      abas={[]}
      numeros={
        resumo
          ? [
              { valor: resumo.ultimas_24h.logins, rotulo: "entradas em 24 h" },
              { valor: resumo.ultimas_24h.falhas, rotulo: "senhas erradas em 24 h" },
              { valor: resumo.sessoes_ativas, rotulo: "aparelhos conectados" },
              { valor: resumo.contas_bloqueadas.length, rotulo: "contas pausadas" },
            ]
          : []
      }
    >
      <div className="sa-corpo">
        <div className="su-segmento" role="tablist" aria-label="Seções do painel de segurança">
          {ABAS.map((a, i) => (
            <button
              key={a.id}
              ref={(el) => { abasRef.current[i] = el; }}
              type="button"
              role="tab"
              id={`sa-aba-${a.id}`}
              aria-selected={aba === a.id}
              aria-controls={`sa-painel-${a.id}`}
              tabIndex={aba === a.id ? 0 : -1}
              onClick={() => setAba(a.id)}
              onKeyDown={(e) => trocarPorSeta(e, i)}
            >
              {a.nome}
              {a.id === "alertas" && totalAlertas > 0 && <span className="sa-contagem">{totalAlertas}</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`sa-painel-${aba}`} aria-labelledby={`sa-aba-${aba}`}>
          {aba === "alertas" && <Alertas resumo={resumo} avisar={avisar} recarregar={carregarResumo} />}
          {aba === "registro" && <Registro avisar={avisar} />}
          {aba === "aparelhos" && <Aparelhos avisar={avisar} recarregar={carregarResumo} />}
        </div>
      </div>

      {toast && <Toast message={toast.msg} variant={toast.tipo} onClose={() => setToast(null)} />}
    </PaginaSecretaria>
  );
};

// ====================================================================================
function Alertas({
  resumo, avisar, recarregar,
}: {
  resumo: ResumoSeguranca | null;
  avisar: (m: string, t: "success" | "error" | "info") => void;
  recarregar: () => Promise<void>;
}) {
  if (!resumo) return <p className="sa-carregando" role="status">Carregando…</p>;

  const liberar = async (id: number, nome: string) => {
    try {
      await segurancaService.desbloquear(id);
      avisar(`Acesso de ${nome} liberado`, "success");
      await recarregar();
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível liberar"), "error");
    }
  };

  const maxDia = Math.max(1, ...resumo.logins_por_dia.map((d) => d.sucesso + d.falha));
  const semAlertas = !resumo.contas_bloqueadas.length && !resumo.ips_suspeitos.length && !resumo.admins_sem_2fa.length;

  return (
    <div className="sa-grade">
      {semAlertas && (
        <section className="sa-cartao sa-cartao--ok">
          <h2><Icone nome="concluido" tamanho={18} /> Nenhum alerta agora</h2>
          <p>Nenhuma conta pausada, nenhuma tentativa de invasão nas últimas 24 horas e todos os admins usam verificação em duas etapas.</p>
        </section>
      )}

      {resumo.contas_bloqueadas.length > 0 && (
        <section className="sa-cartao sa-cartao--alerta" aria-labelledby="sa-bloqueadas">
          <h2 id="sa-bloqueadas"><Icone nome="cadeado" tamanho={18} /> Contas com acesso pausado</h2>
          <p>
            Erraram a senha 5 vezes seguidas. O acesso volta sozinho no horário indicado. Libere antes só se a própria
            pessoa confirmar que foi ela (se esqueceu a senha, use “Redefinir senha” em Gerenciar Usuários).
          </p>
          <ul className="sa-lista">
            {resumo.contas_bloqueadas.map((c) => (
              <li key={c.id_usuario} className="sa-linha">
                <div className="sa-linha__info">
                  <strong>{c.nome}</strong>
                  <span>{c.email} · {c.tentativas_falhas} tentativas · volta {formatarDataHora(c.bloqueado_ate)}</span>
                </div>
                <button type="button" className="sc-btn sc-btn--contorno" onClick={() => liberar(c.id_usuario, c.nome)}>
                  Liberar agora
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resumo.ips_suspeitos.length > 0 && (
        <section className="sa-cartao sa-cartao--alerta" aria-labelledby="sa-ips">
          <h2 id="sa-ips"><Icone nome="alerta" tamanho={18} /> Muitas senhas erradas do mesmo endereço (24 h)</h2>
          <p>
            Pode ser alguém tentando adivinhar senhas. Os bloqueios automáticos já seguram essas tentativas; se vier de
            várias contas, peça às pessoas para trocarem a senha.
          </p>
          <div className="sa-tabela-rolagem">
            <table className="sa-tabela">
              <thead>
                <tr><th scope="col">Endereço (IP)</th><th scope="col">Senhas erradas</th><th scope="col">Contas tentadas</th><th scope="col">Última</th></tr>
              </thead>
              <tbody>
                {resumo.ips_suspeitos.map((i) => (
                  <tr key={i.ip}>
                    <td><code>{i.ip}</code></td>
                    <td>{i.falhas}</td>
                    <td>{i.contas}</td>
                    <td>{formatarDataHora(i.ultima)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resumo.admins_sem_2fa.length > 0 && (
        <section className="sa-cartao sa-cartao--aviso" aria-labelledby="sa-2fa">
          <h2 id="sa-2fa"><Icone nome="escudo" tamanho={18} /> Administradores sem verificação em duas etapas</h2>
          <p>
            Admins veem os dados de todos os membros. Peça para cada um ativar em <strong>Meu Perfil → Segurança da conta</strong>.
          </p>
          <ul className="sa-lista">
            {resumo.admins_sem_2fa.map((a) => (
              <li key={a.id_usuario} className="sa-linha">
                <div className="sa-linha__info"><strong>{a.nome}</strong><span>{a.email}</span></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sa-cartao" aria-labelledby="sa-dias">
        <h2 id="sa-dias"><Icone nome="calendario" tamanho={18} /> Entradas nos últimos 14 dias</h2>
        {resumo.logins_por_dia.length === 0 ? (
          <p>Nenhuma entrada registrada ainda.</p>
        ) : (
          <table className="sa-tabela sa-dias">
            <caption className="sr-only">Entradas aceitas e recusadas por dia</caption>
            <thead>
              <tr><th scope="col">Dia</th><th scope="col">Aceitas</th><th scope="col">Recusadas</th><th scope="col"><span className="sr-only">Gráfico</span></th></tr>
            </thead>
            <tbody>
              {resumo.logins_por_dia.map((d) => (
                <tr key={String(d.dia)}>
                  <th scope="row">{formatoDia.format(new Date(String(d.dia).slice(0, 10) + "T12:00:00"))}</th>
                  <td>{d.sucesso}</td>
                  <td className={d.falha ? "sa-num-falha" : undefined}>{d.falha}</td>
                  <td aria-hidden className="sa-barra-celula">
                    <div className="sa-barras">
                      <span className="sa-barra sa-barra--ok" style={{ width: `${(d.sucesso / maxDia) * 100}%` }} />
                      <span className="sa-barra sa-barra--falha" style={{ width: `${(d.falha / maxDia) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="sa-cartao" aria-labelledby="sa-regras">
        <h2 id="sa-regras"><Icone nome="cadeado" tamanho={18} /> Proteções ativas</h2>
        <ul className="sa-regras">
          <li><strong>Bloqueio por tentativas:</strong> 5 senhas erradas pausam a conta por 15 minutos (1 hora se repetir).</li>
          <li><strong>Sessão no servidor:</strong> cada aparelho pode ser desconectado na hora, por aqui ou pela própria pessoa.</li>
          <li><strong>Saída automática:</strong> admins após 8 horas sem uso; demais após 7 dias sem uso (máximo de 30 dias).</li>
          <li><strong>Senhas:</strong> mínimo de 8 caracteres, sem senhas óbvias (“jesus123”, telefone, e-mail) e guardadas com bcrypt.</li>
          <li><strong>Avisos à pessoa:</strong> entrada por aparelho novo, acesso pausado, e-mail alterado.</li>
          <li><strong>Verificação em duas etapas</strong> opcional para todos, com códigos de recuperação.</li>
        </ul>
      </section>
    </div>
  );
}

// ====================================================================================
function Registro({ avisar }: { avisar: (m: string, t: "success" | "error" | "info") => void }) {
  const [filtros, setFiltros] = useState<FiltrosEventos>({ evento: "", resultado: "", busca: "", de: "", ate: "", pagina: 1 });
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState<PaginaEventos | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFiltros((f) => (f.busca === busca ? f : { ...f, busca, pagina: 1 })), 350);
    return () => window.clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    segurancaService
      .eventos({ ...filtros, porPagina: POR_PAGINA })
      .then((r) => { if (!cancelado) setPagina(r); })
      .catch((err) => avisar(getErrorMessage(err, "Não foi possível carregar o registro"), "error"))
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [filtros, avisar]);

  const mudar = (campo: keyof FiltrosEventos, valor: string) => setFiltros((f) => ({ ...f, [campo]: valor, pagina: 1 }));
  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / POR_PAGINA)) : 1;

  return (
    <section className="sa-cartao" aria-labelledby="sa-registro">
      <h2 id="sa-registro" className="sr-only">Registro de acessos</h2>
      <div className="sa-filtros">
        <label className="sa-campo sa-campo--largo">
          <span>Buscar</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, e-mail ou IP" />
        </label>
        <label className="sa-campo">
          <span>Evento</span>
          <select value={filtros.evento} onChange={(e) => mudar("evento", e.target.value)}>
            {FILTROS_EVENTO.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
          </select>
        </label>
        <label className="sa-campo">
          <span>Resultado</span>
          <select value={filtros.resultado} onChange={(e) => mudar("resultado", e.target.value)}>
            <option value="">Todos</option>
            <option value="sucesso">Aceito</option>
            <option value="falha">Recusado</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </label>
        <label className="sa-campo">
          <span>De</span>
          <input type="date" value={filtros.de} onChange={(e) => mudar("de", e.target.value)} />
        </label>
        <label className="sa-campo">
          <span>Até</span>
          <input type="date" value={filtros.ate} onChange={(e) => mudar("ate", e.target.value)} />
        </label>
      </div>

      <p className="sa-total" role="status" aria-live="polite">
        {carregando ? "Carregando…" : pagina ? `${pagina.total} registro(s)` : ""}
      </p>

      <div className="sa-tabela-rolagem">
        <table className="sa-tabela sa-registro">
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Pessoa</th>
              <th scope="col">O que aconteceu</th>
              <th scope="col">Aparelho e IP</th>
              <th scope="col">Feito por</th>
            </tr>
          </thead>
          <tbody>
            {pagina?.eventos.map((e) => {
              const detalhe = detalheEvento(e);
              return (
                <tr key={e.id_log} className={e.resultado !== "sucesso" ? "sa-linha-falha" : undefined}>
                  <td className="sa-nowrap">{formatarDataHora(e.criado_em)}</td>
                  <td>
                    {e.usuario_nome ? (
                      <><strong>{e.usuario_nome}</strong><span className="sa-sub">{e.usuario_email}</span></>
                    ) : e.email ? (
                      <><span>{e.email}</span><span className="sa-sub">sem cadastro</span></>
                    ) : "—"}
                  </td>
                  <td>
                    <span className={`sa-resultado sa-resultado--${e.resultado}`}>
                      {e.resultado === "sucesso" ? "Aceito" : e.resultado === "bloqueado" ? "Bloqueado" : "Recusado"}
                    </span>{" "}
                    {rotuloEvento(e)}
                    {detalhe && <span className="sa-sub">{detalhe}</span>}
                  </td>
                  <td>
                    {e.dispositivo}
                    {e.ip && <span className="sa-sub"><code>{e.ip}</code></span>}
                  </td>
                  <td>{e.ator_nome && e.ator_nome !== e.usuario_nome ? e.ator_nome : "—"}</td>
                </tr>
              );
            })}
            {pagina && pagina.eventos.length === 0 && (
              <tr><td colSpan={5} className="sa-vazio">Nenhum registro com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagina && totalPaginas > 1 && (
        <nav className="sa-paginacao" aria-label="Páginas do registro">
          <button
            type="button"
            className="sc-btn sc-btn--contorno"
            disabled={pagina.pagina <= 1}
            onClick={() => setFiltros((f) => ({ ...f, pagina: (f.pagina || 1) - 1 }))}
          >
            <Icone nome="anterior" tamanho={16} /> Anteriores
          </button>
          <span>Página {pagina.pagina} de {totalPaginas}</span>
          <button
            type="button"
            className="sc-btn sc-btn--contorno"
            disabled={pagina.pagina >= totalPaginas}
            onClick={() => setFiltros((f) => ({ ...f, pagina: (f.pagina || 1) + 1 }))}
          >
            Seguintes <Icone nome="proximo" tamanho={16} />
          </button>
        </nav>
      )}
    </section>
  );
}

// ====================================================================================
function Aparelhos({
  avisar, recarregar,
}: {
  avisar: (m: string, t: "success" | "error" | "info") => void;
  recarregar: () => Promise<void>;
}) {
  const [sessoes, setSessoes] = useState<SessaoAberta[] | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    try {
      setSessoes(await segurancaService.todasSessoes());
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível carregar os aparelhos"), "error");
    }
  }, [avisar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!sessoes) return [];
    return t ? sessoes.filter((s) => `${s.nome} ${s.email} ${s.ip} ${s.dispositivo}`.toLowerCase().includes(t)) : sessoes;
  }, [sessoes, busca]);

  const encerrar = async (s: SessaoAberta) => {
    if (!window.confirm(`Desconectar ${s.nome} do aparelho ${s.dispositivo || ""}?`)) return;
    try {
      await segurancaService.encerrarSessao(s.referencia);
      avisar("Aparelho desconectado", "success");
      await Promise.all([carregar(), recarregar()]);
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível desconectar"), "error");
    }
  };

  const encerrarTodos = async (s: SessaoAberta) => {
    if (!s.id_usuario || !window.confirm(`Desconectar ${s.nome} de todos os aparelhos?`)) return;
    try {
      const r = await segurancaService.encerrarSessoesDoUsuario(s.id_usuario);
      avisar(r.message, "success");
      await Promise.all([carregar(), recarregar()]);
    } catch (err) {
      avisar(getErrorMessage(err, "Não foi possível desconectar"), "error");
    }
  };

  return (
    <section className="sa-cartao" aria-labelledby="sa-aparelhos">
      <h2 id="sa-aparelhos" className="sr-only">Aparelhos conectados</h2>
      <p className="sa-ajuda">
        Desconecte quando alguém perder o celular, sair da liderança ou relatar acesso estranho. Para impedir que
        entre de novo, redefina a senha ou desative a conta em Gerenciar Usuários.
      </p>
      <div className="sa-filtros">
        <label className="sa-campo sa-campo--largo">
          <span>Buscar</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, e-mail, aparelho ou IP" />
        </label>
      </div>
      <p className="sa-total" role="status" aria-live="polite">
        {sessoes ? `${visiveis.length} aparelho(s) conectado(s)` : "Carregando…"}
      </p>
      <div className="sa-tabela-rolagem">
        <table className="sa-tabela">
          <thead>
            <tr>
              <th scope="col">Pessoa</th>
              <th scope="col">Aparelho e IP</th>
              <th scope="col">Último uso</th>
              <th scope="col">Entrou em</th>
              <th scope="col"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((s) => (
              <tr key={s.referencia}>
                <td>
                  <strong>{s.nome}</strong>
                  <span className="sa-sub">{TIPOS[s.tipo || ""] || s.tipo} · {s.email}</span>
                </td>
                <td>{s.dispositivo}{s.ip && <span className="sa-sub"><code>{s.ip}</code></span>}</td>
                <td className="sa-nowrap">{tempoRelativo(s.ultimo_uso)}</td>
                <td className="sa-nowrap">{formatarDataHora(s.criada_em)}</td>
                <td className="sa-acoes">
                  <button type="button" className="sc-btn sc-btn--contorno" onClick={() => encerrar(s)}
                    aria-label={`Desconectar ${s.nome} de ${s.dispositivo || "aparelho"}`}>
                    Desconectar
                  </button>
                  <button type="button" className="sa-link" onClick={() => encerrarTodos(s)}
                    aria-label={`Desconectar ${s.nome} de todos os aparelhos`}>
                    Todos dessa pessoa
                  </button>
                </td>
              </tr>
            ))}
            {sessoes && visiveis.length === 0 && (
              <tr><td colSpan={5} className="sa-vazio">Nenhum aparelho conectado com essa busca.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SegurancaAdmin;
