import type { ErroApi } from "../utils/errorUtils";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "../style/secretaria.css";
import "../style/Perfil.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import Icone, { type NomeIcone } from "../components/ui/Icone";
import CampoSenha from "../components/ui/CampoSenha";
import SegurancaConta from "../components/perfil/SegurancaConta";
import perfilDefault from "../assets/perfil-preto.png";
import { getUserProfile, updateUserProfile, uploadUserPhoto } from "../services/usuario";
import { showAllNiveis } from "../services/nivel";
import celulaService from "../services/celulaService";
import usuarioCelulaService from "../services/usuarioCelulaService";
import authService, { type Usuario } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { ASSETS_BASE } from "../config/api";
import { formatarTelefoneInput, normalizarTelefoneParaEnvio } from "../utils/telefoneUtils";
import { avaliarSenha } from "../utils/regrasSenha";

function buildFotoUrl(foto: string | undefined | null): string | null {
  if (!foto) return null;
  return foto.startsWith("http") ? foto : `${ASSETS_BASE}${foto}`;
}

interface Nivel {
  id_nivel: number;
  nome: string;
}

interface PerfilData {
  nome: string;
  email: string;
  telefone?: string | null;
  tipo: string;
  id_nivel?: number | null;
  nivel_escola?: number | null;
  pontuacao: number;
  foto?: string | null;
  data_criacao?: string;
  celula_principal?: { id_celula: number; nome_celula?: string } | null;
}

type Aviso = { msg: string; tipo: "success" | "error" | "info" };

const TIPOS: Record<string, string> = { lider: "Líder", administrador: "Administrador", membro: "Membro" };

/** Seções do menu lateral (as três últimas vêm de SegurancaConta) */
const SECOES: Array<{ id: string; nome: string; icone: NomeIcone }> = [
  { id: "dados", nome: "Dados pessoais", icone: "pessoa" },
  { id: "senha", nome: "Senha", icone: "cadeado" },
  { id: "duas-etapas", nome: "Duas etapas", icone: "escudo" },
  { id: "aparelhos", nome: "Aparelhos", icone: "celular" },
  { id: "atividade", nome: "Atividade", icone: "historico" },
];

