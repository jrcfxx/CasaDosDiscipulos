/**
 * Dados de TESTE para o pessoal experimentar o sistema (tudo, menos Escala e calendário).
 *
 * Só INSERE (nunca apaga dados reais). Tudo o que cria fica marcado com "[TESTE]" e pode ser
 * removido com --remover, inclusive os pontos dados e os vínculos de célula criados aqui.
 *
 * Cria:
 *   - Escola de Discípulos: 1 módulo por nível, com conteúdo e quiz; os módulos até o nível
 *     de cada pessoa ficam concluídos (mesma regra do sistema) e somam pontos.
 *   - Secretaria: formulários (relatório semanal de célula, mensais e avulso) com respostas
 *     das últimas semanas, deixando células em dia e atrasadas no painel.
 *   - Lições para as células.
 *   - Fala Aí: palavra do dia e devocionais (publicados pelo administrador) e um comentário.
 *   - Membros sem célula distribuídos entre as células ativas.
 *
 * Uso:
 *   node scripts/popularTeste.js              # cria
 *   node scripts/popularTeste.js --remover    # apaga tudo o que foi criado por este script
 *   (no servidor: docker compose exec backend node scripts/popularTeste.js)
 */
import knex from "../src/database/index.js";

const TAG = "[TESTE]";
const CHAVE_REGISTRO = "dados_teste"; // site_config: pontos e vínculos criados, para desfazer

