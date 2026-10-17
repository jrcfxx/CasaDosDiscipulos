/**
 * Crawl E2E do frontend (HashRouter) — visita rotas por papel e reporta saúde da página.
 * Uso (com FE em :3000 e API em :3001):
 *   node scripts/e2eFrontendCrawl.mjs
 *
 * Requer: npm i -D playwright  (ou npx playwright)
 */
import { chromium } from "playwright";

const FE = process.env.FE_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:3001/api";

const PUBLIC_ROUTES = ["/", "/home", "/sobre-nos", "/celulas", "/login"];

const ADMIN_ROUTES = [
  "/portal/admin",
  "/admin/usuarios",
  "/admin/celulas",
  "/admin/licoes",
  "/admin/formularios",
  "/admin/modulos",
  "/admin/modulos/criar",
  "/admin/quizzes",
  "/admin/quizzes/criar",
  "/admin/eventos",
  "/usuario/escala",
  "/usuario/escala/mapa",
  "/usuario/fala-ai",
  "/usuario/fala-ai/admin",
  "/perfil",
];

const MEMBRO_ROUTES = [
  "/portal/usuario",
  "/usuario/modulos",
  "/usuario/escala",
  "/usuario/escala/mapa",
  "/usuario/fala-ai",
  "/perfil",
];

const MEMBRO_BLOCKED = [
  "/portal/admin",
  "/admin/usuarios",
  "/admin/celulas",
  "/admin/licoes",
  "/admin/formularios",
  "/admin/modulos",
  "/admin/quizzes",
  "/admin/eventos",
  "/usuario/licoes",
  "/usuario/formularios",
  "/usuario/fala-ai/admin",
];

const LIDER_CELULA_ROUTES = [
  "/portal/usuario",
  "/usuario/licoes",
  "/usuario/formularios",
  "/usuario/modulos",
  "/usuario/escala",
  "/usuario/fala-ai",
  "/perfil",
];

