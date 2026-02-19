import knex from "../database/index.js";

/**
 * Limpa todas as tabelas na ordem reversa de dependências (FK).
 * Permite re-executar runSeeds múltiplas vezes sem erros de constraint.
 * Execute este seed antes dos demais.
 */
async function safeDel(tableName) {
  try {
    const exists = await knex.schema.hasTable(tableName);
    if (exists) {
      await knex(tableName).del();
    }
  } catch (err) {
    console.warn(`Aviso: não foi possível limpar ${tableName}:`, err.message);
  }
}

export async function seed() {
  // Ordem: tabelas dependentes primeiro (filhas antes das mães)
  const tables = [
    "formulario_resposta_campo",
    "formulario_resposta",
    "quiz_resposta",
    "usuario_modulo",
    "notificacao",
    "escala_atribuicao",
    "escala_evento_ministerio",
    "escala_area",
    "escala_evento",
    "usuario_ministerio",
    "ministerio_lider",
    "ministerio",
    "usuario_celula",
    "celula_lider",
    "celula",
    "quiz_questao",
    "modulo_quiz",
    "quiz",
    "modulo_campo",
    "modulo_pre_requisito",
    "modulo",
    "licao_campo",
    "licao",
    "formulario_campo",
    "formulario",
    "evento",
    "campo_personalizado",
    "usuario",
    "nivel",
  ];

  for (const table of tables) {
    await safeDel(table);
  }

  console.log("✅ Banco limpo com sucesso!");
}
