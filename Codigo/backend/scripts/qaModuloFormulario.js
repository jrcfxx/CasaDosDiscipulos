/**
 * QA de ponta a ponta da criação/edição de MÓDULOS e FORMULÁRIOS pela API.
 * Precisa do backend rodando em http://localhost:3001 (npm run dev) e do banco local.
 * Uso: npm run qa:modulos-formularios
 * Cria registros com título "QA …" e apaga tudo no final.
 */
import "dotenv/config";
import knex from "../src/database/index.js";
import { tokenDeTeste, encerrarSessoesDeTeste } from "./sessaoTeste.js";

const API = "http://localhost:3001/api";
const falhas = [];
let oks = 0;
const ok = (cond, nome, detalhe = "") => {
  if (cond) {
    oks++;
    console.log(`OK     ${nome}`);
  } else {
    falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);
    console.log(`FALHA  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
};

let token;
async function api(metodo, caminho, corpo) {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  let bruto = null;
  try {
    bruto = await r.json();
  } catch {
    /* sem corpo */
  }
  return { status: r.status, bruto };
}
const resumo = (r) => `status ${r.status} ${JSON.stringify(r.bruto).slice(0, 180)}`;

async function main() {
  const admin = await knex("usuario").where({ id_usuario: 182 }).first(); // admin de teste local (trocar_senha = 0)
  token = await tokenDeTeste(admin);
  const campos = await knex("campo_personalizado");
  const C = Object.fromEntries(campos.map((c) => [c.tipo_campo, c.id_campo]));

  console.log("\n== 1. Formulário: criação e validação");
  let r = await api("POST", "/formulario", { titulo: "   ", campos: [{ id_campo: C.texto, label: "Nome" }] });
  ok(r.status === 400, "título só com espaços é recusado", resumo(r));
  r = await api("POST", "/formulario", { titulo: "QA Sem campos", campos: [] });
  ok(r.status === 400, "formulário sem nenhum campo é recusado", resumo(r));
  r = await api("POST", "/formulario", { titulo: "QA Campo inválido", campos: [{ id_campo: 999999, label: "X" }] });
  ok(r.status === 400, "tipo de campo inexistente: 400 (não 500)", resumo(r));
  r = await api("POST", "/formulario", { titulo: "QA Campo de quiz", campos: [{ id_campo: C.multipla_escolha, label: "X" }] });
  ok(r.status === 400, "tipo de campo que não é de formulário: 400", resumo(r));
  r = await api("POST", "/formulario", {
    titulo: "QA Labels repetidos",
    campos: [{ id_campo: C.texto, label: "Nome" }, { id_campo: C.texto, label: " nome " }],
  });
  ok(r.status === 400, "dois campos com o mesmo nome: 400", resumo(r));
  r = await api("POST", "/formulario", { titulo: "QA Label vazio", campos: [{ id_campo: C.texto, label: "  " }] });
  ok(r.status === 400, "campo sem nome: 400", resumo(r));
  r = await api("POST", "/formulario", { titulo: "QA Freq", frequencia: "diaria", campos: [{ id_campo: C.texto, label: "A" }] });
  ok(r.status === 400, "frequência inválida: 400", resumo(r));

  r = await api("POST", "/formulario", {
    titulo: "  QA Relatório semanal  ",
    descricao: "  teste  ",
    frequencia: "semanal",
    campos: [
      { id_campo: C.data, label: "Data da reunião", obrigatorio: true, ordem: 0 },
      { id_campo: C.numero, label: "Presentes", obrigatorio: true, ordem: 1 },
      { id_campo: C.textarea, label: "Observações", ordem: 2 },
    ],
  });
  ok(r.status === 201, "formulário válido é criado", resumo(r));
  const form = r.bruto?.dados || r.bruto;
  const idForm = form?.id_formulario;
  ok(form?.titulo === "QA Relatório semanal", "título salvo sem espaços nas pontas", JSON.stringify(form?.titulo));
  ok(form?.campos?.length === 3 && form.campos.map((c) => c.label).join("|") === "Data da reunião|Presentes|Observações", "campos na ordem", JSON.stringify(form?.campos?.map((c) => c.label)));

  console.log("\n== 2. Formulário: edição preserva campos e respostas");
  const [presentes] = (form?.campos || []).filter((c) => c.label === "Presentes");
  const celula = await knex("celula").first();
  const [idResp] = await knex("formulario_resposta").insert({
    id_formulario: idForm,
    id_celula: celula.id_celula,
    id_usuario: admin.id_usuario,
    data_resposta: new Date(),
  });
  await knex("formulario_resposta_campo").insert({ id_resposta: idResp, id_formulario_campo: presentes.id, valor: "12" });

  // Só ativar/desativar: não pode mexer em frequência nem campos
  r = await api("PUT", `/formulario/${idForm}`, { ativo: false });
  ok(r.status === 200, "desativar só com {ativo:false} funciona", resumo(r));
  let atual = (await api("GET", `/formulario/${idForm}`)).bruto;
  atual = atual?.dados || atual;
  ok(atual?.frequencia === "semanal", "desativar não apaga a frequência", JSON.stringify(atual?.frequencia));
  ok(atual?.campos?.length === 3, "desativar não mexe nos campos", String(atual?.campos?.length));

  // Edição renomeando "Presentes" mantendo o id: a resposta continua ligada ao mesmo campo
  const editados = atual.campos.map((c, i) => ({
    id: c.id,
    id_campo: c.id_campo,
    label: c.label === "Presentes" ? "Pessoas presentes" : c.label,
    obrigatorio: Boolean(c.obrigatorio),
    ordem: i,
  }));
  r = await api("PUT", `/formulario/${idForm}`, { titulo: "QA Relatório semanal", campos: editados });
  ok(r.status === 200, "editar campos com id funciona", resumo(r));
  atual = (await api("GET", `/formulario/${idForm}`)).bruto;
  atual = atual?.dados || atual;
  ok(atual?.campos?.length === 3, "editar não duplica campos", JSON.stringify(atual?.campos?.map((c) => c.label)));
  const renomeado = atual?.campos?.find((c) => c.label === "Pessoas presentes");
  ok(renomeado?.id === presentes.id, "campo renomeado mantém o mesmo id (respostas continuam ligadas)", `${renomeado?.id} vs ${presentes.id}`);

  // Remover um campo que já tem resposta: some do formulário, mas a resposta antiga fica
  r = await api("PUT", `/formulario/${idForm}`, {
    campos: atual.campos.filter((c) => c.id !== presentes.id).map((c, i) => ({ id: c.id, id_campo: c.id_campo, label: c.label, ordem: i })),
  });
  ok(r.status === 200, "remover campo com resposta funciona", resumo(r));
  atual = (await api("GET", `/formulario/${idForm}`)).bruto;
  atual = atual?.dados || atual;
  ok(atual?.campos?.length === 2 && !atual.campos.some((c) => c.id === presentes.id), "campo removido não aparece mais no formulário", JSON.stringify(atual?.campos?.map((c) => c.label)));
  const valorAntigo = await knex("formulario_resposta_campo").where({ id_resposta: idResp }).first();
  ok(valorAntigo?.valor === "12", "a resposta antiga do campo removido continua guardada");
  const det = await api("GET", `/formulario-resposta/${idResp}`);
  ok(det.status === 200 && JSON.stringify(det.bruto).includes("12"), "a resposta antiga ainda mostra o valor", resumo(det));

  r = await api("PUT", `/formulario/${idForm}`, { campos: [] });
  ok(r.status === 400, "editar deixando o formulário sem campos: 400", resumo(r));
  r = await api("PUT", `/formulario/999999`, { ativo: true });
  ok(r.status === 404, "editar formulário inexistente: 404", resumo(r));
  r = await api("PUT", `/formulario/abc`, { ativo: true });
  ok(r.status === 400 || r.status === 404, "id inválido: 400/404", resumo(r));

  console.log("\n== 3. Formulário: exclusão");
  r = await api("DELETE", `/formulario/${idForm}`);
  ok(r.status === 200 || r.status === 204 || r.status === 409, "excluir formulário com respostas: não dá 500", resumo(r));

  console.log("\n== 4. Módulo: criação e validação");
  const nivel = await knex("nivel").first();
  r = await api("POST", "/modulo", { titulo: "  ab  " });
  ok(r.status === 400, "título com menos de 3 letras (sem contar espaços): 400", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Nível inexistente", id_nivel: 999999 });
  ok(r.status === 400, "nível inexistente: 400 (não 500)", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Pré inexistente", pre_requisitos: [999999] });
  ok(r.status === 400, "pré-requisito inexistente: 400 (não 500)", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Campo inválido", campos: [{ id_campo: 999999, label: "X", conteudo: "a" }] });
  ok(r.status === 400, "tipo de campo inexistente: 400 (não 500)", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Campo vazio", campos: [{ id_campo: C.texto, label: "Texto", conteudo: "   " }] });
  ok(r.status === 400, "conteúdo vazio: 400", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Link ruim", campos: [{ id_campo: C.link, label: "Site", conteudo: "não é link" }] });
  ok(r.status === 400, "link inválido: 400", resumo(r));

  r = await api("POST", "/modulo", {
    titulo: "  QA Módulo A  ",
    descricao: " desc ",
    ordem: 90,
    id_nivel: nivel?.id_nivel ?? null,
    campos: [
      { id_campo: C.texto, label: "Introdução", conteudo: "Olá", ordem: 1 },
      { id_campo: C.video, label: "Aula", conteudo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", ordem: 2 },
    ],
  });
  ok(r.status === 201, "módulo válido é criado", resumo(r));
  const modA = r.bruto?.dados || r.bruto;
  ok(modA?.titulo === "QA Módulo A", "título do módulo sem espaços nas pontas", JSON.stringify(modA?.titulo));
  ok(modA?.campos?.length === 2, "conteúdos do módulo salvos", String(modA?.campos?.length));
  r = await api("POST", "/modulo", { titulo: "QA Módulo B", ordem: 91, pre_requisitos: [modA?.id_modulo, modA?.id_modulo] });
  ok(r.status === 201, "pré-requisito repetido não quebra", resumo(r));
  const modB = r.bruto?.dados || r.bruto;

  console.log("\n== 5. Módulo: edição");
  r = await api("PUT", `/modulo/${modA?.id_modulo}`, { pre_requisitos: [modA?.id_modulo] });
  ok(r.status === 400, "módulo não pode ser pré-requisito de si mesmo", resumo(r));
  r = await api("PUT", `/modulo/${modA?.id_modulo}`, { pre_requisitos: [modB?.id_modulo] });
  ok(r.status === 400, "pré-requisito circular (A↔B) é recusado", resumo(r));
  r = await api("PUT", `/modulo/${modA?.id_modulo}`, { ativo: false });
  ok(r.status === 200, "desativar módulo só com {ativo:false}", resumo(r));
  const aDepois = (await api("GET", `/modulo/${modA?.id_modulo}`)).bruto;
  ok((aDepois?.dados || aDepois)?.campos?.length === 2, "desativar não apaga os conteúdos");
  r = await api("PUT", `/modulo/999999`, { ativo: true });
  ok(r.status === 404, "editar módulo inexistente: 404", resumo(r));
  r = await api("POST", `/modulo/${modA?.id_modulo}/quiz/999999`);
  ok(r.status === 404 || r.status === 400, "vincular quiz inexistente: 400/404", resumo(r));

  console.log("\n== 5b. Módulo: ordem da trilha arrastando");
  const todosMod = ((await api("GET", "/modulo")).bruto || []).map((m) => m.id_modulo);
  const invertidos = [...todosMod].reverse();
  r = await api("PUT", "/modulo/ordem", { ids: invertidos });
  ok(r.status === 200, "salvar nova ordem da trilha", resumo(r));
  const depoisMod = ((await api("GET", "/modulo")).bruto || []).map((m) => m.id_modulo);
  ok(JSON.stringify(depoisMod) === JSON.stringify(invertidos), "a lista volta na ordem salva", JSON.stringify(depoisMod.slice(0, 5)));
  r = await api("PUT", "/modulo/ordem", { ids: invertidos.slice(1) });
  ok(r.status === 400, "ordem faltando módulo: 400", resumo(r));
  r = await api("PUT", "/modulo/ordem", { ids: todosMod });
  ok(r.status === 200, "voltar a ordem original", resumo(r));
  r = await api("GET", `/modulo/${modA?.id_modulo}/total-progresso`);
  ok(r.status === 200 && r.bruto?.alunos === 0, "contagem de alunos para o aviso de excluir", resumo(r));
  r = await api("POST", "/modulo", { titulo: "QA Sem ordem" });
  const semOrdem = r.bruto?.dados || r.bruto;
  ok(r.status === 201 && Number(semOrdem?.ordem) >= todosMod.length, "módulo novo sem ordem entra no fim da trilha", `ordem ${semOrdem?.ordem}`);

  console.log("\n== 6. Módulo: exclusão");
  r = await api("DELETE", `/modulo/${modA?.id_modulo}/permanente`);
  ok(r.status === 200 || r.status === 204, "excluir módulo que é pré-requisito de outro", resumo(r));
}

main()
  .catch((e) => {
    falhas.push(`script parou: ${e.message}`);
    console.error("ERRO NO SCRIPT:", e);
  })
  .finally(async () => {
    const forms = await knex("formulario").where("titulo", "like", "QA %").select("id_formulario");
    const idsF = forms.map((f) => f.id_formulario);
    if (idsF.length) {
      const resps = await knex("formulario_resposta").whereIn("id_formulario", idsF).select("id_resposta");
      await knex("formulario_resposta_campo").whereIn("id_resposta", resps.map((x) => x.id_resposta)).del();
      await knex("formulario_resposta").whereIn("id_formulario", idsF).del();
      await knex("formulario_campo").whereIn("id_formulario", idsF).del();
      await knex("formulario").whereIn("id_formulario", idsF).del();
    }
    const mods = await knex("modulo").where("titulo", "like", "QA %").select("id_modulo");
    const idsM = mods.map((m) => m.id_modulo);
    if (idsM.length) {
      await knex("modulo_pre_requisito").whereIn("id_modulo", idsM).orWhereIn("id_modulo_requerido", idsM).del();
      await knex("usuario_modulo").whereIn("id_modulo", idsM).del();
      await knex("modulo_quiz").whereIn("id_modulo", idsM).del().catch(() => {});
      await knex("modulo_campo").whereIn("id_modulo", idsM).del();
      await knex("modulo").whereIn("id_modulo", idsM).del();
    }
    console.log(`\n${oks} OK, ${falhas.length} FALHA(S)`);
    for (const f of falhas) console.log(` - ${f}`);
    await encerrarSessoesDeTeste();
    await knex.destroy();
    process.exit(falhas.length ? 1 : 0);
  });
