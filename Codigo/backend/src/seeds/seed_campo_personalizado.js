import knex from "../database/index.js";

/**
 * Seed para tipos de campos personalizados
 * Define campos e suas modalidades permitidas:
 * - modulo: DateField, LinkField, NumberField, QuizField, TextareaField, TextField, UploadField, VideoField
 * - quiz: Todos os campos
 * - licao: Mesmos que módulo
 * - formulario: Mesmos que módulo
 */
export async function seed() {
  await knex("campo_personalizado").del();

  await knex("campo_personalizado").insert([
    // Campos gerais - permitidos em módulo, lição e formulário
    {
      tipo_campo: "texto",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "numero",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "data",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "link",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "upload",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "textarea",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "video",
      modalidades: JSON.stringify(["modulo", "quiz", "licao", "formulario"]),
    },
    {
      tipo_campo: "quiz",
      modalidades: JSON.stringify(["modulo", "licao", "formulario"]),
    },

    // Campos específicos para questões de quiz - apenas quiz
    {
      tipo_campo: "multipla_escolha",
      modalidades: JSON.stringify(["quiz"]),
    },
    {
      tipo_campo: "verdadeiro_falso",
      modalidades: JSON.stringify(["quiz"]),
    },
    {
      tipo_campo: "discursiva",
      modalidades: JSON.stringify(["quiz"]),
    },
    {
      tipo_campo: "checkbox",
      modalidades: JSON.stringify(["quiz"]),
    },
    {
      tipo_campo: "select",
      modalidades: JSON.stringify(["quiz"]),
    },
  ]);

  console.log("✅ Campos personalizados inseridos com sucesso!");
}
