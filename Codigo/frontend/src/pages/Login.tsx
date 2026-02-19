import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="logo">
        <img src={logo} alt="Logo Casa dos Discípulos" />
      </div>

      <div className="login-form">
        <h2>Seja bem-vindo!</h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled={loading}
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            disabled={loading}
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
