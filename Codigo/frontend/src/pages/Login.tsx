import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";
import CampoSenha from "../components/ui/CampoSenha";
import "../style/Login.css";
import logo from "../assets/logo_mark.png";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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
      await login(email.trim(), senha);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Link to="/" className="login-logo" aria-label="Ir para a página inicial">
        <img src={logo} alt="Casa dos Discípulos" />
      </Link>

      <main id="main-content" className="login-form" tabIndex={-1}>
        <h1>Seja bem-vindo!</h1>
        <p className="login-form__subtitle">Entre para acessar a Casa dos Discípulos</p>

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

        <details className="login-esqueci">
          <summary>Esqueci minha senha</summary>
          <p>
            Fale com a secretaria da igreja. Ela gera uma senha temporária para você e, no próximo
            acesso, você cria uma nova.
          </p>
        </details>
      </main>

      <Link to="/" className="login-back">
        Voltar ao início
      </Link>
    </div>
  );
};

export default Login;
