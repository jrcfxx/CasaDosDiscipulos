/**
 * Controle de acesso e registro de segurança.
 *  - sessao: cada login vira uma sessão no servidor (dá para ver os aparelhos conectados
 *    e encerrar qualquer um na hora; o token sozinho não basta mais).
 *  - log_seguranca: registro de logins, falhas, bloqueios, trocas de senha e ações do admin
 *    sobre contas. Guardado por 180 dias (limpeza automática).
 *  - usuario: bloqueio temporário após várias senhas erradas e verificação em duas etapas (2FA).
 *
 * Ao aplicar, as sessões antigas (sem registro no servidor) deixam de valer: todos entram de novo uma vez.
 * @param { import("knex").Knex } knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("sessao", (table) => {
    table.string("id_sessao", 64).primary();
    table.integer("id_usuario").unsigned().notNullable().references("usuario.id_usuario").onDelete("CASCADE");
    table.string("ip", 45).nullable();
    table.string("user_agent", 255).nullable();
    table.string("dispositivo", 80).nullable().comment("Resumo legível: navegador e sistema");
    table.timestamp("criada_em").notNullable().defaultTo(knex.fn.now());
    table.timestamp("ultimo_uso").notNullable().defaultTo(knex.fn.now());
    table.dateTime("expira_em").notNullable();
    table.dateTime("revogada_em").nullable();
    table.string("motivo_revogacao", 40).nullable();
    table.index(["id_usuario", "revogada_em"]);
  });

  await knex.schema.createTable("log_seguranca", (table) => {
    table.bigIncrements("id_log").primary();
    table.string("evento", 40).notNullable();
    table.string("resultado", 20).notNullable().defaultTo("sucesso");
    table.integer("id_usuario").unsigned().nullable().references("usuario.id_usuario").onDelete("SET NULL");
    table.integer("id_ator").unsigned().nullable().references("usuario.id_usuario").onDelete("SET NULL")
      .comment("Quem fez a ação (ex.: admin que redefiniu a senha)");
    table.string("email", 120).nullable().comment("E-mail digitado no login (falhas)");
    table.string("ip", 45).nullable();
    table.string("user_agent", 255).nullable();
    table.text("detalhes").nullable().comment("JSON com dados extras, nunca senha ou token");
    table.timestamp("criado_em").notNullable().defaultTo(knex.fn.now());
    table.index(["criado_em"]);
    table.index(["id_usuario", "criado_em"]);
    table.index(["evento", "criado_em"]);
    table.index(["ip", "criado_em"]);
  });

  await knex.schema.alterTable("usuario", (table) => {
    table.integer("tentativas_falhas").unsigned().notNullable().defaultTo(0);
    table.dateTime("ultima_falha_em").nullable().comment("Sem falhas por 24 h, a contagem recomeça");
    table.dateTime("bloqueado_ate").nullable();
    table.boolean("totp_ativo").notNullable().defaultTo(false);
    table.string("totp_segredo", 255).nullable().comment("Segredo do 2FA, criptografado (AES-256-GCM)");
    table.bigInteger("totp_ultimo_passo").nullable().comment("Impede reutilizar o mesmo código");
    table.text("codigos_recuperacao").nullable().comment("JSON com hashes dos códigos de recuperação");
  });
};

exports.down = async (knex) => {
  await knex.schema.alterTable("usuario", (table) => {
    table.dropColumn("tentativas_falhas");
    table.dropColumn("ultima_falha_em");
    table.dropColumn("bloqueado_ate");
    table.dropColumn("totp_ativo");
    table.dropColumn("totp_segredo");
    table.dropColumn("totp_ultimo_passo");
    table.dropColumn("codigos_recuperacao");
  });
  await knex.schema.dropTableIfExists("log_seguranca");
  await knex.schema.dropTableIfExists("sessao");
};
