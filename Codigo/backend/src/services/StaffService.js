import knex from "../database/index.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/** Grupo → função → subfunção → item: mais que isso fica ilegível no organograma */
export const PROFUNDIDADE_MAXIMA = 4;

const CHAVES_CONFIG = { titulo: "staff_titulo", subtitulo: "staff_subtitulo" };

function limpar(texto) {
  const s = String(texto ?? "").trim();
  return s.length ? s : null;
}

/**
 * Staff / estrutura da Casa (organograma).
 * Leitura pública; escrita só pelo admin (rotas protegidas).
 */
const StaffService = {
  /** Organograma completo: { titulo, subtitulo, itens: [{ ..., filhos: [...] }] } */
  async getEstrutura() {
    const [linhas, config] = await Promise.all([
      knex("staff_item")
        .select("id_staff_item", "id_pai", "titulo", "pessoas", "ordem")
        .orderBy([{ column: "ordem" }, { column: "id_staff_item" }]),
      knex("site_config").whereIn("chave", Object.values(CHAVES_CONFIG)),
    ]);
    const valor = (chave) => config.find((c) => c.chave === chave)?.valor ?? "";

    const porId = new Map(linhas.map((l) => [l.id_staff_item, { ...l, filhos: [] }]));
    const raiz = [];
    for (const item of porId.values()) {
      const pai = item.id_pai ? porId.get(item.id_pai) : null;
      (pai ? pai.filhos : raiz).push(item);
    }
    return {
      titulo: valor(CHAVES_CONFIG.titulo),
      subtitulo: valor(CHAVES_CONFIG.subtitulo),
      itens: raiz,
    };
  },

  async atualizarConfig({ titulo, subtitulo }) {
    const pares = [];
    if (titulo !== undefined) {
      const t = limpar(titulo);
      if (!t) throw new ValidationError("Informe o título da seção");
      pares.push([CHAVES_CONFIG.titulo, t]);
    }
    if (subtitulo !== undefined) pares.push([CHAVES_CONFIG.subtitulo, limpar(subtitulo) ?? ""]);
    for (const [chave, valor] of pares) {
      await knex("site_config")
        .insert({ chave, valor, data_atualizacao: knex.fn.now() })
        .onConflict("chave")
        .merge(["valor", "data_atualizacao"]);
    }
    return this.getEstrutura();
  },

  async _buscar(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) throw new ValidationError("ID inválido");
    const item = await knex("staff_item").where({ id_staff_item: n }).first();
    if (!item) throw new NotFoundError("Item não encontrado");
    return item;
  },

  /** Nível do item (1 = grupo do topo) */
  async _nivel(idItem) {
    let nivel = 0;
    let atual = idItem;
    while (atual) {
      nivel += 1;
      if (nivel > 50) break; // proteção contra dados corrompidos
      const row = await knex("staff_item").where({ id_staff_item: atual }).select("id_pai").first();
      atual = row?.id_pai ?? null;
    }
    return nivel;
  },

  async criarItem({ id_pai = null, titulo, pessoas = null }) {
    const t = limpar(titulo);
    if (!t) throw new ValidationError("Informe o nome do grupo ou da função");
    let idPai = null;
    if (id_pai != null) {
      const pai = await this._buscar(id_pai);
      if ((await this._nivel(pai.id_staff_item)) >= PROFUNDIDADE_MAXIMA) {
        throw new ValidationError(`O organograma aceita no máximo ${PROFUNDIDADE_MAXIMA} níveis`);
      }
      idPai = pai.id_staff_item;
    }
    const irmaos = knex("staff_item");
    idPai ? irmaos.where({ id_pai: idPai }) : irmaos.whereNull("id_pai");
    const { maior } = (await irmaos.max({ maior: "ordem" }).first()) || {};
    const [id] = await knex("staff_item").insert({
      id_pai: idPai,
      titulo: t,
      pessoas: limpar(pessoas),
      ordem: maior == null ? 0 : Number(maior) + 1,
    });
    return knex("staff_item").where({ id_staff_item: id }).first();
  },

  async atualizarItem(id, { titulo, pessoas }) {
    const item = await this._buscar(id);
    const patch = { data_atualizacao: knex.fn.now() };
    if (titulo !== undefined) {
      const t = limpar(titulo);
      if (!t) throw new ValidationError("Informe o nome do grupo ou da função");
      patch.titulo = t;
    }
    if (pessoas !== undefined) patch.pessoas = limpar(pessoas);
    await knex("staff_item").where({ id_staff_item: item.id_staff_item }).update(patch);
    return knex("staff_item").where({ id_staff_item: item.id_staff_item }).first();
  },

  /** Remove o item e tudo que estiver dentro dele (ON DELETE CASCADE) */
  async excluirItem(id) {
    const item = await this._buscar(id);
    await knex("staff_item").where({ id_staff_item: item.id_staff_item }).del();
  },

  /** Troca a posição com o irmão de cima ou de baixo */
  async moverItem(id, direcao) {
    if (!["cima", "baixo"].includes(direcao)) {
      throw new ValidationError("Direção inválida (use cima ou baixo)");
    }
    const item = await this._buscar(id);
    await knex.transaction(async (trx) => {
      const q = trx("staff_item").select("id_staff_item", "ordem");
      item.id_pai ? q.where({ id_pai: item.id_pai }) : q.whereNull("id_pai");
      const irmaos = await q.orderBy([{ column: "ordem" }, { column: "id_staff_item" }]);
      const i = irmaos.findIndex((x) => x.id_staff_item === item.id_staff_item);
      const j = direcao === "cima" ? i - 1 : i + 1;
      if (j < 0 || j >= irmaos.length) return; // já está na ponta
      [irmaos[i], irmaos[j]] = [irmaos[j], irmaos[i]];
      // Renumera a lista inteira: corrige também ordens repetidas antigas
      for (let k = 0; k < irmaos.length; k++) {
        await trx("staff_item").where({ id_staff_item: irmaos[k].id_staff_item }).update({ ordem: k });
      }
    });
    return this.getEstrutura();
  },
};

export default StaffService;
