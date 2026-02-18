/**
 * Migration para adicionar novos tipos de campo
 * Adiciona: textarea, quiz, checkbox, select
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("campo_personalizado", (table) => {
    })
    .then(() => {
      return knex.raw(`
      ALTER TABLE campo_personalizado 
      MODIFY COLUMN tipo_campo ENUM(
        'texto',
        'numero', 
        'data',
        'link',
        'upload',
        'textarea',
        'quiz',
        'multipla_escolha',
        'verdadeiro_falso',
        'discursiva',
        'checkbox',
        'select'
      ) NOT NULL
    `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE campo_personalizado 
    MODIFY COLUMN tipo_campo ENUM(
      'texto',
      'numero',
      'data',
      'link',
      'upload',
      'multipla_escolha',
      'verdadeiro_falso',
      'discursiva'
    ) NOT NULL
  `);
};
