import knex from "../database/index.js";

/**
 * Seed para campos de módulo
 * Define o conteúdo dos módulos usando campos dinâmicos
 */
export async function seed() {
  await knex("modulo_campo").del();

  // Buscar IDs dos campos e módulos
  const campoTexto = await knex("campo_personalizado")
    .where({ tipo_campo: "texto" })
    .first();
  const campoLink = await knex("campo_personalizado")
    .where({ tipo_campo: "link" })
    .first();
  const campoUpload = await knex("campo_personalizado")
    .where({ tipo_campo: "upload" })
    .first();

  const modulos = await knex("modulo").select("id_modulo");

  if (modulos.length === 0 || !campoTexto) {
    console.log(
      "Execute seed_modulo.js e seed_campo_personalizado.js primeiro."
    );
    return;
  }

  await knex("modulo_campo").insert([
    // Módulo 1
    {
      id_modulo: modulos[0].id_modulo,
      id_campo: campoTexto.id_campo,
      label: "Introdução",
      conteudo:
        "Bem-vindo ao primeiro módulo! Aqui você aprenderá os fundamentos.",
      ordem: 1,
    },
    {
      id_modulo: modulos[0].id_modulo,
      id_campo: campoLink.id_campo,
      label: "Vídeo de apresentação",
      conteudo: "https://youtube.com/video-modulo-1",
      ordem: 2,
    },

    // Módulo 2 (se existir)
    ...(modulos.length > 1
      ? [
          {
            id_modulo: modulos[1].id_modulo,
            id_campo: campoTexto.id_campo,
            label: "Conteúdo principal",
            conteudo: "Neste módulo avançaremos nos estudos bíblicos.",
            ordem: 1,
          },
          {
            id_modulo: modulos[1].id_modulo,
            id_campo: campoUpload.id_campo,
            label: "Material de apoio",
            conteudo: "/uploads/modulo-2-apostila.pdf",
            ordem: 2,
          },
        ]
      : []),
  ]);

  console.log("✅ Campos de módulo inseridos com sucesso!");
}
