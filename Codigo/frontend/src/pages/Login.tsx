import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../style/Login.css";
import logo from "../assets/logo.png";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const usuario = await login(email, senha);

      if (usuario.tipo === "administrador") {
        navigate("/portal/admin", { replace: true });
      } else {
        navigate("/portal/usuario", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login. Tente novamente.");
    } finally {
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
            <input
              id="login-senha"
              type="password"
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>

      <Link to="/" className="login-back">
        Voltar ao início
      </Link>
    </div>
  );
};

export default Login;