const dia = (deslocamento) => {
  const d = new Date();
  d.setHours(19, 30, 0, 0);
  d.setDate(d.getDate() + deslocamento);
  return d;
};
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Conteúdo de um módulo por nível (mesma ordem dos níveis) */
const CONTEUDO_MODULOS = [
  {
    texto: "Bem-vindo à Casa! Neste módulo você conhece a nossa história, a visão de células e se prepara para o batismo.",
    leitura: "https://www.bibliaonline.com.br/acf/rm/6",
    reflexao: "O que significa para você fazer parte de uma família espiritual?",
    perguntas: [
      ["O batismo nas águas simboliza:", ["A morte para a velha vida e o novo nascimento em Cristo", "Um ritual de purificação semanal", "A entrada em um ministério"], 0],
      ["A igreja se reúne nos templos e também nas casas (células).", true],
    ],
  },
  {
    texto: "A vida devocional é a base do discípulo: oração, leitura da Palavra e tempo a sós com Deus todos os dias.",
    leitura: "https://www.bibliaonline.com.br/acf/mt/6",
    reflexao: "Qual o melhor horário do seu dia para o devocional? Como vai protegê-lo?",
    perguntas: [
      ["Segundo Mateus 6, onde Jesus ensina a orar?", ["No quarto, em secreto", "Somente no templo", "Em voz alta nas praças"], 0],
      ["Ler a Bíblia só aos domingos é suficiente para uma vida devocional.", false],
    ],
  },
  {
    texto: "Não existe vida cristã sem a cruz. A cruz traz libertação e amadurecimento espiritual.",
    leitura: "https://www.bibliaonline.com.br/acf/lc/9",
    reflexao: "O que significa, na prática, tomar a sua cruz cada dia?",
    perguntas: [
      ["Em Lucas 9:23, Jesus diz que quem quiser segui-lo deve:", ["Negar a si mesmo e tomar a sua cruz", "Ter muitos bens", "Evitar as pessoas"], 0],
      ["A cruz é apenas um símbolo, sem efeito na vida do discípulo.", false],
    ],
  },
  {
    texto: "Ser discípulo é o que nascemos para ser. Discipulado é relacionamento, não religião.",
    leitura: "https://www.bibliaonline.com.br/acf/jo/15",
    reflexao: "Quais diferenças você percebe entre uma vida religiosa e uma vida de discípulo?",
    perguntas: [
      ["Em João 15, Jesus se compara a:", ["Uma videira", "Uma pedra", "Um rei terreno"], 0],
      ["Permanecer em Cristo é condição para dar fruto.", true],
    ],
  },
  {
    texto: "Você foi marcado para servir a Deus com seus dons. Vamos descobrir como Deus quer usar você.",
    leitura: "https://www.bibliaonline.com.br/acf/1co/12",
    reflexao: "Em qual ministério da Casa você sente que pode servir hoje?",
    perguntas: [
      ["Segundo 1 Coríntios 12, os dons são dados para:", ["A edificação do corpo", "Destacar quem os recebe", "Uso apenas dos pastores"], 0],
      ["Todos os membros do corpo têm a mesma função.", false],
    ],
  },
  {
    texto: "Uma igreja para a cidade: evangelismo e obra missionária. Você carrega a mensagem mais revolucionária de todos os tempos.",
    leitura: "https://www.bibliaonline.com.br/acf/mt/28",
    reflexao: "Escreva o nome de três pessoas por quem você vai orar e a quem vai anunciar o Evangelho.",
    perguntas: [
      ["A Grande Comissão (Mt 28:19) manda:", ["Fazer discípulos de todas as nações", "Ficar apenas entre os irmãos", "Esperar que as pessoas venham"], 0],
      ["Evangelismo é tarefa só de quem tem o dom de evangelista.", false],
    ],
  },
  {
    texto: "O Reino de Deus já foi estabelecido. Aprenda como o mundo espiritual funciona e seja equipado como soldado de Cristo.",
    leitura: "https://www.bibliaonline.com.br/acf/ef/6",
    reflexao: "Qual parte da armadura de Deus você precisa fortalecer agora?",
    perguntas: [
      ["Segundo Efésios 6, nossa luta é contra:", ["Principados e potestades", "Pessoas de outras igrejas", "O governo"], 0],
      ["A espada do Espírito é a Palavra de Deus.", true],
    ],
  },
  {
    texto: "Introdução à escatologia: há uma bênção para quem lê e se aprofunda no livro do Apocalipse.",
    leitura: "https://www.bibliaonline.com.br/acf/ap/1",
    reflexao: "Como a esperança da volta de Cristo muda a forma como você vive hoje?",
    perguntas: [
      ["Apocalipse 1:3 declara bem-aventurado aquele que:", ["Lê e guarda as palavras da profecia", "Calcula a data do fim", "Evita o livro"], 0],
      ["O Apocalipse é um livro de esperança para a igreja.", true],
    ],
  },
  {
    texto: "Liderando um pequeno grupo: como conduzir uma célula, cuidar das pessoas e multiplicar.",
    leitura: "https://www.bibliaonline.com.br/acf/at/2",
    reflexao: "Quais são os três maiores desafios de liderar uma célula, na sua opinião?",
    perguntas: [
      ["Em Atos 2, a igreja primitiva se reunia:", ["No templo e de casa em casa", "Apenas uma vez por ano", "Somente com os apóstolos"], 0],
      ["Um líder de célula também precisa ser discipulado.", true],
    ],
  },
  {
    texto: "Liderança Cristã: formação para liderar em sua geração e servir com excelência.",
    leitura: "https://www.bibliaonline.com.br/acf/mc/10",
    reflexao: "Cite um exemplo de liderança servidora que marcou sua vida.",
    perguntas: [
      ["Em Marcos 10:43-45, quem quiser ser grande deve:", ["Ser servo de todos", "Dar ordens a todos", "Evitar responsabilidades"], 0],
      ["Jesus veio para ser servido.", false],
    ],
  },
  {
    texto: "+ de Deus: cursos sobre várias áreas da espiritualidade e maturidade cristã.",
    leitura: "https://www.bibliaonline.com.br/acf/fp/3",
    reflexao: "Que área da sua vida espiritual você quer amadurecer neste ano?",
    perguntas: [
      ["Em Filipenses 3:14, Paulo prossegue para:", ["O alvo, o prêmio da soberana vocação", "O reconhecimento dos homens", "O descanso"], 0],
      ["Maturidade cristã é um processo contínuo.", true],
    ],
  },
];

