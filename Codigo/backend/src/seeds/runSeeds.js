import { seed as seedUsuario } from "./seed_usuario.js";
import { seed as seedCampo } from "./seed_campo_personalizado.js";
import { seed as seedCelula } from "./seed_celula.js";
import { seed as seedModulo } from "./seed_modulo.js";
import { seed as seedModuloCampo } from "./seed_modulo_campo.js";
import { seed as seedQuiz } from "./seed_quiz.js";
import { seed as seedQuizQuestao } from "./seed_quiz_questao.js";
import { seed as seedLicao } from "./seed_licao.js";
import { seed as seedLicaoCampo } from "./seed_licao_campo.js";
import { seed as seedFormulario } from "./seed_formulario.js";
import { seed as seedFormularioCampo } from "./seed_formulario_campo.js";

/**
 * Executa todos os seeders na ordem correta
 * Respeita as dependências entre tabelas (FK constraints)
 */
async function run() {
  console.log("Iniciando seeders...\n");

  // 1. Usuários (sem dependências)
  await seedUsuario();

  // 2. Tipos de campo (sem dependências)
  await seedCampo();

  // 3. Células (depende de usuário/líder)
  await seedCelula();

  // 4. Módulos (sem dependências, mas usado por quiz)
  await seedModulo();
  await seedModuloCampo();

  // 5. Quizzes e questões (depende de módulo)
  await seedQuiz();
  await seedQuizQuestao();

  // 6. Lições (sem dependências diretas)
  await seedLicao();
  await seedLicaoCampo();

  // 7. Formulários (sem dependências diretas)
  await seedFormulario();
  await seedFormularioCampo();

  console.log("\n Todos os seeders executados com sucesso!");
  process.exit(0);
}

run().catch((error) => {
  console.error("\n Erro ao executar seeders:", error);
  process.exit(1);
});
