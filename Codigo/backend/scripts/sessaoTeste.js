/**
 * Scripts de teste/QA: cria uma sessão de verdade no servidor (tabela "sessao") e devolve o token.
 * Token sem sessão registrada não é aceito pela API.
 */
import SessaoService from "../src/services/SessaoService.js";
import { gerarToken } from "../src/services/authService.js";

const REQ_TESTE = { headers: { "user-agent": "script-de-teste" }, ip: "127.0.0.1" };

export async function tokenDeTeste(usuario) {
  const { id_sessao, maximaSeg } = await SessaoService.criar(usuario, REQ_TESTE);
  return gerarToken(usuario, id_sessao, maximaSeg);
}

/** Apaga as sessões criadas pelos scripts (chame antes de knex.destroy) */
export async function encerrarSessoesDeTeste() {
  const knex = (await import("../src/database/index.js")).default;
  await knex("sessao").where({ user_agent: REQ_TESTE.headers["user-agent"] }).del();
}
