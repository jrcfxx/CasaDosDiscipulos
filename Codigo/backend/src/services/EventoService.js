import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import knex from "../database/index.js";
import EventoModel from "../models/EventoModel.js";
import { NotFoundError, ValidationError } from "../utils/AppError.js";

/** Mesma pasta usada no upload (routes/eventoRoutes.js) e servida em /uploads */
const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "uploads");

/** Caminho em disco de uma imagem enviada pelo upload de eventos, ou null se não for uma delas */
function arquivoDoEvento(imagemUrl) {
  const m = /^\/uploads\/(evento-[\w.-]+\.(?:jpe?g|png|gif|webp))$/i.exec(String(imagemUrl || ""));
  return m ? path.join(UPLOADS_DIR, m[1]) : null;
}

function idValido(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError("ID inválido");
  return n;
}

/**
 * Eventos do carrossel da home (Gerenciar Eventos).
 * A ordem é a do carrossel e muda só arrastando na tela (PUT /evento/ordem).
 */
class EventoService {
  async getAll() {
    return EventoModel.getAll();
  }

  async getAtivos() {
    return EventoModel.getAtivos();
  }

  async getById(id) {
    const evento = await EventoModel.getById(idValido(id));
    if (!evento) throw new NotFoundError("Evento não encontrado");
    return evento;
  }

  /** A imagem precisa ter sido enviada pelo upload de eventos (e o arquivo existir) */
  _validarImagem(imagemUrl) {
    const arquivo = arquivoDoEvento(imagemUrl);
    if (!arquivo || !fs.existsSync(arquivo)) {
      throw new ValidationError("Envie a imagem do evento.");
    }
  }

  /** Apaga do servidor a imagem que nenhum evento usa mais */
  async _apagarImagemSemUso(imagemUrl) {
    const arquivo = arquivoDoEvento(imagemUrl);
    if (!arquivo) return;
    const emUso = await knex("evento").where({ imagem_url: imagemUrl }).first();
    if (emUso) return;
    fs.rm(arquivo, { force: true }, () => {});
  }

  async create(evento) {
    if (!evento.imagem_url) throw new ValidationError("Envie a imagem do evento.");
    this._validarImagem(evento.imagem_url);
    // Entra no fim do carrossel (antes ficava 0 e passava na frente de todos)
    const { maior } = (await knex("evento").max({ maior: "ordem" }).first()) || {};
    return EventoModel.create({
      titulo: evento.titulo || null,
      descricao: evento.descricao || null,
      imagem_url: evento.imagem_url,
      ordem: (Number(maior) || 0) + 1,
      ativo: evento.ativo !== undefined ? evento.ativo : true,
    });
  }

  /** Edita só o que vier; a "ordem" não é editável aqui (use reordenar) */
  async update(id, evento) {
    const existente = await this.getById(id);

    const dados = {};
    if (evento.titulo !== undefined) dados.titulo = evento.titulo || null;
    if (evento.descricao !== undefined) dados.descricao = evento.descricao || null;
    if (evento.ativo !== undefined) dados.ativo = evento.ativo;
    const trocouImagem = evento.imagem_url !== undefined && evento.imagem_url !== existente.imagem_url;
    if (trocouImagem) {
      this._validarImagem(evento.imagem_url);
      dados.imagem_url = evento.imagem_url;
    }

    const atualizado = Object.keys(dados).length
      ? await EventoModel.update(existente.id_evento, dados)
      : existente;
    if (trocouImagem) await this._apagarImagemSemUso(existente.imagem_url);
    return atualizado;
  }

  /**
   * Nova ordem do carrossel: a lista com TODOS os eventos, na ordem desejada.
   * Recusa lista incompleta ou repetida (salvar metade embaralharia o resto).
   */
  async reordenar(ids) {
    const lista = (ids || []).map(Number);
    if (lista.some((n) => !Number.isInteger(n) || n <= 0) || new Set(lista).size !== lista.length) {
      throw new ValidationError("Lista de eventos inválida.");
    }
    const existentes = (await knex("evento").select("id_evento")).map((e) => e.id_evento);
    if (existentes.length !== lista.length || existentes.some((id) => !lista.includes(id))) {
      throw new ValidationError("A lista de eventos mudou. Atualize a página e arraste de novo.");
    }
    await knex.transaction(async (trx) => {
      for (const [i, id] of lista.entries()) {
        await trx("evento").where({ id_evento: id }).update({ ordem: i + 1 });
      }
    });
    return EventoModel.getAll();
  }

  async delete(id) {
    const evento = await this.getById(id);
    await EventoModel.delete(evento.id_evento);
    await this._apagarImagemSemUso(evento.imagem_url);
  }
}

export default new EventoService();
