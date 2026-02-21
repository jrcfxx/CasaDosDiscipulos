import knex from "../database/index.js";

/**
 * Seed para ministérios
 * Cria todos os ministérios comuns de uma igreja, vincula líderes e participantes
 * Depende de: seed_usuario
 */
const MINISTERIOS = [
  { nome: "Louvor", descricao: "Ministério de louvor e música", ordem: 1 },
  { nome: "Som", descricao: "Operação de som, áudio e mesa", ordem: 2 },
  { nome: "Voluntários", descricao: "Acolhimento e recepção de visitantes", ordem: 3 },
  { nome: "Intercessão", descricao: "Ministério de oração e intercessão", ordem: 4 },
  { nome: "Casa Kids", descricao: "Ministério com crianças", ordem: 5 },
  { nome: "Adolescentes", descricao: "Ministério com adolescentes", ordem: 6 },
  { nome: "Juventude", descricao: "Ministério de jovens", ordem: 7 },
  { nome: "Mídia", descricao: "Projeção, slides e transmissão", ordem: 8 },
  { nome: "Liturgia", descricao: "Condução do culto e ordem do serviço", ordem: 9 },
  { nome: "Diaconia", descricao: "Serviço, Santa Ceia, ofertas e ordem", ordem: 10 },
  { nome: "Hospitalidade", descricao: "Café, lanche e alimentação", ordem: 11 },
  { nome: "Palavra", descricao: "Pregação e ensino", ordem: 12 },
  { nome: "Condução", descricao: "Coordenação e condução geral do evento", ordem: 13 },
  { nome: "Social", descricao: "Ação social e assistência", ordem: 14 },
  { nome: "Visitação", descricao: "Visitas e acompanhamento", ordem: 15 },
  { nome: "Casais", descricao: "Ministério de casais", ordem: 16 },
  { nome: "Transporte", descricao: "Transporte e carona", ordem: 17 },
  { nome: "Manutenção", descricao: "Manutenção e zeladoria", ordem: 18 },
];

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
    .where({ ativo: true })
    .orderBy("id_usuario");

  const getMinisterio = (nome) => ministerios.find((m) => m.nome === nome);
  const getUsuario = (email) => usuarios.find((u) => u.email === email);

  const louvor = getMinisterio("Louvor");
  const som = getMinisterio("Som");
  const voluntarios = getMinisterio("Voluntários");
  const intercessao = getMinisterio("Intercessão");
  const casaKids = getMinisterio("Casa Kids");
  const adolescentes = getMinisterio("Adolescentes");
  const juventude = getMinisterio("Juventude");
  const midia = getMinisterio("Mídia");
  const liturgia = getMinisterio("Liturgia");
  const diaconia = getMinisterio("Diaconia");
  const hospitalidade = getMinisterio("Hospitalidade");
  const palavra = getMinisterio("Palavra");
  const conducao = getMinisterio("Condução");
  const social = getMinisterio("Social");
  const visitacao = getMinisterio("Visitação");
  const casais = getMinisterio("Casais");
  const transporte = getMinisterio("Transporte");
  const manutencao = getMinisterio("Manutenção");

  const lider2 = getUsuario("lider2@test.com");
  const lider1 = getUsuario("lider@test.com");
  const ana = getUsuario("ana.lider@test.com");
  const carlos = getUsuario("carlos.lider@test.com");
  const membro1 = getUsuario("membro@test.com");
  const maria = getUsuario("maria@test.com");
  const admin = getUsuario("admin@test.com");
  const joao = getUsuario("joao@test.com");
  const fernanda = getUsuario("fernanda@test.com");
  const pedro = getUsuario("pedro@test.com");
  const juliana = getUsuario("juliana@test.com");
  const roberto = getUsuario("roberto@test.com");
  const amanda = getUsuario("amanda@test.com");
  const lucas = getUsuario("lucas@test.com");
  const beatriz = getUsuario("beatriz@test.com");
  const gabriel = getUsuario("gabriel@test.com");
  const carla = getUsuario("carla@test.com");
  const bruno = getUsuario("bruno@test.com");
  const patricia = getUsuario("patricia@test.com");
  const ricardo = getUsuario("ricardo@test.com");
  const sandra = getUsuario("sandra@test.com");

  // Líderes de ministério
  const vinculosLider = [];
  if (lider2 && louvor) vinculosLider.push({ id_ministerio: louvor.id_ministerio, id_usuario: lider2.id_usuario });
  if (lider1 && som) vinculosLider.push({ id_ministerio: som.id_ministerio, id_usuario: lider1.id_usuario });
  if (lider2 && voluntarios) vinculosLider.push({ id_ministerio: voluntarios.id_ministerio, id_usuario: lider2.id_usuario });
  if (ana && intercessao) vinculosLider.push({ id_ministerio: intercessao.id_ministerio, id_usuario: ana.id_usuario });
  if (lider1 && casaKids) vinculosLider.push({ id_ministerio: casaKids.id_ministerio, id_usuario: lider1.id_usuario });
  if (ana && adolescentes) vinculosLider.push({ id_ministerio: adolescentes.id_ministerio, id_usuario: ana.id_usuario });
  if (lider2 && juventude) vinculosLider.push({ id_ministerio: juventude.id_ministerio, id_usuario: lider2.id_usuario });
  if (lider2 && midia) vinculosLider.push({ id_ministerio: midia.id_ministerio, id_usuario: lider2.id_usuario });
  if (carlos && liturgia) vinculosLider.push({ id_ministerio: liturgia.id_ministerio, id_usuario: carlos.id_usuario });
  if (carlos && diaconia) vinculosLider.push({ id_ministerio: diaconia.id_ministerio, id_usuario: carlos.id_usuario });
  if (maria && hospitalidade) vinculosLider.push({ id_ministerio: hospitalidade.id_ministerio, id_usuario: maria.id_usuario });
  if (patricia && palavra) vinculosLider.push({ id_ministerio: palavra.id_ministerio, id_usuario: patricia.id_usuario });
  if (lider2 && conducao) vinculosLider.push({ id_ministerio: conducao.id_ministerio, id_usuario: lider2.id_usuario });
  if (ana && social) vinculosLider.push({ id_ministerio: social.id_ministerio, id_usuario: ana.id_usuario });
  if (maria && visitacao) vinculosLider.push({ id_ministerio: visitacao.id_ministerio, id_usuario: maria.id_usuario });
  if (carlos && casais) vinculosLider.push({ id_ministerio: casais.id_ministerio, id_usuario: carlos.id_usuario });
  if (joao && transporte) vinculosLider.push({ id_ministerio: transporte.id_ministerio, id_usuario: joao.id_usuario });
  if (roberto && manutencao) vinculosLider.push({ id_ministerio: manutencao.id_ministerio, id_usuario: roberto.id_usuario });

  if (vinculosLider.length > 0) {
    await knex("ministerio_lider").insert(vinculosLider);
    const idsLideres = [...new Set(vinculosLider.map((v) => v.id_usuario))];
    await knex("usuario").whereIn("id_usuario", idsLideres).update({ lider_ministerio: true });
  }

  // Participantes - cada ministério com vários membros
  const participa = [];
  const addParticipa = (min, ...users) => {
    if (!min) return;
    users.filter(Boolean).forEach((u) => participa.push({ id_ministerio: min.id_ministerio, id_usuario: u.id_usuario }));
  };

  addParticipa(louvor, lider2, membro1, maria, fernanda, juliana, amanda);
  addParticipa(som, lider1, admin, joao, pedro, lucas);
  addParticipa(voluntarios, lider2, maria, membro1, beatriz, carla, sandra);
  addParticipa(intercessao, ana, maria, fernanda, juliana, patricia, carla);
  addParticipa(casaKids, lider1, maria, amanda, beatriz, sandra);
  addParticipa(adolescentes, ana, fernanda, juliana, lucas, gabriel);
  addParticipa(juventude, lider2, joao, pedro, fernanda, lucas, beatriz);
  addParticipa(midia, lider2, admin, pedro, ricardo);
  addParticipa(liturgia, carlos, lider2, patricia, fernanda);
  addParticipa(diaconia, carlos, joao, roberto, bruno);
  addParticipa(hospitalidade, maria, amanda, beatriz, sandra);
  addParticipa(palavra, patricia, lider2, carlos, fernanda);
  addParticipa(conducao, lider2, carlos, patricia);
  addParticipa(social, ana, maria, joao, ricardo, carla);
  addParticipa(visitacao, maria, fernanda, amanda, sandra);
  addParticipa(casais, carlos, maria, joao, fernanda, beatriz);
  addParticipa(transporte, joao, pedro, lucas, bruno, ricardo);
  addParticipa(manutencao, roberto, bruno, lucas, gabriel);

  if (participa.length > 0) {
    await knex("usuario_ministerio").insert(participa);
  }

  console.log(`✅ ${MINISTERIOS.length} ministérios inseridos com sucesso!`);
}
