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
      <Link to="/" className="logo">
        <img src={logo} alt="Casa dos Discípulos" />
      </Link>

      <main id="main-content" className="login-form" tabIndex={-1}>
        <h2>Seja bem-vindo!</h2>

        {error && (
          <div id="login-error" className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} aria-label="Formulário de login">
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled={loading}
            autoComplete="email"
            required
            aria-describedby={error ? "login-error" : undefined}
          />
          <label htmlFor="login-senha" className="sr-only">Senha</label>
          <input
            id="login-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            disabled={loading}
            autoComplete="current-password"
            required
            aria-describedby={error ? "login-error" : undefined}
          />
          <button type="submit" disabled={loading} aria-busy={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Login;
