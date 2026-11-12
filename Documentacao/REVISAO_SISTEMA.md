# Revisão do sistema — Casa dos Discípulos

Revisão ponta a ponta de backend, frontend, deploy e qualidade de código (12/11/2026).
Legenda de status: ✅ corrigido · 🟨 pronto no código, falta um passo no servidor · 🔲 aberto. C1–C4 corrigidos em 12/11/2026 (testes: `npm run test:seguranca`).

**Cobertura:** backend inteiro lido por rotas → controllers → services/models nos pontos de regra
de negócio e permissão; Escala lida linha a linha; frontend revisado em rotas, autenticação, datas,
fluxos da Escala e métricas de qualidade. Telas grandes (`GerirUser`, `FormulariosSecretariaCelulasAdmin`,
`QuizzesSecretariaCelulasAdmin`) foram avaliadas por estrutura, não linha a linha.

---

## 🔴 Críticos — perda de dados ou segurança

| # | Problema | Onde | Status |
|---|---|---|---|
| C1 | **Abrir um quiz apaga as respostas de todos.** `GET /api/quiz/:id` sincroniza "campos" da Secretaria apagando e recriando as questões a cada leitura; `quiz_resposta` tem `ON DELETE CASCADE` para `quiz_questao`. Em quizzes criados pela Secretaria, cada vez que alguém abre o quiz, as respostas (e o histórico de notas) de todo mundo somem. | `services/QuizService.js:150`, `migrations/006_quiz.cjs:40` |✅ |
| C2 | **Gabarito vaza para membros.** O controller remove `resposta_correta`, mas devolve `campos[].conteudo` com `alternativas[].correta` / `correta`. Basta abrir o DevTools. | `controllers/QuizController.js:7` |✅ |
| C3 | **Upload de SVG por qualquer usuário logado → roubo de sessão.** `/api/upload/campo` aceita `image/svg+xml` e serve o arquivo em `/uploads`, no mesmo domínio do site. SVG pode ter `<script>`; o token JWT fica no `localStorage`. | `routes/uploadRoutes.js:64`, `app.js:77`, `frontend/src/services/authService.ts:120` |✅ |
| C4 | **Relatórios de célula sem isolamento.** Qualquer líder (`tipo=lider`) lista, vê, **edita e apaga** respostas de formulário de qualquer célula. Só a criação confere `celula_lider`. | `services/FormularioRespostaService.js:14,128,150` |✅ |
| C5 | Horários 3 h errados e "andando" a cada edição (backend em UTC). | `utils/dateUtils.js`, `Dockerfile` | ✅ |
| C6 | Todos os usuários com senha `123456` em produção; seed apagava o banco. | `seeds/` | ✅ |
| C7 | Rate limit compartilhado pela igreja inteira (sem `trust proxy`). | `app.js` | ✅ |
| C8 | Deploy compilava no servidor de 2 GB e derrubava a API. | `.github/workflows` | ✅ |
| C9 | Imagens de 3–12 MB (site e uploads). | `assets/`, uploads | ✅ |

## 🟠 Regras de negócio

| # | Problema | Onde | Status |
|---|---|---|---|
| R1 | Escala: paralelismo/exceções bloqueados; notificações em rascunho; membros viam rascunhos; consulta de escala de terceiros; limite contando a própria pessoa; "copiar dia" quebrado; "desfazer" quebrado; mudança de horário sem aviso; movimentação sem aviso à pessoa. | `services/EscalaService.js` | ✅ |
| R2 | Ao mudar o quiz de um módulo já concluído, o progresso/nota antigos não são recalculados. **Regra definida:** quem já concluiu mantém a conclusão e a nota (ninguém perde progresso por mudança do admin); respostas só somem se o admin remover a própria pergunta. | `QuizService`/`ModuloService` | ✅ |
| R3 | `toggleActive` permite o admin desativar a si mesmo ou o último admin → ninguém mais administra o sistema. | `services/UsuarioService.js` | ✅ |
| R4 | `lider_celula` e `lider_ministerio` (flags em `usuario`) convivem com as tabelas `celula_lider` e `ministerio_lider`: duas fontes da verdade para liderança. Rotas de formulário usam só `tipo=lider`, ignorando `lider_celula`. | `middlewares/checkRole.js`, `routes/formularioRespostaRoutes.js` | ✅ |
| R5 | Status `concluida` da escala nunca é aplicado automaticamente após o evento. | Escala | ✅ |
| R6 | Área da escala vinculada ao ministério pelo **nome**: renomear um ministério quebra o vínculo em eventos antigos. | `EscalaService.createEvento/updateEvento` | ✅ |
| R7 | Copiar evento/aplicar template não verifica se a pessoa continua ativa ou no ministério. | `EscalaService.copiarEvento/aplicarTemplate` | ✅ |
| R8 | Ranking público (`/api/modulo/ranking`, sem login) expõe nome, foto e pontuação de membros — avaliar LGPD/consentimento. | `routes/ModuloRoutes.js:14` | ✅ |