const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export default function Perfil() {
  const { user, refreshUser, trocarSenha } = useAuth();
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [celulas, setCelulas] = useState<Array<{ id_celula: number; nome: string }>>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState("dados");

  const avisar = useCallback((msg: string, tipo: Aviso["tipo"]) => setAviso({ msg, tipo }), []);

  const carregar = useCallback(async () => {
    try {
      const data = (await getUserProfile()) as PerfilData;
      setPerfil(data);
      setErroCarga(false);
    } catch {
      setErroCarga(true);
    }
  }, []);

  useEffect(() => {
    carregar();
    showAllNiveis().then((d) => Array.isArray(d) && setNiveis(d)).catch(() => {});
    celulaService.getAtivas().then((c) => setCelulas(c || [])).catch(() => setCelulas([]));
  }, [carregar]);

  // Link direto para uma seção (ex.: /perfil#duas-etapas, vindo do menu do usuário)
  const hash = useLocation().hash;
  useEffect(() => {
    if (!perfil || !hash) return;
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(t);
  }, [perfil, hash]);

  // Destaca no menu a seção que está na tela
  useEffect(() => {
    if (!perfil || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setSecaoAtiva(visivel.target.id);
      },
      { rootMargin: "-120px 0px -55% 0px" }
    );
    SECOES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [perfil]);

  /** Mantém nome/e-mail do cabeçalho do site iguais ao que foi salvo */
  const sincronizarSessao = (dados: Partial<Usuario>) => {
    if (!user) return;
    authService.updateStoredUser({ ...user, ...dados });
    refreshUser();
  };

  if (!perfil) {
    return (
      <div className="sc-pagina pf page-with-fixed-header">
        <Header />
        <main id="main-content" tabIndex={-1} className="pf-carregando">
          {erroCarga ? (
            <div className="pf-erro-carga" role="alert">
              <p>Não foi possível carregar seu perfil.</p>
              <button type="button" className="sc-btn sc-btn--primario" onClick={carregar}>Tentar de novo</button>
            </div>
          ) : (
            <p role="status">Carregando seu perfil…</p>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const nivelId = perfil.nivel_escola ?? perfil.id_nivel;
  const nivel = nivelId ? niveis.find((n) => n.id_nivel === nivelId) : null;

  return (
    <div className="sc-pagina pf page-with-fixed-header">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <TopoPerfil perfil={perfil} nivel={nivel?.nome} avisar={avisar} aoMudarFoto={(foto) => setPerfil({ ...perfil, foto })} />

        <div className="pf-corpo">
          <nav className="pf-nav" aria-label="Seções do perfil">
            <ul>
              {SECOES.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={secaoAtiva === s.id ? "pf-nav__link pf-nav__link--ativo" : "pf-nav__link"}
                    aria-current={secaoAtiva === s.id ? "true" : undefined}
                    onClick={() => setSecaoAtiva(s.id)}
                  >
                    <Icone nome={s.icone} tamanho={17} />
                    {s.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pf-conteudo">
            <CartaoDados
              perfil={perfil}
              celulas={celulas}
              avisar={avisar}
              aoSalvar={(novo) => {
                setPerfil({ ...perfil, ...novo });
                sincronizarSessao({ nome: novo.nome, email: novo.email });
              }}
            />
            <CartaoSenha perfil={perfil} avisar={avisar} trocarSenha={trocarSenha} />
            <SegurancaConta avisar={avisar} />
          </div>
        </div>
      </main>

      {aviso && <Toast message={aviso.msg} variant={aviso.tipo} onClose={() => setAviso(null)} />}
      <Footer />
    </div>
  );
}

// =============================================================================
function TopoPerfil({
  perfil, nivel, avisar, aoMudarFoto,
}: {
  perfil: PerfilData;
  nivel?: string;
  avisar: (m: string, t: Aviso["tipo"]) => void;
  aoMudarFoto: (foto: string | null) => void;
}) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const foto = buildFotoUrl(perfil.foto);

  const escolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return avisar("Escolha uma imagem (JPG, PNG ou WEBP).", "error");
    if (f.size > 5 * 1024 * 1024) return avisar("A imagem pode ter no máximo 5 MB.", "error");
    setEnviando(true);
    try {
      const r = await uploadUserPhoto(f);
      aoMudarFoto(r?.foto ?? r?.usuario?.foto ?? null);
      avisar("Foto atualizada", "success");
    } catch {
      avisar("Não foi possível enviar a foto. Tente outra imagem.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const remover = async () => {
    setEnviando(true);
    try {
      await updateUserProfile({ foto: null });
      aoMudarFoto(null);
      avisar("Foto removida", "info");
    } catch {
      avisar("Não foi possível remover a foto.", "error");
    } finally {
      setEnviando(false);
    }
  };

  const desde = perfil.data_criacao ? mesAno.format(new Date(perfil.data_criacao)) : null;
  const primeiroNome = perfil.nome.split(" ")[0];

  return (
    <section className="sc-topo pf-topo" aria-labelledby="pf-titulo">
      <div className="pf-topo__conteudo">
        <div className={`pf-avatar${enviando ? " pf-avatar--enviando" : ""}`}>
          <img src={foto || perfilDefault} alt={foto ? `Foto de ${primeiroNome}` : ""} />
          <button
            type="button"
            className="pf-avatar__trocar"
            onClick={() => arquivo.current?.click()}
            disabled={enviando}
            aria-label={foto ? "Trocar foto de perfil" : "Adicionar foto de perfil"}
          >
            {enviando ? <span className="btn-spinner" aria-hidden /> : <Icone nome="imagem" tamanho={18} />}
          </button>
          <input ref={arquivo} type="file" accept="image/*" onChange={escolher} hidden />
        </div>

        <div className="pf-topo__texto">
          <p className="sc-topo__area"><Icone nome="pessoa" tamanho={15} /> Meu perfil</p>
          <h1 id="pf-titulo">{perfil.nome}</h1>
          <p className="pf-topo__linha">
            <span className="pf-selo">{TIPOS[perfil.tipo] || perfil.tipo}</span>
            {perfil.celula_principal?.nome_celula && (
              <span className="pf-topo__info"><Icone nome="casa" tamanho={15} /> Célula {perfil.celula_principal.nome_celula}</span>
            )}
            {desde && <span className="pf-topo__info"><Icone nome="calendario" tamanho={15} /> Na Casa desde {desde}</span>}
          </p>
          <ul className="sc-topo__numeros" aria-label="Sua caminhada">
            <li><strong>{nivel || "—"}</strong><span>nível na Escola</span></li>
            <li><strong>{perfil.pontuacao ?? 0}</strong><span>pontos</span></li>
          </ul>
          {foto && (
            <button type="button" className="pf-topo__remover" onClick={remover} disabled={enviando}>
              Remover foto
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
function CartaoDados({
  perfil, celulas, avisar, aoSalvar,
}: {
  perfil: PerfilData;
  celulas: Array<{ id_celula: number; nome: string }>;
  avisar: (m: string, t: Aviso["tipo"]) => void;
  aoSalvar: (p: Partial<PerfilData>) => void;
}) {
  const id = useId();
  const original = useMemo(
    () => ({
      nome: perfil.nome,
      email: perfil.email,
      telefone: formatarTelefoneInput(perfil.telefone ?? ""),
      celula: perfil.celula_principal?.id_celula ? String(perfil.celula_principal.id_celula) : "",
    }),
    [perfil]
  );
  const [form, setForm] = useState(original);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setForm(original), [original]);

  const mostraCelula = perfil.tipo === "membro" || perfil.tipo === "lider";
  const mudaEmail = form.email.trim().toLowerCase() !== perfil.email.toLowerCase();
  const alterado =
    form.nome !== original.nome || form.email !== original.email || form.telefone !== original.telefone ||
    (mostraCelula && form.celula !== original.celula);

  const mudar = (campo: keyof typeof form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  };

  const descartar = () => {
    setForm(original);
    setSenhaAtual("");
    setErros({});
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novos: Record<string, string> = {};
    if (form.nome.trim().length < 3) novos.nome = "Digite seu nome completo (pelo menos 3 letras).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) novos.email = "Digite um e-mail válido.";
    const telefone = normalizarTelefoneParaEnvio(form.telefone);
    if (form.telefone.trim() && !telefone) novos.telefone = "Use só números, com DDD. Exemplo: 31999990000.";
    if (mudaEmail && !senhaAtual) novos.senhaAtual = "Para trocar o e-mail, confirme com sua senha atual.";
    setErros(novos);
    const primeiro = Object.keys(novos)[0];
    if (primeiro) {
      document.getElementById(`${id}-${primeiro}`)?.focus();
      return;
    }

    setSalvando(true);
    try {
      const corpo: Record<string, unknown> = { nome: form.nome.trim(), email: form.email.trim(), telefone };
      if (mudaEmail) corpo.senhaAtual = senhaAtual;
      const atualizado = (await updateUserProfile(corpo)) as Partial<PerfilData>;

      let celulaPrincipal = perfil.celula_principal ?? null;
      if (mostraCelula && form.celula !== original.celula) {
        if (form.celula) {
          await usuarioCelulaService.setCelulaPrincipal(Number(form.celula));
          const c = celulas.find((x) => String(x.id_celula) === form.celula);
          celulaPrincipal = { id_celula: Number(form.celula), nome_celula: c?.nome };
        } else if (perfil.celula_principal?.id_celula) {
          await usuarioCelulaService.removeCelula(perfil.celula_principal.id_celula);
          celulaPrincipal = null;
        }
      }

      aoSalvar({
        nome: atualizado?.nome ?? corpo.nome as string,
        email: atualizado?.email ?? corpo.email as string,
        telefone: atualizado?.telefone ?? telefone,
        celula_principal: celulaPrincipal,
      });
      setSenhaAtual("");
      avisar("Dados salvos", "success");
    } catch (erro) {
      const msg = (erro as ErroApi)?.response?.data?.error || "Não foi possível salvar. Tente de novo.";
      if (/senha/i.test(msg)) {
        setErros({ senhaAtual: msg });
        document.getElementById(`${id}-senhaAtual`)?.focus();
      } else {
        avisar(msg, "error");
      }
    } finally {
      setSalvando(false);
    }
  };

  const campo = (nome: string) => ({
    id: `${id}-${nome}`,
    "aria-invalid": erros[nome] ? true : undefined,
    "aria-describedby": [erros[nome] ? `${id}-${nome}-erro` : "", `${id}-${nome}-dica`].filter(Boolean).join(" ") || undefined,
  });
  const erro = (nome: string) =>
    erros[nome] ? <p id={`${id}-${nome}-erro`} className="pf-campo__erro" role="alert">{erros[nome]}</p> : null;

  return (
    <section id="dados" className="pf-cartao" aria-labelledby={`${id}-titulo`}>
      <header className="pf-cartao__topo">
        <span className="pf-cartao__icone" aria-hidden><Icone nome="pessoa" tamanho={20} /></span>
        <div>
          <h2 id={`${id}-titulo`}>Dados pessoais</h2>
          <p>Como a Casa te encontra e fala com você.</p>
        </div>
      </header>

      <form className="pf-form" onSubmit={salvar} noValidate>
        <div className="pf-grade">
          <div className="pf-campo pf-campo--inteiro">
            <label htmlFor={`${id}-nome`}>Nome completo</label>
            <input {...campo("nome")} value={form.nome} onChange={(e) => mudar("nome", e.target.value)} autoComplete="name" />
            {erro("nome")}
          </div>

          <div className="pf-campo">
            <label htmlFor={`${id}-email`}>E-mail</label>
            <input {...campo("email")} type="email" value={form.email} onChange={(e) => mudar("email", e.target.value)} autoComplete="email" />
            <p id={`${id}-email-dica`} className="pf-campo__dica">É com ele que você entra no sistema.</p>
            {erro("email")}
          </div>

          <div className="pf-campo">
            <label htmlFor={`${id}-telefone`}>Telefone / WhatsApp</label>
            <input
              {...campo("telefone")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={form.telefone}
              onChange={(e) => mudar("telefone", formatarTelefoneInput(e.target.value))}
              placeholder="31999990000"
            />
            <p id={`${id}-telefone-dica`} className="pf-campo__dica">Para avisos de escala e lembretes. Só a liderança vê.</p>
            {erro("telefone")}
          </div>

          {mostraCelula && (
            <div className="pf-campo pf-campo--inteiro">
              <label htmlFor={`${id}-celula`}>Célula principal</label>
              <select {...campo("celula")} value={form.celula} onChange={(e) => mudar("celula", e.target.value)}>
                <option value="">Nenhuma</option>
                {celulas.map((c) => <option key={c.id_celula} value={c.id_celula}>{c.nome}</option>)}
              </select>
              <p id={`${id}-celula-dica`} className="pf-campo__dica">A célula que você frequenta. Ajuda seu líder a te acompanhar.</p>
            </div>
          )}

          {mudaEmail && (
            <div className="pf-campo pf-campo--inteiro pf-campo--destaque">
              <label htmlFor={`${id}-senhaAtual`}>Confirme com sua senha atual</label>
              <CampoSenha
                {...campo("senhaAtual")}
                value={senhaAtual}
                onChange={(e) => { setSenhaAtual(e.target.value); setErros((x) => ({ ...x, senhaAtual: "" })); }}
                autoComplete="current-password"
              />
              <p id={`${id}-senhaAtual-dica`} className="pf-campo__dica">
                Você vai trocar o e-mail de acesso. Por segurança, confirme que é você.
              </p>
              {erro("senhaAtual")}
            </div>
          )}
        </div>

        <footer className={`pf-cartao__rodape${alterado ? " pf-cartao__rodape--pendente" : ""}`}>
          <p className="pf-pendente" aria-live="polite">{alterado ? "Você tem alterações não salvas" : ""}</p>
          <div className="pf-acoes">
            {alterado && (
              <button type="button" className="sc-btn sc-btn--contorno" onClick={descartar} disabled={salvando}>Descartar</button>
            )}
            <button type="submit" className="sc-btn sc-btn--primario" disabled={!alterado || salvando} aria-busy={salvando}>
              {salvando ? <><span className="btn-spinner" aria-hidden /> Salvando…</> : "Salvar dados"}
            </button>
          </div>
        </footer>
      </form>
    </section>
  );
}

// =============================================================================
function CartaoSenha({
  perfil, avisar, trocarSenha,
}: {
  perfil: PerfilData;
  avisar: (m: string, t: Aviso["tipo"]) => void;
  trocarSenha: (atual: string, nova: string) => Promise<unknown>;
}) {
  const id = useId();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const regras = useMemo(() => avaliarSenha(nova, { telefone: perfil.telefone, email: perfil.email }), [nova, perfil]);
  const regrasOk = regras.every((r) => r.ok);
  const confere = confirma.length > 0 && confirma === nova;
  const podeEnviar = !!atual && regrasOk && confere && !salvando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!podeEnviar) {
      setErro(!atual ? "Digite sua senha atual." : !regrasOk ? "A nova senha ainda não atende às regras." : "A confirmação está diferente da nova senha.");
      return;
    }
    setSalvando(true);
    try {
      await trocarSenha(atual, nova);
      setAtual("");
      setNova("");
      setConfirma("");
      avisar("Senha alterada. Os outros aparelhos foram desconectados.", "success");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section id="senha" className="pf-cartao" aria-labelledby={`${id}-titulo`}>
      <header className="pf-cartao__topo">
        <span className="pf-cartao__icone" aria-hidden><Icone nome="cadeado" tamanho={20} /></span>
        <div>
          <h2 id={`${id}-titulo`}>Senha</h2>
          <p>Dica: uma frase curta é mais fácil de lembrar e mais difícil de adivinhar.</p>
        </div>
      </header>

      <form className="pf-form" onSubmit={enviar} noValidate>
        <div className="pf-grade">
          <div className="pf-campo pf-campo--inteiro pf-campo--metade">
            <label htmlFor={`${id}-atual`}>Senha atual</label>
            <CampoSenha id={`${id}-atual`} value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="pf-campo">
            <label htmlFor={`${id}-nova`}>Nova senha</label>
            <CampoSenha
              id={`${id}-nova`}
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              autoComplete="new-password"
              aria-describedby={`${id}-regras`}
            />
          </div>
          <div className="pf-campo">
            <label htmlFor={`${id}-confirma`}>Repita a nova senha</label>
            <CampoSenha
              id={`${id}-confirma`}
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              autoComplete="new-password"
              aria-describedby={`${id}-confere`}
            />
            <p id={`${id}-confere`} className={`pf-campo__dica${confirma ? (confere ? " pf-ok" : " pf-nao") : ""}`} aria-live="polite">
              {confirma ? (confere ? "As senhas são iguais" : "Ainda diferente da nova senha") : " "}
            </p>
          </div>
        </div>

        <ul id={`${id}-regras`} className="pf-regras" aria-label="Regras da nova senha">
          {regras.map((r) => (
            <li key={r.id} className={r.ok ? "pf-regras__ok" : undefined}>
              <span className="pf-regras__marca" aria-hidden>{r.ok ? <Icone nome="check" tamanho={13} /> : null}</span>
              {r.texto}
              <span className="sr-only">{r.ok ? " (cumprida)" : " (pendente)"}</span>
            </li>
          ))}
        </ul>

        {erro && <p className="pf-campo__erro" role="alert">{erro}</p>}

        <footer className="pf-cartao__rodape">
          <p className="pf-pendente pf-pendente--neutro">Ao trocar, os outros aparelhos saem da conta.</p>
          <div className="pf-acoes">
            <button type="submit" className="sc-btn sc-btn--primario" disabled={salvando} aria-busy={salvando}>
              {salvando ? <><span className="btn-spinner" aria-hidden /> Alterando…</> : "Alterar senha"}
            </button>
          </div>
        </footer>
      </form>
    </section>
  );
}
