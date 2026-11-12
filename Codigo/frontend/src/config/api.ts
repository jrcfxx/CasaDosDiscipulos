/**
 * Configuração centralizada de URLs da API
 * Use REACT_APP_API_URL no .env (ex: http://localhost:3001/api)
 * Em produção é "/api" (mesmo domínio, atrás do Nginx).
 */
const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * Base para arquivos estáticos (uploads, fotos): a URL da API sem o "/api" final.
 * Com API relativa ("/api") a base é "" = mesmo domínio do site, que é o correto.
 * (Antes, `|| "http://localhost:3001"` trocava esse "" pelo endereço de desenvolvimento
 * e todas as imagens de upload quebravam em produção.)
 */
export function assetsBaseDe(apiUrl: string): string {
  return apiUrl.replace(/\/api\/?$/, "");
}

export const ASSETS_BASE = assetsBaseDe(API_URL);

export const API_BASE = API_URL;

export default API_URL;
