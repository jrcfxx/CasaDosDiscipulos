import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";
import CampoSenha from "../components/ui/CampoSenha";
import PainelEntrada from "../components/layout/PainelEntrada";
import "../style/Login.css";
import logo from "../assets/logo_mark.png";

const Login: React.FC = () => {
  const { login, confirmarCodigo } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  /** Segundo passo (conta com verificação em duas etapas) */
  const [etapaCodigo, setEtapaCodigo] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [usarRecuperacao, setUsarRecuperacao] = useState(false);
  const campoCodigo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (etapaCodigo) campoCodigo.current?.focus();
  }, [etapaCodigo, usarRecuperacao]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Motivo de ter caído no login (ex.: sessão expirada), lido uma única vez
  const [aviso] = useState(() => authService.consumirAviso());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !senha) {
      setError("Preencha todos os campos");
      return;
    }

    if (!email.includes("@")) {
      setError("Email inválido");
      return;
    }

    setLoading(true);

    try {
      // O destino (criar senha / página anterior / portal) é decidido pela rota /login no App
      const r = await login(email.trim(), senha);
      if ("precisa2fa" in r) {
        setSenha("");
        setEtapaCodigo(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  const enviarCodigo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const limpo = codigo.trim();
    if (!limpo) {
      setError(usarRecuperacao ? "Digite um código de recuperação" : "Digite o código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      await confirmarCodigo(limpo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível conferir o código.";
      setError(msg);
      setCodigo("");
      setLoading(false);
      // Prazo acabou ou bloqueou: volta para a senha
      if (/senha de novo|pausado/i.test(msg)) setEtapaCodigo(false);
    }
  };

  const voltarParaSenha = () => {
    setEtapaCodigo(false);
    setCodigo("");
    setUsarRecuperacao(false);
    setError("");
  };

  return (
    <div className="login-container">
      <PainelEntrada />
      <div className="login-lado">
      <header>
        <Link to="/" className="login-logo" aria-label="Ir para a página inicial">
          <img src={logo} alt="Casa dos Discípulos" />
        </Link>
      </header>

      <main id="main-content" className="login-form" tabIndex={-1}>
        <h1>{etapaCodigo ? "Verificação em duas etapas" : "Seja bem-vindo!"}</h1>
        <p className="login-form__subtitle">
          {etapaCodigo
            ? usarRecuperacao
              ? "Digite um dos códigos de recuperação que você guardou."
              : "Abra o aplicativo autenticador no celular e digite o código de 6 dígitos."
            : "Entre para acessar a Casa dos Discípulos"}
        </p>

        {aviso && !error && (
          <div className="login-aviso" role="status">
            {aviso}
          </div>
        )}

        {error && (
          <div id="login-error" className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {etapaCodigo ? (
          <form onSubmit={enviarCodigo} aria-label="Código de verificação">
            <div className="login-field">
              <label htmlFor="login-codigo">{usarRecuperacao ? "Código de recuperação" : "Código do aplicativo"}</label>
              <input
                ref={campoCodigo}
                id="login-codigo"
                className={usarRecuperacao ? undefined : "login-codigo"}
                value={codigo}
                onChange={(e) =>
                  setCodigo(usarRecuperacao ? e.target.value.slice(0, 12) : e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode={usarRecuperacao ? "text" : "numeric"}
                autoComplete="one-time-code"
                placeholder={usarRecuperacao ? "xxxx-xxxx" : "000000"}
                disabled={loading}
                required
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            <button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? <><span className="btn-spinner" aria-hidden />Conferindo…</> : "Confirmar"}
            </button>
            <div className="login-codigo-acoes">
              <button type="button" className="login-link" onClick={() => { setUsarRecuperacao((v) => !v); setCodigo(""); setError(""); }}>
                {usarRecuperacao ? "Usar o código do aplicativo" : "Perdi o celular: usar código de recuperação"}
              </button>
              <button type="button" className="login-link" onClick={voltarParaSenha}>
                Voltar
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit} aria-label="Formulário de login">
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-senha">Senha</label>
            <CampoSenha
              id="login-senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              disabled={loading}
              autoComplete="current-password"
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? <><span className="btn-spinner" aria-hidden />Entrando…</> : "Entrar"}
          </button>
        </form>
        )}

        <details className="login-esqueci">
          <summary>Esqueci minha senha</summary>
          <p>
            Fale com a secretaria da igreja. Ela gera uma senha temporária para você e, no próximo
            acesso, você cria uma nova.
          </p>
        </details>
      </main>

      <nav aria-label="Voltar">
        <Link to="/" className="login-back">
          Voltar ao início
        </Link>
      </nav>
      </div>
    </div>
  );
};

export default Login;
