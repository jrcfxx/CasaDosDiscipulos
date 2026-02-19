import knex from "../database/index.js";

/**
 * Seed para respostas de formulário (dados de exemplo)
 * Permite visualizar o dashboard com células em dia/atrasadas
 */
export async function seed() {
  await knex("formulario_resposta_campo").del();
  await knex("formulario_resposta").del();

  const formulario = await knex("formulario")
    .where({ titulo: "Relatório de Célula" })
    .first();
  const lider = await knex("usuario").where({ tipo: "lider" }).first();
  const celulas = await knex("celula").select("id_celula", "nome").orderBy("id_celula");

  if (!formulario || !lider || celulas.length === 0) {
    console.log("Execute seed_formulario, seed_usuario e seed_celula primeiro.");
    return;
  }

  const formularioCampos = await knex("formulario_campo")
    .where({ id_formulario: formulario.id_formulario })
    .orderBy("ordem");

  if (formularioCampos.length === 0) {
    console.log("Execute seed_formulario_campo primeiro.");
    return;
  }

  // Resposta recente (em dia) para célula 1
  const hoje = new Date();
  await knex("formulario_resposta").insert({
    id_formulario: formulario.id_formulario,
    id_usuario: lider.id_usuario,
    id_celula: celulas[0].id_celula,
    data_resposta: hoje,
  });
  const resp1 = await knex("formulario_resposta")
    .where({ id_formulario: formulario.id_formulario, id_celula: celulas[0].id_celula })
    .orderBy("id_resposta", "desc")
    .first();
  const idResposta1 = resp1?.id_resposta;

  // Resposta antiga (atrasada) para célula 2 - há 15 dias
  const diasAtras = new Date(hoje);
  diasAtras.setDate(diasAtras.getDate() - 15);
  await knex("formulario_resposta").insert({
    id_formulario: formulario.id_formulario,
    id_usuario: lider.id_usuario,
    id_celula: celulas[1]?.id_celula ?? celulas[0].id_celula,
    data_resposta: diasAtras,
  });
  const resp2 = await knex("formulario_resposta")
    .where({ id_formulario: formulario.id_formulario, id_celula: celulas[1]?.id_celula ?? celulas[0].id_celula })
    .orderBy("id_resposta", "desc")
    .first();
  const idResposta2 = resp2?.id_resposta;

  if (!idResposta1 || !idResposta2) {
    console.log("Erro ao obter IDs das respostas inseridas.");
    return;
  }

  const valores1 = [
    hoje.toISOString().split("T")[0],
    "12",
    "Reunião de oração e estudo.",
    "Membro compartilhou sobre resposta de oração.",
  ];
  const valores2 = [
    diasAtras.toISOString().split("T")[0],
    "8",
    "Estudo bíblico sobre fruto do Espírito.",
    "",
  ];

  const resposta1Campos = formularioCampos.map((fc, idx) => ({
    id_resposta: idResposta1,
    id_formulario_campo: fc.id,
    valor: valores1[idx] ?? "",
  }));

  const resposta2Campos = formularioCampos.map((fc, idx) => ({
    id_resposta: idResposta2,
    id_formulario_campo: fc.id,
    valor: valores2[idx] ?? "",
  }));

  await knex("formulario_resposta_campo").insert([...resposta1Campos, ...resposta2Campos]);

  console.log("✅ Respostas de formulário inseridas com sucesso!");
}
