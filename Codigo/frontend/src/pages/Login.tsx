import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "../style/Login.css";
import logo from "../assets/logo.png";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validação básica
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
      const response = await authService.login({ email, senha });

      console.log("Login bem-sucedido:", response.usuario);

      // Redireciona baseado no tipo de usuário
      if (response.usuario.tipo === "administrador") {
        navigate("/portal/admin");
      } else {
        navigate("/portal/usuario");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
      console.error("Erro no login:", err);
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
