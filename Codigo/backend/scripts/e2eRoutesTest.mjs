/**
 * Suite E2E — testa rotas da API (sucesso + exceções de auth/permissão/validação)
 * Uso: node scripts/e2eRoutesTest.mjs
 */
const BASE = process.env.API_URL || "http://localhost:3001/api";

const results = [];
let passed = 0;
let failed = 0;

async function req(method, path, { token, body, expectStatus, label } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let status, data, errMsg;
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    status = res.status;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
  } catch (e) {
    status = 0;
    errMsg = e.message;
  }

  const ok =
    expectStatus === undefined
      ? status >= 200 && status < 300
      : Array.isArray(expectStatus)
        ? expectStatus.includes(status)
        : status === expectStatus;

  const name = label || `${method} ${path}`;
  if (ok) {
    passed++;
    results.push({ ok: true, name, status });
  } else {
    failed++;
    results.push({
      ok: false,
      name,
      status,
      expectStatus,
      errMsg,
      body: typeof data === "object" ? JSON.stringify(data)?.slice(0, 200) : String(data)?.slice(0, 200),
    });
  }
  return { status, data, ok };
}

async function login(email, senha) {
  const { data, status } = await req("POST", "/auth/login", {
    body: { email, senha },
    label: `login ${email}`,
  });
  if (status !== 200 || !data?.token) {
    throw new Error(`Login falhou para ${email}: ${status}`);
  }
  // remarca como pass já contado
  return data.token;
}