const LICOES = [
  ["Fé que move montanhas", "Mateus 17:20", "A fé do tamanho de um grão de mostarda.", "Que situação da sua vida precisa da sua fé hoje?"],
  ["O poder da gratidão", "1 Tessalonicenses 5:18", "Em tudo dai graças.", "Compartilhe três motivos de gratidão desta semana."],
  ["Perdão que liberta", "Mateus 18:21-22", "Setenta vezes sete.", "Existe alguém que você precisa perdoar?"],
  ["Família, projeto de Deus", "Josué 24:15", "Eu e a minha casa serviremos ao Senhor.", "Como sua casa pode servir ao Senhor nesta semana?"],
  ["Ansiedade e descanso", "Filipenses 4:6-7", "A paz de Deus guarda o coração.", "O que tem roubado a sua paz? Vamos orar juntos."],
  ["Generosidade", "2 Coríntios 9:7", "Deus ama quem dá com alegria.", "Pense em uma forma prática de abençoar alguém."],
];

async function remover() {
  const reg = await knex("site_config").where({ chave: CHAVE_REGISTRO }).first();
  const registro = reg?.valor ? JSON.parse(reg.valor) : { pontos: {}, usuario_celula: [] };

  await knex.transaction(async (trx) => {
    for (const [id, pontos] of Object.entries(registro.pontos || {})) {
      await trx("usuario").where({ id_usuario: id }).update({ pontuacao: trx.raw("GREATEST(0, pontuacao - ?)", [pontos]) });
    }
    if (registro.usuario_celula?.length) await trx("usuario_celula").whereIn("id_usuario_celula", registro.usuario_celula).del();
    const n = {
      modulos: await trx("modulo").where("titulo", "like", `${TAG}%`).del(),
      quizzes: await trx("quiz").where("titulo", "like", `${TAG}%`).del(),
      formularios: await trx("formulario").where("titulo", "like", `${TAG}%`).del(),
      licoes: await trx("licao").where("titulo", "like", `${TAG}%`).del(),
      fala_ai: await trx("fala_ai_post").where("conteudo", "like", `${TAG}%`).del(),
    };
    await trx("site_config").where({ chave: CHAVE_REGISTRO }).del();
    console.log("Removido:", n, `| vínculos de célula: ${registro.usuario_celula?.length || 0} | pontos revertidos de ${Object.keys(registro.pontos || {}).length} pessoa(s)`);
  });
}

