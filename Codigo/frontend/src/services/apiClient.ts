import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import authService from "./authService";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * Instância configurada do Axios
 * Inclui interceptors para adicionar token automaticamente
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor de requisição
 * Adiciona o token JWT em todas as requisições
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData: remover Content-Type para o navegador definir multipart/form-data com boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/** Evita múltiplos reloads quando várias requests retornam 401 ao mesmo tempo */
let isLoggingOut = false;

/**
 * Interceptor de resposta
 * Trata erros globalmente e faz logout em caso de token inválido/expirado
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; codigo?: string }>) => {
    const status = error.response?.status;
    const hash = window.location.hash || "#/";
    const caminhoAtual = hash.replace(/^#/, "") || "/";

    // Senha provisória: o servidor só libera a criação da senha
    if (status === 403 && error.response?.data?.codigo === "TROCAR_SENHA") {
      try {
        const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
        if (usuario) localStorage.setItem("usuario", JSON.stringify({ ...usuario, trocar_senha: true }));
      } catch {
        /* ignore */
      }
      if (!hash.startsWith("#/criar-senha")) {
        authService.definirRetorno(caminhoAtual);
        window.location.hash = "#/criar-senha";
        window.location.reload();
      }
    }

    if (status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      if (!hash.startsWith("#/login")) {
        // Explica o motivo na tela de login e volta para cá depois de entrar
        authService.definirAviso(error.response?.data?.error || "Sua sessão expirou. Entre novamente.");
        authService.definirRetorno(caminhoAtual);
        window.location.hash = "#/login";
        window.location.reload();
      } else {
        isLoggingOut = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
