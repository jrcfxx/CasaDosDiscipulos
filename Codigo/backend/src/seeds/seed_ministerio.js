import knex from "../database/index.js";

/**
 * Seed oficial — Ministérios Staff Casa 2026
 * Depende de: seed_usuario
 */
const MINISTERIOS = [
  { nome: "Pastoral", descricao: "Pastoral — Pr. Wanderson e equipe", ordem: 1 },
  { nome: "Escola de Discípulos", descricao: "Formação e discipulado — Iza / Evaldo", ordem: 2 },
  { nome: "Kids", descricao: "Ministério infantil — Iza", ordem: 3 },
  { nome: "Adolescentes", descricao: "Ministério com adolescentes", ordem: 4 },
  { nome: "Juventude", descricao: "Ministério de jovens — Ana Paula", ordem: 5 },
  { nome: "Mulheres Casa", descricao: "Ministério de mulheres — Simone", ordem: 6 },
  { nome: "Casais Casa", descricao: "Ministério de casais — Tabelines", ordem: 7 },
  { nome: "Louvor", descricao: "Ministério de louvor — Samuel Augusto", ordem: 8 },
  { nome: "Intercessão", descricao: "Oração e intercessão — Lea", ordem: 9 },
  { nome: "Dança", descricao: "Ministério de dança — Lorrayne Carmo", ordem: 10 },
  { nome: "Coral", descricao: "Coral — Normandes Resende", ordem: 11 },
  { nome: "Ação Social", descricao: "Ação social — Elinar", ordem: 12 },
  { nome: "Voluntários", descricao: "Acolhimento e voluntariado — Lorrayne Andrade", ordem: 13 },
  { nome: "Mídia", descricao: "Mídia e comunicação — Thais", ordem: 14 },
  { nome: "Secretaria de Células", descricao: "Secretaria das células", ordem: 15 },
  { nome: "Decoração", descricao: "Decoração — Lo Andrade", ordem: 16 },
  { nome: "Manutenção", descricao: "Manutenção — Cleiton", ordem: 17 },
  // Apoio à escala (mantidos para o módulo Escala)
  { nome: "Som", descricao: "Operação de som e áudio", ordem: 18 },
  { nome: "Diaconia", descricao: "Serviço, Santa Ceia e ofertas", ordem: 19 },
  { nome: "Hospitalidade", descricao: "Café e acolhimento", ordem: 20 },
];

const LIDER_POR_MINISTERIO = {
  Pastoral: "wanderson.lino@casadosdiscipulos.org",
  "Escola de Discípulos": "iza@casadosdiscipulos.org",
  Kids: "iza@casadosdiscipulos.org",
  Adolescentes: "ana.paula@casadosdiscipulos.org",
  Juventude: "ana.paula@casadosdiscipulos.org",
  "Mulheres Casa": "simone@casadosdiscipulos.org",
  "Casais Casa": "tabelines@casadosdiscipulos.org",
  Louvor: "samuel.augusto@casadosdiscipulos.org",
  Intercessão: "lea@casadosdiscipulos.org",
  Dança: "lorrayne.carmo@casadosdiscipulos.org",
  Coral: "normandes.resende@casadosdiscipulos.org",
  "Ação Social": "elinar@casadosdiscipulos.org",
  Voluntários: "lorrayne.andrade@casadosdiscipulos.org",
  Mídia: "thais@casadosdiscipulos.org",
  "Secretaria de Células": "lorrayne.andrade@casadosdiscipulos.org",
  Decoração: "lo.andrade@casadosdiscipulos.org",
  Manutenção: "cleiton@casadosdiscipulos.org",
  Som: "lider@test.com",
  Diaconia: "arlem.cleizer@casadosdiscipulos.org",
  Hospitalidade: "wilza.leal@casadosdiscipulos.org",
};

export async function seed() {
  await knex("usuario_ministerio").del();
  await knex("ministerio_lider").del();
  await knex("ministerio").del();

  await knex("ministerio").insert(
    MINISTERIOS.map((m) => ({ ...m, ativo: true }))
  );

  const ministerios = await knex("ministerio").select("id_ministerio", "nome").orderBy("ordem");
  const usuarios = await knex("usuario")
    .select("id_usuario", "email")
    .where({ ativo: true });

  const getMinisterio = (nome) => ministerios.find((m) => m.nome === nome);
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  const vinculosLider = [];
  for (const [nomeMin, email] of Object.entries(LIDER_POR_MINISTERIO)) {
    const min = getMinisterio(nomeMin);
    const user = getUsuario(email);
    if (min && user) {
      vinculosLider.push({
        id_ministerio: min.id_ministerio,
        id_usuario: user.id_usuario,
      });
    }
  }

  // Co-líder Escola de Discípulos: Evaldo
  const escola = getMinisterio("Escola de Discípulos");
  const evaldo = getUsuario("evaldo@casadosdiscipulos.org");
  if (escola && evaldo) {
    vinculosLider.push({
      id_ministerio: escola.id_ministerio,
      id_usuario: evaldo.id_usuario,
    });
  }

  if (vinculosLider.length > 0) {
    // remove duplicatas
    const uniq = [];
    const seen = new Set();
    for (const v of vinculosLider) {
      const key = `${v.id_ministerio}-${v.id_usuario}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(v);
      }
    }
    await knex("ministerio_lider").insert(uniq);
    const idsLideres = [...new Set(uniq.map((v) => v.id_usuario))];
    await knex("usuario").whereIn("id_usuario", idsLideres).update({ lider_ministerio: true });
  }

  // Participantes demo nos ministérios principais (escala)
  const participa = [];
  const add = (minNome, ...emails) => {
    const min = getMinisterio(minNome);
    if (!min) return;
    emails.forEach((email) => {
      const u = getUsuario(email);
      if (u) participa.push({ id_ministerio: min.id_ministerio, id_usuario: u.id_usuario });
    });
  };

  add("Louvor", "membro@test.com", "maria@test.com", "fernanda@test.com", "lucas@test.com");
  add("Som", "joao@test.com", "pedro@test.com", "bruno@test.com");
  add("Voluntários", "juliana@test.com", "beatriz@test.com", "carla@test.com");
  add("Mídia", "gabriel@test.com", "amanda@test.com");
  add("Juventude", "membro@test.com", "lucas@test.com", "beatriz@test.com");
  add("Kids", "maria@test.com", "sandra@test.com");
  add("Intercessão", "patricia@test.com", "nuzia.resende@casadosdiscipulos.org");
  add("Diaconia", "ricardo@test.com", "roberto@test.com");

  if (participa.length > 0) {
    const uniqP = [];
    const seenP = new Set();
    for (const p of participa) {
      const key = `${p.id_ministerio}-${p.id_usuario}`;
      if (!seenP.has(key)) {
        seenP.add(key);
        uniqP.push(p);
      }
    }
    await knex("usuario_ministerio").insert(uniqP);
  }

  console.log(`✅ ${MINISTERIOS.length} ministérios oficiais inseridos!`);
}