async function criar() {
  if (await knex("site_config").where({ chave: CHAVE_REGISTRO }).first()) {
    throw new Error("Os dados de teste já foram criados. Para recriar: --remover e rode de novo.");
  }
  const admin = await knex("usuario").where({ tipo: "administrador", ativo: true }).orderBy("id_usuario").first();
  if (!admin) throw new Error("Nenhum administrador ativo. Rode antes: npm run admin:setup");

  const campos = Object.fromEntries(
    (await knex("campo_personalizado").select("id_campo", "tipo_campo")).map((c) => [c.tipo_campo, c.id_campo])
  );
  for (const t of ["texto", "textarea", "link", "numero", "data"]) {
    if (!campos[t]) throw new Error(`Tipo de campo "${t}" não existe. Rode as migrations (npm run migrate).`);
  }
  const niveis = await knex("nivel").where({ ativo: true }).orderBy("ordem");
  if (!niveis.length) throw new Error("Nenhum nível cadastrado.");

  const registro = { pontos: {}, usuario_celula: [] };

  await knex.transaction(async (trx) => {
    // ---------- Escola de Discípulos: módulos + quizzes ----------
    const [{ ordem: maiorOrdem = 0 } = {}] = await trx("modulo").max({ ordem: "ordem" });
    const modulos = [];
    for (const [i, nivel] of niveis.entries()) {
      const c = CONTEUDO_MODULOS[i % CONTEUDO_MODULOS.length];
      const [id_modulo] = await trx("modulo").insert({
        titulo: `${TAG} ${nivel.nome}`,
        descricao: `Módulo de teste do nível ${nivel.nome}.`,
        ordem: Number(maiorOrdem || 0) + i + 1,
        ativo: true,
        obrigatorio: true,
        id_nivel: nivel.id_nivel,
      });
      const [id_quiz] = await trx("quiz").insert({
        id_modulo,
        titulo: `${TAG} Quiz – ${nivel.nome}`,
        descricao: "Responda para concluir o módulo (mínimo de 50% dos pontos).",
        ativo: true,
      });
      await trx("modulo_quiz").insert({ id_modulo, id_quiz });
      await trx("modulo_campo").insert([
        { id_modulo, id_campo: campos.texto, label: "Introdução", conteudo: c.texto, ordem: 1 },
        { id_modulo, id_campo: campos.link, label: "Leitura bíblica", conteudo: c.leitura, ordem: 2 },
        { id_modulo, id_campo: campos.textarea, label: "Para refletir", conteudo: c.reflexao, ordem: 3 },
      ]);
      const questoes = c.perguntas.map(([enunciado, opcoesOuVF, correta], idx) =>
        Array.isArray(opcoesOuVF)
          ? {
              id_quiz, tipo_questao: "multipla_escolha", enunciado, pontos: 10, ordem: idx + 1, obrigatoria: true,
              opcoes: JSON.stringify(opcoesOuVF.map((texto, k) => ({ id: "abcd"[k], texto }))),
              resposta_correta: "abcd"[correta],
            }
          : {
              id_quiz, tipo_questao: "verdadeiro_falso", enunciado, pontos: 5, ordem: idx + 1, obrigatoria: true,
              opcoes: JSON.stringify([{ id: "v", texto: "Verdadeiro" }, { id: "f", texto: "Falso" }]),
              resposta_correta: opcoesOuVF ? "v" : "f",
            }
      );
      questoes.push({
        id_quiz, tipo_questao: "discursiva", enunciado: c.reflexao, pontos: 5, ordem: questoes.length + 1,
        obrigatoria: false, opcoes: null, resposta_correta: null,
      });
      await trx("quiz_questao").insert(questoes);
      const pontuacaoMaxima = questoes.reduce((s, q) => s + q.pontos, 0);
      modulos.push({ id_modulo, ordemNivel: nivel.ordem, pontosAuto: Math.max(1, Math.floor(pontuacaoMaxima * 0.5)) });
    }

    // Progresso: mesma regra do sistema (UsuarioService.marcarModulosConcluidosPorNivel):
    // quem está acima do nível inicial tem concluídos os módulos até o próprio nível.
    const ordemMinima = Math.min(...niveis.map((n) => n.ordem));
    const pessoas = await trx("usuario as u")
      .join("nivel as n", "n.id_nivel", "u.id_nivel")
      .where("u.ativo", true)
      .select("u.id_usuario", "n.ordem");
    let concluidos = 0;
    for (const p of pessoas) {
      if (p.ordem <= ordemMinima) continue;
      let pontos = 0;
      for (const m of modulos.filter((m) => m.ordemNivel <= p.ordem)) {
        await trx("usuario_modulo").insert({
          id_usuario: p.id_usuario, id_modulo: m.id_modulo, status: "concluido",
          nota_quiz: m.pontosAuto, data_conclusao: new Date(), auto_completo_por_nivel: true,
        });
        pontos += m.pontosAuto;
        concluidos++;
      }
      if (pontos) {
        await trx("usuario").where({ id_usuario: p.id_usuario }).increment("pontuacao", pontos);
        registro.pontos[p.id_usuario] = pontos;
      }
    }

    // ---------- Células: membros sem célula distribuídos ----------
    const celulas = await trx("celula").where({ ativa: true }).orderBy("nome").select("id_celula", "nome");
    const semCelula = await trx("usuario as u")
      .leftJoin("usuario_celula as uc", "uc.id_usuario", "u.id_usuario")
      .leftJoin("celula_lider as cl", "cl.id_usuario", "u.id_usuario")
      .whereNull("uc.id_usuario_celula")
      .whereNull("cl.id_celula_lider")
      .where("u.ativo", true)
      .whereNot("u.tipo", "administrador")
      .orderBy("u.nome")
      .select("u.id_usuario");
    if (celulas.length) {
      for (const [i, u] of semCelula.entries()) {
        const [id] = await trx("usuario_celula").insert({ id_usuario: u.id_usuario, id_celula: celulas[i % celulas.length].id_celula, principal: true });
        registro.usuario_celula.push(id);
      }
    }

    // ---------- Secretaria: formulários + respostas ----------
    const formularios = [
      {
        titulo: `${TAG} Relatório de Célula`, descricao: "Preencha após cada reunião da célula.", frequencia: "semanal",
        campos: [
          ["data", "Data da reunião", "Quando a célula se reuniu", true],
          ["numero", "Número de presentes", "Quantas pessoas participaram", true],
          ["numero", "Visitantes", "Quantos visitantes vieram", false],
          ["textarea", "Resumo da reunião", "Como foi a reunião", true],
          ["textarea", "Pedidos de oração", "", false],
        ],
      },
      {
        titulo: `${TAG} Relatório Mensal de Ministério`, descricao: "Atividades e resultados do mês.", frequencia: "mensal",
        campos: [
          ["texto", "Ministério", "", true],
          ["textarea", "Atividades realizadas", "", true],
          ["numero", "Voluntários envolvidos", "", false],
        ],
      },
      {
        titulo: `${TAG} Visitas e Acompanhamento`, descricao: "Registro de visitas a membros e visitantes.", frequencia: "mensal",
        campos: [
          ["data", "Data da visita", "", true],
          ["texto", "Pessoa visitada", "", true],
          ["textarea", "Relato", "", false],
        ],
      },
      {
        titulo: `${TAG} Avaliação do Culto`, descricao: "Formulário avulso (sem frequência).", frequencia: null,
        campos: [
          ["data", "Data do culto", "", true],
          ["numero", "Nota (1 a 10)", "", true],
          ["link", "Link da transmissão", "", false],
          ["textarea", "Sugestões", "", false],
        ],
      },
    ];
    const idsCamposForm = [];
    for (const f of formularios) {
      const [id_formulario] = await trx("formulario").insert({ titulo: f.titulo, descricao: f.descricao, frequencia: f.frequencia, ativo: true });
      const ids = [];
      for (const [k, [tipo, label, conteudo, obrigatorio]] of f.campos.entries()) {
        const [id] = await trx("formulario_campo").insert({ id_formulario, id_campo: campos[tipo], label, conteudo, ordem: k + 1, obrigatorio });
        ids.push(id);
      }
      idsCamposForm.push({ id_formulario, ids });
    }

    // Relatórios semanais: células com líder; a última célula fica "atrasada" (sem relatório recente)
    const lideres = await trx("celula_lider as cl")
      .join("celula as c", "c.id_celula", "cl.id_celula")
      .where("c.ativa", true)
      .orderBy("c.nome")
      .select("cl.id_celula", "cl.id_usuario", "c.nome");
    const vistas = new Set();
    const celulasComLider = lideres.filter((l) => !vistas.has(l.id_celula) && vistas.add(l.id_celula));
    const relatorio = idsCamposForm[0];
    let respostas = 0;
    for (const [i, l] of celulasComLider.entries()) {
      const atrasada = i === celulasComLider.length - 1;
      const semanas = atrasada ? [3, 4] : [0, 1, 2, 3];
      for (const s of semanas) {
        const data = dia(-(s * 7) - (i % 3) - 1);
        const [id_resposta] = await trx("formulario_resposta").insert({
          id_formulario: relatorio.id_formulario, id_usuario: l.id_usuario, id_celula: l.id_celula, data_resposta: data,
        });
        const presentes = 6 + ((i * 3 + s) % 9);
        const valores = [ymd(data), String(presentes), String(s % 3), `${TAG} Reunião da célula ${l.nome}: louvor, palavra e oração.`, s % 2 ? "Saúde da família de um membro." : ""];
        await trx("formulario_resposta_campo").insert(
          relatorio.ids.map((id_formulario_campo, k) => ({ id_resposta, id_formulario_campo, valor: valores[k] }))
        );
        respostas++;
      }
    }
    // Uma visita registrada pela primeira célula
    if (celulasComLider[0]) {
      const v = idsCamposForm[2];
      const data = dia(-5);
      const [id_resposta] = await trx("formulario_resposta").insert({
        id_formulario: v.id_formulario, id_usuario: celulasComLider[0].id_usuario, id_celula: celulasComLider[0].id_celula, data_resposta: data,
      });
      await trx("formulario_resposta_campo").insert(
        [ymd(data), "Visitante do culto de domingo", `${TAG} Visita de boas-vindas, oramos pela família.`].map((valor, k) => ({ id_resposta, id_formulario_campo: v.ids[k], valor }))
      );
      respostas++;
    }

    // ---------- Lições ----------
    for (const [titulo, referencia, ideia, pergunta] of LICOES) {
      const [id_licao] = await trx("licao").insert({ titulo: `${TAG} ${titulo}`, descricao: `${referencia} — ${ideia}`, ativo: true });
      await trx("licao_campo").insert([
        { id_licao, id_campo: campos.texto, label: "Texto base", conteudo: referencia, ordem: 1 },
        { id_licao, id_campo: campos.textarea, label: "Palavra", conteudo: `${ideia} Leia o texto em voz alta e converse com o grupo sobre o que ele ensina.`, ordem: 2 },
        { id_licao, id_campo: campos.textarea, label: "Para compartilhar", conteudo: pergunta, ordem: 3 },
        { id_licao, id_campo: campos.link, label: "Leitura online", conteudo: "https://www.bibliaonline.com.br/acf", ordem: 4 },
      ]);
    }

    // ---------- Fala Aí ----------
    const posts = [
      { tipo: "palavra_do_dia", titulo: null, conteudo: "O Senhor é o meu pastor; nada me faltará.", referencia: "Salmos 23:1", d: 0 },
      { tipo: "devocional", titulo: "Confiança no Senhor", conteudo: "Entregue seus planos ao Senhor e descanse: Ele cuida de cada detalhe.", referencia: "Provérbios 16:3", d: 0 },
      { tipo: "palavra_do_dia", titulo: null, conteudo: "Tudo posso naquele que me fortalece.", referencia: "Filipenses 4:13", d: -1 },
      { tipo: "devocional", titulo: "Permanecer", conteudo: "Assim como o ramo depende da videira, nós dependemos de Cristo para dar fruto.", referencia: "João 15:5", d: -2 },
    ];
    let primeiroPost = null;
    for (const p of posts) {
      const [id_post] = await trx("fala_ai_post").insert({
        id_usuario: admin.id_usuario, tipo: p.tipo, titulo: p.titulo, conteudo: `${TAG} ${p.conteudo}`,
        referencia: p.referencia, imagem_url: null, data_publicacao: ymd(dia(p.d)),
      });
      primeiroPost ??= id_post;
    }
    await trx("fala_ai_comentario").insert({ id_post: primeiroPost, id_usuario: admin.id_usuario, texto: "Comente aqui para testar os comentários!" });

    await trx("site_config").insert({ chave: CHAVE_REGISTRO, valor: JSON.stringify(registro) });

    console.log(`✅ Dados de teste criados:
  Escola de Discípulos: ${modulos.length} módulos com quiz; ${concluidos} conclusões automáticas pelo nível (${Object.keys(registro.pontos).length} pessoas pontuadas)
  Secretaria: ${formularios.length} formulários, ${respostas} respostas (${celulasComLider.length} células com relatório; "${celulasComLider.at(-1)?.nome ?? "-"}" fica atrasada)
  Lições: ${LICOES.length}
  Fala Aí: ${posts.length} publicações + 1 comentário (autor: ${admin.nome})
  Células: ${registro.usuario_celula.length} membros sem célula distribuídos em ${celulas.length} células
Para apagar tudo depois: node scripts/popularTeste.js --remover`);
  });
}

(process.argv.includes("--remover") ? remover() : criar())
  .then(() => knex.destroy())
  .catch(async (err) => {
    console.error("Erro:", err.message);
    await knex.destroy();
    process.exit(1);
  });
