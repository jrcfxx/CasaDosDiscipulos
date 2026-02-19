import { seed as seedClean } from "./seed_clean.js";
import { seed as seedNivel } from "./seed_nivel.js";
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
import { seed as seedEvento } from "./seed_evento.js";
import { seed as seedMinisterio } from "./seed_ministerio.js";
import { seed as seedEscala } from "./seed_escala.js";
import { seed as seedUsuarioCelula } from "./seed_usuario_celula.js";
import { seed as seedFormularioResposta } from "./seed_formulario_resposta.js";
import { seed as seedUsuarioModulo } from "./seed_usuario_modulo.js";
import { seed as seedQuizResposta } from "./seed_quiz_resposta.js";
import { seed as seedNotificacao } from "./seed_notificacao.js";

/**
 * Executa todos os seeders na ordem correta
 * Respeita as dependências entre tabelas (FK constraints)
 */
async function run() {
  console.log("Iniciando seeders...\n");

  // 0. Limpa todas as tabelas (ordem reversa de FK)
  await seedClean();

  // 1. Níveis (usuario e modulo referenciam)
  await seedNivel();

  // 2. Usuários (depende de nivel)
  await seedUsuario();

  // 3. Tipos de campo
  await seedCampo();

  // 4. Células (depende de usuário/líder)
  await seedCelula();

  // 5. Módulos (depende de nivel)
  await seedModulo();
  await seedModuloCampo();

  // 6. Quizzes e questões (depende de módulo)
  await seedQuiz();
  await seedQuizQuestao();

  // 6b. Respostas de quiz (depende de quiz_questao e usuario)
  await seedQuizResposta();

  // 7. Lições
  await seedLicao();
  await seedLicaoCampo();

  // 8. Formulários
  await seedFormulario();
  await seedFormularioCampo();

  // 9. Eventos
  await seedEvento();

  // 10. Ministérios (depende de usuario)
  await seedMinisterio();

  // 11. Escala - eventos de calendário (depende de usuario e ministério)
  await seedEscala();

  // 12. Usuário-Célula (vincula membros/líderes às células)
  await seedUsuarioCelula();

  // 12b. Usuário-Módulo (progresso em módulos)
  await seedUsuarioModulo();

  // 13. Respostas de formulário (dados de exemplo para o dashboard)
  await seedFormularioResposta();

  // 14. Notificações
  await seedNotificacao();

  console.log("\n✅ Todos os seeders executados com sucesso!");
  process.exit(0);
}

run().catch((error) => {
  console.error("\n Erro ao executar seeders:", error);
  process.exit(1);
});
