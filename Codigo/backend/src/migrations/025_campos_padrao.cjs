/**
 * Garante os tipos de campo padrão (texto, vídeo, upload, quiz...).
 * São configuração do sistema: sem eles os editores de módulo, lição, quiz e formulário
 * ficam sem opções. Insere só os tipos que faltarem (não mexe nos existentes).
 * @param { import("knex").Knex } knex
 */
const GERAIS = ["modulo", "quiz", "licao", "formulario"];
const TIPOS = [
  ["texto", GERAIS],
  ["numero", GERAIS],
  ["data", GERAIS],
  ["link", GERAIS],
  ["upload", GERAIS],
  ["textarea", GERAIS],
  ["video", GERAIS],
  ["quiz", ["modulo", "licao", "formulario"]],
  ["multipla_escolha", ["quiz"]],
  ["verdadeiro_falso", ["quiz"]],
  ["discursiva", ["quiz"]],
  ["checkbox", ["quiz"]],
  ["select", ["quiz"]],
];

exports.up = async (knex) => {
  const existentes = new Set(await knex("campo_personalizado").pluck("tipo_campo"));
  const faltando = TIPOS.filter(([tipo]) => !existentes.has(tipo)).map(([tipo_campo, modalidades]) => ({
    tipo_campo,
    modalidades: JSON.stringify(modalidades),
  }));
  if (faltando.length) await knex("campo_personalizado").insert(faltando);
};

exports.down = async () => {
  // Não remove: outros registros podem depender desses tipos
};
