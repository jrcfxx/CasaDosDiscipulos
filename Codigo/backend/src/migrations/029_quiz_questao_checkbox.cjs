/**
 * Perguntas do tipo "checkbox" (várias respostas certas) já eram corrigidas pelo
 * QuizRespostaService, mas a coluna tipo_questao não aceitava esse valor: criar um quiz
 * com uma pergunta checkbox quebrava com erro 500 (e deixava um quiz pela metade).
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.raw(
    "ALTER TABLE quiz_questao MODIFY tipo_questao ENUM('multipla_escolha','verdadeiro_falso','discursiva','checkbox') NOT NULL"
  );
};

/** @param { import("knex").Knex } knex */
exports.down = async (knex) => {
  await knex("quiz_questao").where({ tipo_questao: "checkbox" }).update({ tipo_questao: "multipla_escolha" });
  await knex.raw(
    "ALTER TABLE quiz_questao MODIFY tipo_questao ENUM('multipla_escolha','verdadeiro_falso','discursiva') NOT NULL"
  );
};
