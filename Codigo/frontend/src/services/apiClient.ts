import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

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
  (error: AxiosError) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      const hash = window.location.hash || "#/";
      const isLogin = hash.includes("#/login");
      if (!isLogin) {
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