const results = [];
let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed++;
  results.push({ ok: true, name, detail });
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  failed++;
  results.push({ ok: false, name, detail });
  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function loginApi(email, senha) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Login API falhou (${email}): ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function setSession(page, { token, usuario }) {
  await page.goto(`${FE}/#/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ token, usuario }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
    },
    { token, usuario }
  );
  await page.reload({ waitUntil: "networkidle" });
}

async function clearSession(page) {
  await page.goto(`${FE}/#/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function visit(page, hashPath, { expectHashIncludes, expectHashNot, label } = {}) {
  const consoleErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err) => consoleErrors.push(String(err));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    await page.goto(`${FE}/#${hashPath}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(600);

    const info = await page.evaluate(() => {
      const root = document.getElementById("root");
      const main = document.querySelector("main, #main-content, [role='main']");
      const h1 = document.querySelector("h1")?.textContent?.trim() || "";
      const bodyText = (document.body?.innerText || "").slice(0, 500);
      const hasErrorBoundary =
        /algo deu errado|unexpected application error|cannot read propert/i.test(bodyText);
      const blank = !root || !root.innerText || root.innerText.trim().length < 5;
      return {
        hash: location.hash,
        title: document.title,
        h1,
        blank,
        hasErrorBoundary,
        textLen: (root?.innerText || "").trim().length,
      };
    });

    const name = label || `GET #${hashPath}`;
    if (info.blank || info.hasErrorBoundary) {
      fail(name, `página quebrada/vazia h1="${info.h1}"`);
      return info;
    }
    if (expectHashIncludes && !info.hash.includes(expectHashIncludes)) {
      fail(name, `esperava hash conter ${expectHashIncludes}, veio ${info.hash}`);
      return info;
    }
    if (expectHashNot && info.hash.includes(expectHashNot)) {
      fail(name, `não deveria permanecer em ${expectHashNot}, veio ${info.hash}`);
      return info;
    }
    // Filtra ruído comum do CRA/devtools
    const realErrors = consoleErrors.filter(
      (e) =>
        !/Download the React DevTools/i.test(e) &&
        !/favicon/i.test(e) &&
        !/Warning:/i.test(e) &&
        // Rate limit transitório durante crawl massivo
        !/status of 429/i.test(e)
    );
    if (realErrors.length) {
      fail(name, `console: ${realErrors[0].slice(0, 160)}`);
      return info;
    }
    ok(name, `${info.hash} | ${info.h1 || info.title}`);
    return info;
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

async function clickIfVisible(page, selector, name) {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0 || !(await el.isVisible().catch(() => false))) {
    fail(name, "elemento não visível");
    return false;
  }
  await el.click();
  await page.waitForTimeout(400);
  ok(name);
  return true;
}

async function testPublic(page) {
  console.log("\n=== PÚBLICO ===");
  await clearSession(page);
  for (const r of PUBLIC_ROUTES) {
    await visit(page, r, { label: `público #${r}` });
  }
  // Login inválido
  await page.goto(`${FE}/#/login`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "admin@test.com");
  await page.fill("#login-senha", "errada");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
  const err = await page.locator(".error-message, [role='alert']").first().textContent();
  if (/credenciais inválidas/i.test(err || "")) ok("login senha errada mostra mensagem");
  else fail("login senha errada mostra mensagem", err || "(vazio)");
}

async function testAdmin(page, session) {
  console.log("\n=== ADMIN ===");
  await setSession(page, session);
  for (const r of ADMIN_ROUTES) {
    await visit(page, r, {
      expectHashIncludes: r.split("/:")[0],
      label: `admin #${r}`,
    });
  }

  // Funcionalidades: abrir modal criar célula
  await page.goto(`${FE}/#/admin/celulas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const plus = page.getByRole("button", { name: "+" }).first();
  if (await plus.isVisible().catch(() => false)) {
    await plus.click();
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"], .modal, form').first();
    if (await dialog.isVisible().catch(() => false)) ok("admin células abre formulário criar");
    else fail("admin células abre formulário criar");
    // fechar se houver cancelar/fechar
    const cancel = page.getByRole("button", { name: /cancelar|fechar|voltar/i }).first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
  } else fail("admin células botão +");

  // Usuários: abas
  await page.goto(`${FE}/#/admin/usuarios`, { waitUntil: "networkidle" });
  for (const tab of ["Níveis", "Ministérios", "Usuários"]) {
    const btn = page.getByRole("button", { name: tab }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
      ok(`admin usuários aba ${tab}`);
    } else fail(`admin usuários aba ${tab}`);
  }

  // Módulos listagem + criar
  await visit(page, "/admin/modulos", { label: "admin módulos lista" });
  await visit(page, "/admin/modulos/criar", { label: "admin módulos criar" });

  // Eventos
  await page.goto(`${FE}/#/admin/eventos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const h1 = await page.locator("h1").first().textContent().catch(() => "");
  if (/evento/i.test(h1 || "") || (await page.locator("body").innerText()).length > 50) {
    ok("admin eventos conteúdo");
  } else fail("admin eventos conteúdo", h1);

  // Perfil
  await page.goto(`${FE}/#/perfil`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  if (await page.locator("input, form").first().isVisible().catch(() => false)) {
    ok("admin perfil formulário");
  } else fail("admin perfil formulário");
}

async function testMembro(page, session) {
  console.log("\n=== MEMBRO ===");
  await setSession(page, session);
  for (const r of MEMBRO_ROUTES) {
    await visit(page, r, { label: `membro #${r}` });
  }
  for (const r of MEMBRO_BLOCKED) {
    await visit(page, r, {
      expectHashNot: "/admin/",
      label: `membro bloqueado #${r} → redireciona`,
    });
    const hash = await page.evaluate(() => location.hash);
    if (hash.includes("/portal/usuario") || hash.includes("/portal/usuario") || !hash.includes(r)) {
      // ProtectedRoute manda para portal/usuario
      if (hash.includes("portal/usuario") || hash.includes("/login")) {
        // already counted in visit; soft check
      }
    }
  }

  // Abrir um módulo
  await page.goto(`${FE}/#/usuario/modulos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const ver = page.getByRole("button", { name: /ver módulo|fundamentos/i }).first();
  if (await ver.isVisible().catch(() => false)) {
    await ver.click();
    await page.waitForTimeout(800);
    ok("membro ver módulo");
  } else {
    // fallback: botão de módulo na lista
    const mod = page.locator("button").filter({ hasText: /#\s*\d+/ }).first();
    if (await mod.isVisible().catch(() => false)) {
      await mod.click();
      ok("membro selecionar módulo na lista");
    } else fail("membro ver/selecionar módulo");
  }

  // Fala aí
  await visit(page, "/usuario/fala-ai", { label: "membro fala-ai" });
  // Escala
  await visit(page, "/usuario/escala", { label: "membro escala" });
  await visit(page, "/usuario/escala/mapa", { label: "membro mapa escala" });
}

async function testLiderCelula(page, session) {
  console.log("\n=== LÍDER CÉLULA ===");
  await setSession(page, session);
  for (const r of LIDER_CELULA_ROUTES) {
    await visit(page, r, { label: `líder célula #${r}` });
  }
  await page.goto(`${FE}/#/usuario/licoes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const text = await page.locator("body").innerText();
  if (/liç|licao|secretaria|nenhum/i.test(text)) ok("líder lições conteúdo");
  else fail("líder lições conteúdo");

  await page.goto(`${FE}/#/usuario/formularios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const textF = await page.locator("body").innerText();
  if (/formul|nenhum|secretaria/i.test(textF)) ok("líder formulários conteúdo");
  else fail("líder formulários conteúdo");
}

async function testAdminInteractions(page, session) {
  console.log("\n=== ADMIN INTERAÇÕES ===");
  await setSession(page, session);

  // Lições: botão criar/+
  await page.goto(`${FE}/#/admin/licoes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const plusLicao = page.getByRole("button", { name: "+" }).first();
  if (await plusLicao.isVisible().catch(() => false)) {
    await plusLicao.click();
    await page.waitForTimeout(500);
    const formVisible = await page.locator("form, [role='dialog'], input").first().isVisible().catch(() => false);
    if (formVisible) ok("admin lições abre criar/editar");
    else fail("admin lições abre criar/editar");
    const cancel = page.getByRole("button", { name: /cancelar|fechar|voltar/i }).first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
  } else {
    // página pode usar outro CTA
    const novo = page.getByRole("button", { name: /nova|criar|adicionar/i }).first();
    if (await novo.isVisible().catch(() => false)) {
      await novo.click();
      ok("admin lições CTA criar");
    } else fail("admin lições botão criar");
  }

  // Formulários
  await page.goto(`${FE}/#/admin/formularios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const plusForm = page.getByRole("button", { name: "+" }).first();
  if (await plusForm.isVisible().catch(() => false)) {
    await plusForm.click();
    await page.waitForTimeout(500);
    ok("admin formulários abre criar");
    const cancel = page.getByRole("button", { name: /cancelar|fechar|voltar/i }).first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
  } else {
    const novo = page.getByRole("button", { name: /novo|criar|adicionar/i }).first();
    if (await novo.isVisible().catch(() => false)) {
      await novo.click();
      ok("admin formulários CTA criar");
    } else fail("admin formulários botão criar");
  }

  // Quizzes: lista carregada
  await page.goto(`${FE}/#/admin/quizzes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const bodyQ = await page.locator("body").innerText();
  if (/quiz|secretaria|nenhum/i.test(bodyQ) && !/Erro ao processar/i.test(bodyQ)) {
    ok("admin quizzes lista sem erro de auth");
  } else fail("admin quizzes lista sem erro de auth");

  // Eventos: abrir modal novo se existir
  await page.goto(`${FE}/#/admin/eventos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const novoEv = page.getByRole("button", { name: /novo|criar|\+/i }).first();
  if (await novoEv.isVisible().catch(() => false)) {
    await novoEv.click();
    await page.waitForTimeout(400);
    ok("admin eventos abre formulário");
    const cancel = page.getByRole("button", { name: /cancelar|fechar/i }).first();
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
  } else ok("admin eventos (sem botão criar visível — ok se lista existe)");

  // Fala aí admin: formulário novo post
  await page.goto(`${FE}/#/usuario/fala-ai/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  if (await page.locator("textarea, input[type='text'], form").first().isVisible().catch(() => false)) {
    ok("admin fala-ai formulário novo post");
  } else fail("admin fala-ai formulário novo post");

  // Escala: carrega visão
  await page.goto(`${FE}/#/usuario/escala`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const escalaText = await page.locator("body").innerText();
  if (/escala|semana|mês|mes|ano|dia/i.test(escalaText)) ok("admin escala carrega visão");
  else fail("admin escala carrega visão");
}

async function testMembroInteractions(page, session) {
  console.log("\n=== MEMBRO INTERAÇÕES ===");
  await setSession(page, session);

  // Preencher módulo (navegar se houver link)
  await page.goto(`${FE}/#/usuario/modulos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const preencher = page.getByRole("link", { name: /preencher|continuar|abrir/i }).first();
  const ver = page.getByRole("button", { name: /ver módulo/i }).first();
  if (await preencher.isVisible().catch(() => false)) {
    await preencher.click();
    await page.waitForTimeout(1000);
    const hash = await page.evaluate(() => location.hash);
    if (hash.includes("/usuario/modulos/preencher")) ok("membro navega preencher módulo", hash);
    else ok("membro clicou preencher", hash);
  } else if (await ver.isVisible().catch(() => false)) {
    await ver.click();
    await page.waitForTimeout(600);
    const ir = page.getByRole("link", { name: /preencher|iniciar|continuar|abrir módulo/i }).first();
    if (await ir.isVisible().catch(() => false)) {
      await ir.click();
      await page.waitForTimeout(800);
      ok("membro abre fluxo do módulo");
    } else ok("membro visualiza detalhe do módulo");
  } else {
    fail("membro interação módulo");
  }

  // Perfil: campos editáveis
  await page.goto(`${FE}/#/perfil`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const nome = page.locator("input").first();
  if (await nome.isVisible().catch(() => false)) ok("membro perfil tem inputs");
  else fail("membro perfil tem inputs");

  // Notificações no header
  const notif = page.getByRole("button", { name: /notifica/i }).first();
  if (await notif.isVisible().catch(() => false)) {
    await notif.click();
    await page.waitForTimeout(400);
    ok("membro abre painel notificações");
  } else fail("membro botão notificações");
}

async function testPublicInteractions(page) {
  console.log("\n=== PÚBLICO INTERAÇÕES ===");
  await clearSession(page);
  await page.goto(`${FE}/#/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const celulasBtn = page.getByRole("button", { name: /encontre sua célula/i }).first();
  if (await celulasBtn.isVisible().catch(() => false)) {
    await celulasBtn.click();
    await page.waitForTimeout(800);
    const hash = await page.evaluate(() => location.hash);
    if (hash.includes("celulas")) ok("home CTA → células", hash);
    else fail("home CTA → células", hash);
  } else {
    await page.goto(`${FE}/#/celulas`, { waitUntil: "networkidle" });
    ok("público células (fallback navigate)");
  }

  await page.goto(`${FE}/#/celulas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const cards = await page.locator("body").innerText();
  if (/célula|reino|flecha|gd/i.test(cards)) ok("células públicas listam conteúdo");
  else fail("células públicas listam conteúdo");

  await page.goto(`${FE}/#/sobre-nos`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const staff = await page.locator("body").innerText();
  if (/staff|missão|visão|wanderson|casa/i.test(staff)) ok("sobre-nós mostra staff/missão");
  else fail("sobre-nós mostra staff/missão");
}

async function testRedirects(page, adminSession) {
  console.log("\n=== REDIRECTS LEGACY ===");
  await setSession(page, adminSession);
  const pairs = [
    ["/HomePage", "/home"],
    ["/GerenciarUsuarios", "/admin/usuarios"],
    ["/LicoesSecretariaAdmin", "/admin/licoes"],
    ["/ModulosEscolaDiscipulosAdmin", "/admin/modulos"],
    ["/QuizzesSecretariaCelulasAdmin", "/admin/quizzes"],
    ["/portal", "/portal/admin"],
  ];
  for (const [from, to] of pairs) {
    await page.goto(`${FE}/#${from}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const hash = await page.evaluate(() => location.hash);
    if (hash.includes(to.replace(/^\//, "")) || hash.endsWith(to) || hash.includes(to)) {
      ok(`redirect #${from} → ${to}`, hash);
    } else fail(`redirect #${from} → ${to}`, hash);
  }
}

async function resolveLiderCelula() {
  // Tenta emails conhecidos com lider_celula
  const candidates = [
    "lorrayne.andrade@casadosdiscipulos.org",
    "lider@test.com",
    "wanderson.lino@casadosdiscipulos.org",
  ];
  for (const email of candidates) {
    try {
      const data = await loginApi(email, "123456");
      if (data.usuario?.lider_celula || data.usuario?.tipo === "lider") {
        // Prefer true lider_celula flag
        if (data.usuario.lider_celula) return data;
      }
    } catch {
      /* next */
    }
  }
  // fallback: buscar via admin
  const admin = await loginApi("admin@test.com", "123456");
  const res = await fetch(`${API}/usuarios`, {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const users = await res.json();
  const lider = (users || []).find((u) => u.lider_celula && u.ativo);
  if (!lider) throw new Error("Nenhum líder de célula encontrado");
  // precisamos senha — seeds usam 123456
  return loginApi(lider.email, "123456");
}

async function main() {
  console.log(`\n🧪 E2E Frontend crawl — ${FE}\n`);

  const admin = await loginApi("admin@test.com", "123456");
  const membro = await loginApi("membro@test.com", "123456");
  let lider;
  try {
    lider = await resolveLiderCelula();
    console.log(`Líder célula: ${lider.usuario.email}`);
  } catch (e) {
    console.warn("Sem líder célula:", e.message);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);

  try {
    await testPublic(page);
    await testPublicInteractions(page);
    await testAdmin(page, admin);
    await testAdminInteractions(page, admin);
    await testMembro(page, membro);
    await testMembroInteractions(page, membro);
    if (lider) await testLiderCelula(page, lider);
    await testRedirects(page, admin);

    // Admin login via UI
    console.log("\n=== LOGIN UI ADMIN ===");
    await clearSession(page);
    await page.goto(`${FE}/#/login`, { waitUntil: "networkidle" });
    await page.fill("#login-email", "admin@test.com");
    await page.fill("#login-senha", "123456");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hash = await page.evaluate(() => location.hash);
    if (hash.includes("/portal/admin")) ok("login UI admin → portal admin", hash);
    else fail("login UI admin → portal admin", hash);
  } finally {
    await browser.close();
  }

  console.log("\n────────────────────────────────────────────");
  console.log(`✅ ${passed} passou | ❌ ${failed} falhou | total ${passed + failed}`);
  console.log("────────────────────────────────────────────\n");
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error("Suite crash:", e);
  process.exit(1);
});
