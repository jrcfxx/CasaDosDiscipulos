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

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de resposta
 * Trata erros globalmente e faz logout em caso de token inválido
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Se o token for inválido ou expirado, faz logout
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      // Redireciona para login se não estiver já na página de login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
