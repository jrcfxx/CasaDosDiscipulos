/**
 * Configuração centralizada de URLs da API
 * Use REACT_APP_API_URL no .env (ex: http://localhost:3001/api)
 */
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Base para assets estáticos (uploads, fotos) - remove /api do final
export const ASSETS_BASE =
  API_URL.replace(/\/api\/?$/, "") || "http://localhost:3001";

export const API_BASE = API_URL;

export default API_URL;
