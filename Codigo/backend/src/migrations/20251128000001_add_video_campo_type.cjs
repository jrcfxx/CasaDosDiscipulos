/**
 * Migration para adicionar o tipo 'video' ao campo_personalizado
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE campo_personalizado 
    MODIFY COLUMN tipo_campo ENUM(
      'texto',
      'numero', 
      'data',
      'link',
      'upload',
      'video',
      'textarea',
      'quiz',
      'multipla_escolha',
      'verdadeiro_falso',
      'discursiva',
      'checkbox',
      'select'
    ) NOT NULL
  `);
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
      'textarea',
      'quiz',
      'multipla_escolha',
      'verdadeiro_falso',
      'discursiva',
      'checkbox',
      'select'
    ) NOT NULL
  `);
};