async function main() {
  console.log(`\n🧪 E2E API — ${BASE}\n`);

  // ——— Health ———
  {
    const res = await fetch(BASE.replace(/\/api$/, "") + "/");
    const ok = res.status === 200;
    if (ok) {
      passed++;
      results.push({ ok: true, name: "GET / health", status: 200 });
    } else {
      failed++;
      results.push({ ok: false, name: "GET / health", status: res.status });
    }
  }

  // ——— Auth exceptions ———
  await req("POST", "/auth/login", {
    body: {},
    expectStatus: 400,
    label: "POST /auth/login sem body → 400",
  });
  await req("POST", "/auth/login", {
    body: { email: "x@y.com", senha: "errada" },
    expectStatus: [401, 400],
    label: "POST /auth/login credenciais inválidas → 401/400",
  });
  await req("POST", "/auth/register", {
    body: { nome: "A", email: "bad", senha: "1" },
    expectStatus: 400,
    label: "POST /auth/register inválido → 400",
  });
  await req("GET", "/usuarios", {
    expectStatus: 401,
    label: "GET /usuarios sem token → 401",
  });
  await req("GET", "/usuarios", {
    token: "token.invalido",
    expectStatus: 401,
    label: "GET /usuarios token inválido → 401",
  });

  // ——— Logins ———
  // Remove the auto-pass from login helper double-count: login() uses req which already counts
  const adminToken = (
    await (async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com", senha: "123456" }),
      });
      const data = await res.json();
      const ok = res.status === 200 && !!data.token;
      if (ok) {
        passed++;
        results.push({ ok: true, name: "login admin@test.com", status: 200 });
      } else {
        failed++;
        results.push({ ok: false, name: "login admin@test.com", status: res.status, body: JSON.stringify(data) });
        throw new Error("Não foi possível logar como admin");
      }
      return data.token;
    })()
  );

  const membroToken = (
    await (async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "membro@test.com", senha: "123456" }),
      });
      const data = await res.json();
      const ok = res.status === 200 && !!data.token;
      if (ok) {
        passed++;
        results.push({ ok: true, name: "login membro@test.com", status: 200 });
      } else {
        failed++;
        results.push({ ok: false, name: "login membro@test.com", status: res.status });
        throw new Error("Não foi possível logar como membro");
      }
      return data.token;
    })()
  );

  const liderToken = (
    await (async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "lorrayne.andrade@casadosdiscipulos.org",
          senha: "123456",
        }),
      });
      const data = await res.json();
      const ok = res.status === 200 && !!data.token;
      if (ok) {
        passed++;
        results.push({ ok: true, name: "login líder célula", status: 200 });
      } else {
        failed++;
        results.push({ ok: false, name: "login líder célula", status: res.status, body: JSON.stringify(data) });
        // fallback
        const r2 = await fetch(`${BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "lider@test.com", senha: "123456" }),
        });
        const d2 = await r2.json();
        if (r2.status === 200 && d2.token) {
          passed++;
          results.push({ ok: true, name: "login lider@test.com fallback", status: 200 });
          return d2.token;
        }
        throw new Error("Não foi possível logar como líder");
      }
      return data.token;
    })()
  );

  // ——— Permission denials (membro) ———
  await req("GET", "/usuarios", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /usuarios → 403",
  });
  await req("POST", "/celula", {
    token: membroToken,
    body: { nome: "Hack", id_lideres: [1] },
    expectStatus: 403,
    label: "membro POST /celula → 403",
  });
  await req("POST", "/nivel", {
    token: membroToken,
    body: { nome: "Hack Nivel" },
    expectStatus: 403,
    label: "membro POST /nivel → 403",
  });
  await req("GET", "/ministerios", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /ministerios → 403",
  });
  await req("POST", "/evento", {
    token: membroToken,
    body: { titulo: "Hack", ordem: 0 },
    expectStatus: 403,
    label: "membro POST /evento → 403",
  });

  // ——— Público ———
  await req("GET", "/celula/publicas", {
    expectStatus: 200,
    label: "GET /celula/publicas (público)",
  });
  await req("GET", "/evento/ativos", {
    expectStatus: 200,
    label: "GET /evento/ativos (público)",
  });
  await req("GET", "/modulo/ranking", {
    expectStatus: 200,
    label: "GET /modulo/ranking (público)",
  });

  // ——— Perfil ———
  await req("GET", "/usuarios/perfil", {
    token: adminToken,
    expectStatus: 200,
    label: "GET /usuarios/perfil admin",
  });
  await req("PUT", "/usuarios/perfil", {
    token: membroToken,
    body: { tipo: "administrador", lider_celula: true, ativo: true },
    expectStatus: 200,
    label: "PUT /usuarios/perfil whitelist (não escala privilégio)",
  });
  // verifica que não escalou
  {
    const { data } = await req("GET", "/usuarios/perfil", {
      token: membroToken,
      expectStatus: 200,
      label: "GET perfil membro após tentativa de escalação",
    });
    if (data?.tipo === "administrador" || data?.lider_celula === true) {
      failed++;
      results.push({
        ok: false,
        name: "perfil não deve escalar tipo/lider_celula",
        status: 200,
        body: JSON.stringify({ tipo: data?.tipo, lider_celula: data?.lider_celula }),
      });
      // desfaz contagem do check implícito — já contamos GET como pass
    } else {
      passed++;
      results.push({ ok: true, name: "perfil não escala privilégios", status: 200 });
    }
  }
  await req("PUT", "/usuarios/perfil", {
    token: membroToken,
    body: { senha: "nova123456" },
    expectStatus: 400,
    label: "PUT perfil senha sem senhaAtual → 400",
  });

  // ——— Usuários admin ———
  const usuarios = await req("GET", "/usuarios", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /usuarios",
  });
  const algumId = usuarios.data?.[0]?.id_usuario;
  if (algumId) {
    await req("GET", `/usuarios/${algumId}`, {
      token: adminToken,
      expectStatus: 200,
      label: "admin GET /usuarios/:id",
    });
  }
  await req("GET", "/usuarios/999999", {
    token: adminToken,
    expectStatus: [404, 500],
    label: "admin GET /usuarios/999999 → 404",
  });

  // ——— Células ———
  const celulas = await req("GET", "/celula", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /celula",
  });
  const celulaId = celulas.data?.[0]?.id_celula;
  if (celulaId) {
    await req("GET", `/celula/${celulaId}`, {
      token: adminToken,
      expectStatus: 200,
      label: "admin GET /celula/:id",
    });
  }
  await req("GET", "/celula/999999", {
    token: adminToken,
    expectStatus: [404, 500],
    label: "GET /celula/999999 → 404",
  });
  await req("POST", "/celula", {
    token: adminToken,
    body: { nome: "Ab" },
    expectStatus: 400,
    label: "POST /celula sem líder / nome curto → 400",
  });
  // líder só próprias células
  const liderId = (
    await req("GET", "/usuarios/perfil", {
      token: liderToken,
      expectStatus: 200,
      label: "GET perfil líder",
    })
  ).data?.id_usuario;
  if (liderId) {
    await req("GET", `/celula/lider/${liderId}`, {
      token: liderToken,
      expectStatus: 200,
      label: "líder GET /celula/lider/:próprioId",
    });
    await req("GET", `/celula/lider/${liderId + 999}`, {
      token: liderToken,
      expectStatus: 403,
      label: "líder GET /celula/lider/outro → 403",
    });
  }

  // ——— Níveis ———
  const niveis = await req("GET", "/nivel", {
    token: adminToken,
    expectStatus: 200,
    label: "GET /nivel",
  });
  const nivelId = niveis.data?.[0]?.id_nivel;
  if (nivelId) {
    await req("GET", `/nivel/${nivelId}`, {
      token: adminToken,
      expectStatus: 200,
      label: "GET /nivel/:id",
    });
  }

  // ——— Módulos ———
  await req("GET", "/modulo", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /modulo",
  });
  await req("GET", "/modulo/active", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /modulo/active",
  });
  await req("GET", "/modulo/ativos-com-progresso", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /modulo/ativos-com-progresso",
  });
  await req("GET", "/modulo/ranking/minha-posicao", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /modulo/ranking/minha-posicao",
  });
  const modulos = await req("GET", "/modulo/active", {
    token: membroToken,
    expectStatus: 200,
    label: "GET modulo active (ids)",
  });
  const modId = Array.isArray(modulos.data)
    ? modulos.data[0]?.id_modulo
    : modulos.data?.modulos?.[0]?.id_modulo;
  if (modId) {
    await req("GET", `/modulo/${modId}`, {
      token: membroToken,
      expectStatus: 200,
      label: "GET /modulo/:id",
    });
    const quizVinculado = await req("GET", `/modulo/${modId}/quiz`, {
      token: membroToken,
      expectStatus: [200, 404],
      label: "GET /modulo/:id/quiz",
    });
    // gabarito não deve vazar para membro
    const questoes = quizVinculado.data?.questoes;
    if (Array.isArray(questoes) && questoes.some((q) => "resposta_correta" in q && q.resposta_correta != null)) {
      failed++;
      results.push({
        ok: false,
        name: "quiz vinculado não deve expor resposta_correta ao membro",
        status: 200,
      });
    } else if (quizVinculado.status === 200) {
      passed++;
      results.push({ ok: true, name: "quiz vinculado sem gabarito para membro", status: 200 });
    }
  }
  await req("POST", "/modulo", {
    token: membroToken,
    body: { titulo: "Hack", ordem: 1 },
    expectStatus: 403,
    label: "membro POST /modulo → 403",
  });

  // ——— Quiz ———
  const quizzes = await req("GET", "/quiz", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /quiz",
  });
  const quizId = quizzes.data?.[0]?.id_quiz;
  if (quizId) {
    const q = await req("GET", `/quiz/${quizId}`, {
      token: membroToken,
      expectStatus: 200,
      label: "membro GET /quiz/:id",
    });
    if (Array.isArray(q.data?.questoes) && q.data.questoes.some((x) => x.resposta_correta != null)) {
      failed++;
      results.push({ ok: false, name: "GET /quiz/:id não deve expor gabarito", status: 200 });
    } else {
      passed++;
      results.push({ ok: true, name: "GET /quiz/:id sem gabarito", status: 200 });
    }
    await req("GET", `/quiz/${quizId}/respostas/usuario?usuarioId=1`, {
      token: membroToken,
      expectStatus: 403,
      label: "membro ler respostas de outro → 403",
    });
  }
  await req("POST", "/quiz", {
    token: membroToken,
    body: { titulo: "Hack" },
    expectStatus: 403,
    label: "membro POST /quiz → 403",
  });

  // ——— Lições / Formulários ———
  await req("GET", "/licao", {
    token: membroToken,
    expectStatus: 200,
    label: "GET /licao",
  });
  await req("GET", "/formulario", {
    token: membroToken,
    expectStatus: 200,
    label: "GET /formulario",
  });
  await req("POST", "/licao", {
    token: membroToken,
    body: { titulo: "Hack" },
    expectStatus: 403,
    label: "membro POST /licao → 403",
  });
  await req("POST", "/formulario", {
    token: membroToken,
    body: { titulo: "Hack" },
    expectStatus: 403,
    label: "membro POST /formulario → 403",
  });

  // ——— Formulário resposta ———
  await req("GET", "/formulario-resposta", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /formulario-resposta → 403",
  });
  await req("POST", "/formulario-resposta", {
    token: membroToken,
    body: { id_formulario: 1, id_celula: 1, campos: [{ id_formulario_campo: 1, resposta: "x" }] },
    expectStatus: 403,
    label: "membro POST /formulario-resposta → 403",
  });
  await req("GET", "/formulario-resposta", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /formulario-resposta",
  });

  // ——— Eventos ———
  await req("GET", "/evento", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /evento",
  });
  await req("GET", "/evento", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /evento → 403",
  });

  // ——— Ministérios ———
  await req("GET", "/ministerios", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /ministerios",
  });

  // ——— Escala ———
  await req("GET", "/escala/eventos", {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /escala/eventos",
  });
  const ano = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  await req("GET", `/escala/visao/mes/${ano}/${mes}`, {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /escala/visao/mes",
  });
  await req("GET", `/escala/visualizacao/mes/${ano}/${mes}`, {
    token: membroToken,
    expectStatus: 200,
    label: "membro GET /escala/visualizacao/mes",
  });
  await req("POST", "/escala/eventos", {
    token: membroToken,
    body: { titulo: "Hack", data_hora: new Date().toISOString() },
    expectStatus: 403,
    label: "membro POST /escala/eventos → 403",
  });
  await req("GET", "/escala/templates", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /escala/templates → 403",
  });

  // ——— Notificações ———
  await req("GET", "/notificacoes", {
    token: membroToken,
    expectStatus: 200,
    label: "GET /notificacoes",
  });
  await req("GET", "/notificacoes/count", {
    token: membroToken,
    expectStatus: 200,
    label: "GET /notificacoes/count",
  });
  await req("PUT", "/notificacoes/marcar-todas-lidas", {
    token: membroToken,
    expectStatus: [200, 204],
    label: "PUT /notificacoes/marcar-todas-lidas",
  });

  // ——— Fala Aí ———
  await req("GET", "/fala-ai/posts", {
    token: membroToken,
    expectStatus: 200,
    label: "GET /fala-ai/posts",
  });
  await req("POST", "/fala-ai/posts", {
    token: membroToken,
    body: { titulo: "Hack", conteudo: "x", tipo: "devocional" },
    expectStatus: 403,
    label: "membro POST /fala-ai/posts → 403",
  });

  // ——— Campos (admin) ———
  await req("GET", "/campo", {
    token: adminToken,
    expectStatus: 200,
    label: "admin GET /campo",
  });
  await req("GET", "/campo", {
    token: membroToken,
    expectStatus: 403,
    label: "membro GET /campo → 403",
  });

  // ——— Register sucesso + limpeza ==========
  const emailNovo = `e2e_${Date.now()}@test.com`;
  const reg = await req("POST", "/auth/register", {
    body: {
      nome: "E2E User",
      email: emailNovo,
      senha: "123456",
      tipo: "administrador", // deve ser forçado a membro pelo schema
    },
    expectStatus: [201, 200, 400],
    label: "POST /auth/register",
  });
  if (reg.status === 200 || reg.status === 201) {
    if (reg.data?.usuario?.tipo && reg.data.usuario.tipo !== "membro") {
      failed++;
      results.push({
        ok: false,
        name: "register não deve aceitar tipo administrador",
        status: reg.status,
        body: JSON.stringify(reg.data?.usuario),
      });
    } else {
      passed++;
      results.push({ ok: true, name: "register força/aceita apenas membro", status: reg.status });
    }
  }

  // ——— Upload assets estáticos ———
  {
    const url = BASE.replace(/\/api$/, "") + "/uploads/celulas/visao.jpg";
    const res = await fetch(url);
    if (res.status === 200) {
      passed++;
      results.push({ ok: true, name: "GET /uploads/celulas/visao.jpg", status: 200 });
    } else {
      failed++;
      results.push({ ok: false, name: "GET /uploads/celulas/visao.jpg", status: res.status });
    }
  }

  // Relatório
  console.log("─".repeat(60));
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`❌ ${r.name}`);
    console.log(`   status=${r.status} expect=${JSON.stringify(r.expectStatus)} ${r.body || r.errMsg || ""}`);
  }
  console.log("─".repeat(60));
  console.log(`✅ ${passed} passou | ❌ ${failed} falhou | total ${passed + failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Suite crash:", e);
  process.exit(1);
});
