/**
 * Teste de integração das regras da escala (usa o banco de DESENVOLVIMENTO).
 * Cria eventos de teste, valida as regras e apaga tudo no final.
 * Uso: node scripts/testEscalaRegras.js
 */
import knex from "../src/database/index.js";
import EscalaService from "../src/services/EscalaService.js";
import WhatsAppService from "../src/services/WhatsAppService.js";
import { USER_TYPES } from "../src/utils/constants.js";

if (process.env.NODE_ENV === "production") {
  console.error("Não rode este teste em produção.");
  process.exit(1);
}

// Nunca envia WhatsApp de verdade durante o teste
WhatsAppService.estaConfigurado = () => false;

const ADMIN = USER_TYPES.ADMIN;
let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${msg}`);
  if (!cond) falhas += 1;
};
const espera = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e;
  }
};
const eventosCriados = [];
const vinculosCriados = [];

async function notifs(idUsuario, idEvento) {
  const [{ n }] = await knex("notificacao")
    .where({ id_usuario: idUsuario, id_escala_evento: idEvento })
    .count({ n: "*" });
  return Number(n);
}

async function main() {
  const admin = await knex("usuario").where({ tipo: ADMIN, ativo: true }).first();
  const mins = await knex("ministerio").where({ ativo: true }).orderBy("id_ministerio").limit(2);
  if (!admin || mins.length < 2) throw new Error("Precisa de um admin e 2 ministérios (rode o seed)");
  const pessoa = await knex("usuario").where({ ativo: true }).whereNot("id_usuario", admin.id_usuario).first();
  const membro = await knex("usuario").where({ tipo: USER_TYPES.MEMBER, ativo: true }).first();
  // A pessoa participa dos dois ministérios (cópias de evento só levam quem é do ministério)
  for (const m of mins) {
    const ja = await knex("usuario_ministerio").where({ id_usuario: pessoa.id_usuario, id_ministerio: m.id_ministerio }).first();
    if (!ja) {
      await knex("usuario_ministerio").insert({ id_usuario: pessoa.id_usuario, id_ministerio: m.id_ministerio });
      vinculosCriados.push({ id_usuario: pessoa.id_usuario, id_ministerio: m.id_ministerio });
    }
  }
  await knex("ministerio_paralelismo")
    .where({ id_ministerio: mins[0].id_ministerio, id_ministerio_paralelo: mins[1].id_ministerio })
    .orWhere({ id_ministerio: mins[1].id_ministerio, id_ministerio_paralelo: mins[0].id_ministerio })
    .del();

  // 1) Rascunho: horário preservado e nenhuma notificação
  const ev = await EscalaService.createEvento(
    {
      titulo: "TESTE regras escala",
      data_hora: new Date(2031, 0, 5, 19, 0, 0), // como o Joi entrega
      data_hora_fim: "2031-01-05 21:00:00",
      status: "rascunho",
      id_ministerios: mins.map((m) => m.id_ministerio),
    },
    admin.id_usuario,
    ADMIN
  );
  eventosCriados.push(ev.id_escala_evento);
  const [areaA, areaB] = ev.areas;
  const bruto = await knex.raw(
    "SELECT DATE_FORMAT(data_hora, '%Y-%m-%d %H:%i') d FROM escala_evento WHERE id_escala_evento = ?",
    [ev.id_escala_evento]
  );
  ok(bruto[0][0].d === "2031-01-05 19:00", `horário gravado = 19:00 (gravado: ${bruto[0][0].d})`);

  await EscalaService.addAtribuicao(areaA.id_escala_area, pessoa.id_usuario, admin.id_usuario, ADMIN, {});
  ok((await notifs(pessoa.id_usuario, ev.id_escala_evento)) === 0, "rascunho: escalar não notifica");

  // 2) Exceção: mesma pessoa em outro ministério do mesmo evento pede confirmação
  const err = await espera(() =>
    EscalaService.addAtribuicao(areaB.id_escala_area, pessoa.id_usuario, admin.id_usuario, ADMIN, {})
  );
  ok(err?.statusCode === 409 && err.confirmavel === true, "duplicado no evento → 409 confirmável");
  ok(/neste evento/.test(err?.message || ""), `mensagem clara: "${err?.message}"`);

  const candidatos = await EscalaService.getUsuariosParaEscalar(ev.id_escala_evento, admin.id_usuario, ADMIN);
  const c = candidatos.find((u) => u.id_usuario === pessoa.id_usuario);
  ok(c?.ja_escalado === true && c.areas_no_evento.length === 1, "candidato aparece marcado como já escalado");

  const errSem = await espera(() =>
    EscalaService.addAtribuicao(areaB.id_escala_area, pessoa.id_usuario, admin.id_usuario, ADMIN, {}, {
      confirmarConflitos: true,
    })
  );
  ok(errSem === null, "com confirmação a exceção é aceita");

  // Paralelismo configurado: sem pergunta
  const pessoa2 = await knex("usuario")
    .where({ ativo: true })
    .whereNotIn("id_usuario", [admin.id_usuario, pessoa.id_usuario])
    .first();
  await knex("ministerio_paralelismo").insert({
    id_ministerio: mins[0].id_ministerio,
    id_ministerio_paralelo: mins[1].id_ministerio,
  });
  await EscalaService.addAtribuicao(areaA.id_escala_area, pessoa2.id_usuario, admin.id_usuario, ADMIN, {});
  const errPar = await espera(() =>
    EscalaService.addAtribuicao(areaB.id_escala_area, pessoa2.id_usuario, admin.id_usuario, ADMIN, {})
  );
  ok(errPar === null, "ministérios paralelos: entra direto, sem conflito");
  await knex("ministerio_paralelismo")
    .where({ id_ministerio: mins[0].id_ministerio, id_ministerio_paralelo: mins[1].id_ministerio })
    .del();

  // 3) Membro não vê rascunho
  if (membro) {
    const errM = await espera(() => EscalaService.getEventoCompleto(ev.id_escala_evento, membro.id_usuario, USER_TYPES.MEMBER));
    ok(errM?.statusCode === 404, "membro não abre rascunho");
    const visao = await EscalaService.getVisualizacaoDia("2031-01-05", membro.id_usuario, USER_TYPES.MEMBER);
    ok(!visao.dados.eventos.some((e) => e.id === ev.id_escala_evento), "rascunho fora da visão do membro");
    const errP = await espera(() =>
      EscalaService.getEscalasDaPessoa(pessoa.id_usuario, "2031-01-01", "2031-01-31", {
        id_usuario: membro.id_usuario,
        tipo: USER_TYPES.MEMBER,
      })
    );
    ok(membro.id_usuario === pessoa.id_usuario || errP?.statusCode === 403, "membro não consulta escala de outra pessoa");
  }

  // 4) Publicar notifica uma única vez
  await EscalaService.publicarEvento(ev.id_escala_evento, admin.id_usuario, ADMIN);
  const n1 = await notifs(pessoa.id_usuario, ev.id_escala_evento);
  ok(n1 === 2, `publicação notifica cada função da pessoa (${n1})`);
  await EscalaService.publicarEvento(ev.id_escala_evento, admin.id_usuario, ADMIN);
  ok((await notifs(pessoa.id_usuario, ev.id_escala_evento)) === n1, "republicar não reenvia");

  // 5) Copiar dia mantém o horário
  const copia = await EscalaService.copiarDia("2031-01-05", "2031-01-12", admin.id_usuario, ADMIN);
  for (const d of copia.dados) eventosCriados.push(d.id_escala_evento);
  const b2 = await knex.raw(
    "SELECT DATE_FORMAT(data_hora, '%Y-%m-%d %H:%i') d FROM escala_evento WHERE id_escala_evento = ?",
    [copia.dados[0].id_escala_evento]
  );
  ok(b2[0][0].d === "2031-01-12 19:00", `copiar dia mantém 19:00 (${b2[0][0].d})`);

  // 6) Desfazer remoção restaura a pessoa
  const atrib = await knex("escala_atribuicao").where({ id_escala_area: areaA.id_escala_area, id_usuario: pessoa.id_usuario }).first();
  await EscalaService.removeAtribuicao(atrib.id_escala_atribuicao, admin.id_usuario, ADMIN);
  await EscalaService.desfazerUltimaAlteracao(ev.id_escala_evento, admin.id_usuario, ADMIN);
  const voltou = await knex("escala_atribuicao").where({ id_escala_area: areaA.id_escala_area, id_usuario: pessoa.id_usuario }).first();
  ok(!!voltou, "desfazer recoloca a pessoa removida");

  // 7) Mudar horário avisa choque com outro evento
  const upd = await EscalaService.updateEvento(
    copia.dados[0].id_escala_evento,
    { data_hora: new Date(2031, 0, 5, 20, 0, 0), data_hora_fim: new Date(2031, 0, 5, 22, 0, 0) },
    ADMIN,
    admin.id_usuario
  );
  ok(upd.avisos?.length > 0, `mudança de horário gera avisos (${upd.avisos?.length})`);
}

main()
  .catch((e) => {
    console.error("ERRO:", e);
    falhas += 1;
  })
  .finally(async () => {
    for (const id of eventosCriados) {
      await knex("notificacao").where("id_escala_evento", id).del().catch(() => {});
      await knex("escala_evento").where("id_escala_evento", id).del().catch(() => {});
    }
    for (const v of vinculosCriados) {
      await knex("usuario_ministerio").where(v).del().catch(() => {});
    }
    await knex.destroy();
    console.log(falhas ? `\n${falhas} falha(s)` : "\nTodos os testes passaram.");
    process.exit(falhas ? 1 : 0);
  });
