/**
 * Smoke / unit-like tests for ValidadorEscala (sem DB para habilidade/limites).
 * Uso: node scripts/testEscalaValidacao.js
 */
import ValidadorEscala from "../src/services/ValidadorEscala.js";
import { getConfigPorArea, getLimitesPorArea } from "../src/config/ministerioCampos.js";

let falhas = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    falhas += 1;
  } else {
    console.log("OK:", msg);
  }
}

// Config por área
assert(!!getConfigPorArea("Louvor"), "Louvor tem config");
assert(!!getConfigPorArea("Som / Áudio"), "Som tem config");
assert(getLimitesPorArea("Louvor")?.violao === 2, "Limite violão = 2");

// Habilidade
{
  const ok = ValidadorEscala.validarHabilidadeUsuario("Louvor", { instrumento: "violao" });
  assert(ok.valido === true, "instrumento violao válido");
  const bad = ValidadorEscala.validarHabilidadeUsuario("Louvor", { instrumento: "harpa_espacial" });
  assert(bad.valido === false, "instrumento inválido rejeitado");
}

console.log(falhas === 0 ? "\nTodos os testes passaram." : `\n${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
