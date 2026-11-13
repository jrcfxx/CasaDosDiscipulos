import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

/**
 * Destino depois do login, decidido num lugar só:
 * senha provisória → "Crie sua senha"; senão a página onde a pessoa estava; senão o portal.
 */
const RedirecionarAposLogin: React.FC<{ precisaTrocarSenha: boolean; portal: string }> = ({
  precisaTrocarSenha,
  portal,
}) => {
  const destino = precisaTrocarSenha ? "/criar-senha" : authService.obterRetorno() ?? portal;
  // A tela "Crie sua senha" ainda usa o destino guardado; nos outros casos ele já foi usado
  useEffect(() => {
    if (!precisaTrocarSenha) authService.limparRetorno();
  }, [precisaTrocarSenha]);
  return <Navigate to={destino} replace />;
};

export default RedirecionarAposLogin;
