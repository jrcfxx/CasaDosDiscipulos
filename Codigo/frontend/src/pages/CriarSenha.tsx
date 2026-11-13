import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";
import CampoSenha from "../components/ui/CampoSenha";
import { avaliarSenha } from "../utils/regrasSenha";
import "../style/Login.css";
import logo from "../assets/logo_mark.png";

/**
 * Primeiro acesso (ou senha redefinida pelo admin): a pessoa cria a própria senha.
 * O servidor bloqueia o resto do sistema até isso ser feito.
 */
const CriarSenha: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, trocarSenha, logout } = useAuth();
  // Vindo do login, a senha atual já foi digitada e não precisa ser pedida de novo
  const [senhaDoLogin] = useState(() => authService.obterSenhaDoLogin());

  const [senhaAtual, setSenhaAtual] = useState(senhaDoLogin);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const regras = useMemo(
    () => avaliarSenha(novaSenha, { telefone: (user as { telefone?: string } | null)?.telefone, email: user?.email }),
    [novaSenha, user]
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const confirmaOk = confirmar.length > 0 && confirmar === novaSenha;
  const podeEnviar = regras.every((r) => r.ok) && confirmaOk && !!senhaAtual && !salvando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!podeEnviar) {
      setErro(!confirmaOk ? "As senhas não coincidem" : "A nova senha ainda não atende às regras abaixo");
      return;
    }
    setSalvando(true);
    try {
      const usuario = await trocarSenha(senhaAtual, novaSenha);
      const retorno = authService.consumirRetorno();
      navigate(retorno ?? (usuario.tipo === "administrador" ? "/portal/admin" : "/portal/usuario"), { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar a senha. Tente novamente.");
      setSalvando(false);
    }
  };

  const primeiroNome = user?.nome?.split(" ")[0];

  return (
    <div className="login-container">
      <Link to="/" className="login-logo" aria-label="Ir para a página inicial">
        <img src={logo} alt="Casa dos Discípulos" />
      </Link>

      <main id="main-content" className="login-form" tabIndex={-1}>
        <h1>{primeiroNome ? `Olá, ${primeiroNome}!` : "Crie sua senha"}</h1>
        <p className="login-form__subtitle">
          Para proteger sua conta, crie uma senha só sua antes de continuar.
        </p>

        {erro && (
          <div id="criar-senha-erro" className="error-message" role="alert">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} aria-label="Criar nova senha" noValidate>
          {!senhaDoLogin && (
            <div className="login-field">
              <label htmlFor="senha-atual">Senha atual (a que você usou para entrar)</label>
              <CampoSenha
                id="senha-atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
                disabled={salvando}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="nova-senha">Nova senha</label>
            <CampoSenha
              id="nova-senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              disabled={salvando}
              aria-describedby="regras-senha"
              required
              autoFocus
            />
          </div>

          <ul id="regras-senha" className="regras-senha" aria-live="polite">
            {regras.map((r) => (
              <li key={r.id} className={r.ok ? "ok" : undefined}>
                {r.texto}
                <span className="sr-only">{r.ok ? " (cumprido)" : " (pendente)"}</span>
              </li>
            ))}
          </ul>

          <div className="login-field">
            <label htmlFor="confirmar-senha">Repita a nova senha</label>
            <CampoSenha
              id="confirmar-senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
              disabled={salvando}
              aria-invalid={confirmar.length > 0 && !confirmaOk}
              required
            />
          </div>

          <button type="submit" disabled={!podeEnviar} aria-busy={salvando}>
            {salvando ? <><span className="btn-spinner" aria-hidden />Salvando…</> : "Salvar senha e entrar"}
          </button>
        </form>
      </main>

      <button
        type="button"
        className="login-back login-back--botao"
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      >
        Sair
      </button>
    </div>
  );
};

export default CriarSenha;
