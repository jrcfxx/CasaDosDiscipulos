import knex from "../database/index.js";

/**
 * Seed para campos de formulário
 * Define os campos que compõem cada formulário da Secretaria das Células
 */
export async function seed() {
  await knex("formulario_campo").del();

  // Buscar IDs dos campos
  const campoTexto = await knex("campo_personalizado")
    .where({ tipo_campo: "texto" })
    .first();
  const campoNumero = await knex("campo_personalizado")
    .where({ tipo_campo: "numero" })
    .first();
  const campoData = await knex("campo_personalizado")
    .where({ tipo_campo: "data" })
    .first();

  const formularios = await knex("formulario")
    .select("id_formulario")
    .orderBy("id_formulario");

  if (!campoTexto || !campoNumero || !campoData || formularios.length === 0) {
    console.log(
      "Execute seed_campo_personalizado.js e seed_formulario.js primeiro."
    );
    return;
  }

  const campos = [];

  // FORMULÁRIO 1: Relatório de Célula
  if (formularios[0]) {
    campos.push(
      {
        id_formulario: formularios[0].id_formulario,
        id_campo: campoData.id_campo,
        label: "Data da reunião",
        conteudo: "Informe a data em que a célula se reuniu",
        ordem: 1,
        obrigatorio: true,
      },
      {
        id_formulario: formularios[0].id_formulario,
        id_campo: campoNumero.id_campo,
        label: "Número de presentes",
        conteudo: "Quantas pessoas participaram da reunião?",
        ordem: 2,
        obrigatorio: true,
      },
      {
        id_formulario: formularios[0].id_formulario,
        id_campo: campoTexto.id_campo,
        label: "Resumo da reunião",
        conteudo: "Descreva brevemente como foi a reunião",
        ordem: 3,
        obrigatorio: true,
      },
      {
        id_formulario: formularios[0].id_formulario,
        id_campo: campoTexto.id_campo,
        label: "Testemunhos",
        conteudo: "Houve algum testemunho especial? Compartilhe aqui",
        ordem: 4,
        obrigatorio: false,
      }
    );
  }

  // FORMULÁRIO 2: Pedidos de Oração
  if (formularios[1]) {
    campos.push(
      {
        id_formulario: formularios[1].id_formulario,
        id_campo: campoTexto.id_campo,
        label: "Nome do solicitante",
        conteudo: "Nome de quem está pedindo oração",
        ordem: 1,
        obrigatorio: true,
      },
      {
        id_formulario: formularios[1].id_formulario,
        id_campo: campoTexto.id_campo,
        label: "Motivo do pedido",
        conteudo: "Descreva o pedido de oração",
        ordem: 2,
        obrigatorio: true,
      },
      {
        id_formulario: formularios[1].id_formulario,
        id_campo: campoData.id_campo,
        label: "Data do pedido",
        conteudo: "",
        ordem: 3,
        obrigatorio: false,
      }
    );
  }

  // FORMULÁRIO 3: Avaliação de Evento
  if (formularios[2]) {
    campos.push(
      { id_formulario: formularios[2].id_formulario, id_campo: campoTexto.id_campo, label: "Nome completo", conteudo: "", ordem: 1, obrigatorio: true },
      { id_formulario: formularios[2].id_formulario, id_campo: campoNumero.id_campo, label: "Nota do evento (1-10)", conteudo: "Como você avalia o evento?", ordem: 2, obrigatorio: true },
      { id_formulario: formularios[2].id_formulario, id_campo: campoTexto.id_campo, label: "Comentários e sugestões", conteudo: "Deixe suas impressões sobre o evento", ordem: 3, obrigatorio: false }
    );
  }

  // FORMULÁRIO 4: Visitas Realizadas
  if (formularios[3]) {
    campos.push(
      { id_formulario: formularios[3].id_formulario, id_campo: campoData.id_campo, label: "Data da visita", conteudo: "", ordem: 1, obrigatorio: true },
      { id_formulario: formularios[3].id_formulario, id_campo: campoTexto.id_campo, label: "Nome visitado", conteudo: "Quem foi visitado", ordem: 2, obrigatorio: true },
      { id_formulario: formularios[3].id_formulario, id_campo: campoTexto.id_campo, label: "Relato", conteudo: "Como foi a visita", ordem: 3, obrigatorio: false }
    );
  }

  // FORMULÁRIO 5: Relatório de Ministério
  if (formularios[4]) {
    campos.push(
      { id_formulario: formularios[4].id_formulario, id_campo: campoData.id_campo, label: "Período", conteudo: "Mês do relatório", ordem: 1, obrigatorio: true },
      { id_formulario: formularios[4].id_formulario, id_campo: campoTexto.id_campo, label: "Atividades", conteudo: "O que foi realizado", ordem: 2, obrigatorio: true },
      { id_formulario: formularios[4].id_formulario, id_campo: campoNumero.id_campo, label: "Participantes", conteudo: "Quantas pessoas participaram", ordem: 3, obrigatorio: false }
    );
  }

  // FORMULÁRIO 6: Feedback de Culto
  if (formularios[5]) {
    campos.push(
      { id_formulario: formularios[5].id_formulario, id_campo: campoData.id_campo, label: "Data do culto", conteudo: "", ordem: 1, obrigatorio: true },
      { id_formulario: formularios[5].id_formulario, id_campo: campoNumero.id_campo, label: "Nota (1-10)", conteudo: "", ordem: 2, obrigatorio: true },
      { id_formulario: formularios[5].id_formulario, id_campo: campoTexto.id_campo, label: "Sugestões", conteudo: "", ordem: 3, obrigatorio: false }
    );
  }

  await knex("formulario_campo").insert(campos);

  console.log(`✅ ${campos.length} campos de formulário inseridos com sucesso!`);
}