## 🟡 Operação / infraestrutura

| # | Problema | Onde | Status |
|---|---|---|---|
| O1 | WhatsApp: `fetch` sem timeout — se a Evolution travar, a requisição (ex.: publicar escala) fica pendurada. | `services/WhatsAppService.js:65` | ✅ |
| O2 | Job semanal dispara **todas** as mensagens ao mesmo tempo (`Promise.all`) — risco de bloqueio do número pelo WhatsApp. Precisa de fila/intervalo. | `jobs/whatsappModulosJob.js:19` | ✅ |
| O3 | Publicar escala envia notificação + WhatsApp **um por um aguardando** (N consultas + N chamadas HTTP) — lento com muitas pessoas. | `EscalaService._notificarEscalado` | ✅ |
| O4 | Logs gravam telefones (dado pessoal). | `WhatsAppService.js` | ✅ |
| O5 | Backup diário ativo no servidor desde 12/11/2026 (`deploy/backup.sh`: banco + uploads, 03:00 UTC, 14 dias). Backups semanais do droplet ativos na DigitalOcean (domingo, 04–08 UTC) + snapshot manual de 12/11/2026. | `deploy/backup.sh` | ✅ |
| O6 | Monitor a cada 10 min (API, site e validade do certificado) via GitHub Actions; falha gera e-mail do GitHub. | `.github/workflows/monitor.yml` | ✅ |
| O7 | `npm audit`: backend agora com **0 vulnerabilidades** (incl. `sharp` 0.35.5); frontend: `react-router` 7.18.5 (open redirect corrigido). Restam alertas só em ferramentas de build do `react-scripts`, que não vão para o navegador (resolve com Q4). | `package.json` | ✅ |
| O8 | Evolution fixada por digest no `.env` do servidor (`EVOLUTION_IMAGE=...@sha256:9666…7252`, 12/11/2026); só muda de versão se a linha for trocada. | `deploy/docker-compose.yml` | ✅ |
| O9 | `add_header` dentro de `location /static` e `/uploads` duplicava `Cache-Control` **e descartava HSTS / X-Frame-Options / nosniff** nessas respostas. | `deploy/nginx/*.conf` | ✅ |

## 🔵 Qualidade de código

| # | Ponto | Detalhe |
|---|---|---|
| Q1 | ✅ CI roda `test:escala` + `test:seguranca` (MySQL descartável) e, no frontend, checagem de tipos + Vitest (`npm test`: utilitários e modal de conflitos), antes de cada build/deploy. | Ampliar a cobertura do frontend aos poucos. |
| Q2 | **Componentes gigantes**: `GerirUser.tsx` (1.619 linhas), `FormulariosSecretariaCelulasAdmin.tsx` (1.361), `EscalaUser.tsx` (1.3k), `QuizzesSecretariaCelulasAdmin.tsx` (1.021); `EscalaService.js` (1.7k). | Dividir por responsabilidade. |
| Q3 | 🟨 `any` 78 → 53 e `eslint-disable` 31 → 25: erros de API tipados (`ErroApi`), `FocusTrap` tipado num só lugar, casts desnecessários removidos. Os restantes estão no sistema de campos dinâmicos (JSON de formato variável). | Tipar `conteudo` dos campos por tipo. |
| Q4 | ✅ Migrado para **Vite 6** (build de ~1 min para ~2 s); frontend com **0 vulnerabilidades**; `@axe-core` fora do bundle de produção; CI valida o nginx antes do deploy. | |
| Q5 | ✅ Removidas `@types/react`, `@types/react-dom` e `typescript` do backend. | |
| Q6 | ✅ Evento, Lição e Fala Aí passam a usar o tratador central (`next(err)`): erro de banco não vaza mais a mensagem SQL como 400. Papéis sempre via `USER_TYPES`. | |
| Q7 | ✅ Leitura com efeito colateral removida (C1). Notificações em massa da escala (publicar, evento criado/atualizado/cancelado) com 1 inserção em lote + 1 consulta de contatos, em vez de 2–3 consultas por pessoa. Ranking mantido (≤ 50 pessoas, consultas em paralelo). | |
| Q8 | ✅ Escalar, editar, remover, publicar e excluir evento gravam a operação e o histórico na mesma transação; notificações saem só depois de gravado. | |
| Q9 | ✅ Falso positivo: os 11 casos eram bytes dentro de imagens; não há TODO/FIXME no código. Achado relacionado: ~80 MB de fotos em `src/assets/` sem uso no código (não entram no site, só pesam no repositório). | Decidir se essas fotos devem ficar no repositório. |

---

## Próximos passos

1. Q2: dividir as telas gigantes, uma por vez, junto com mudanças nelas (agora há testes e checagem de tipos no CI para dar segurança).
2. Q3: tipar o conteúdo dos campos dinâmicos.
3. Decidir sobre as fotos sem uso em `src/assets/`.
