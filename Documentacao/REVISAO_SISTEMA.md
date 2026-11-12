# Revisão do sistema — Casa dos Discípulos

Revisão ponta a ponta de backend, frontend, deploy e qualidade de código (12/11/2026).
Legenda de status: ✅ corrigido · 🔲 aberto. C1–C4 corrigidos em 12/11/2026 (testes: `npm run test:seguranca`).

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
| R2 | Ao mudar o quiz de um módulo já concluído, o progresso/nota antigos não são recalculados (depende de C1). | `QuizService`/`ModuloService` | 🔲 |
| R3 | `toggleActive` permite o admin desativar a si mesmo ou o último admin → ninguém mais administra o sistema. | `services/UsuarioService.js` | 🔲 |
| R4 | `lider_celula` e `lider_ministerio` (flags em `usuario`) convivem com as tabelas `celula_lider` e `ministerio_lider`: duas fontes da verdade para liderança. Rotas de formulário usam só `tipo=lider`, ignorando `lider_celula`. | `middlewares/checkRole.js`, `routes/formularioRespostaRoutes.js` | 🔲 |
| R5 | Status `concluida` da escala nunca é aplicado automaticamente após o evento. | Escala | 🔲 |
| R6 | Área da escala vinculada ao ministério pelo **nome**: renomear um ministério quebra o vínculo em eventos antigos. | `EscalaService.createEvento/updateEvento` | 🔲 |
| R7 | Copiar evento/aplicar template não verifica se a pessoa continua ativa ou no ministério. | `EscalaService.copiarEvento/aplicarTemplate` | 🔲 |
| R8 | Ranking público (`/api/modulo/ranking`, sem login) expõe nome, foto e pontuação de membros — avaliar LGPD/consentimento. | `routes/ModuloRoutes.js:14` | 🔲 |

## 🟡 Operação / infraestrutura

| # | Problema | Onde | Status |
|---|---|---|---|
| O1 | WhatsApp: `fetch` sem timeout — se a Evolution travar, a requisição (ex.: publicar escala) fica pendurada. | `services/WhatsAppService.js:65` | 🔲 |
| O2 | Job semanal dispara **todas** as mensagens ao mesmo tempo (`Promise.all`) — risco de bloqueio do número pelo WhatsApp. Precisa de fila/intervalo. | `jobs/whatsappModulosJob.js:19` | 🔲 |
| O3 | Publicar escala envia notificação + WhatsApp **um por um aguardando** (N consultas + N chamadas HTTP) — lento com muitas pessoas. | `EscalaService._notificarEscalado` | 🔲 |
| O4 | Logs gravam telefones (dado pessoal). | `WhatsAppService.js` | 🔲 |
| O5 | Sem backup automático do MySQL (volume Docker único no droplet). | `deploy/` | 🔲 |
| O6 | Sem monitoramento/alerta de queda (o incidente de memória só foi visto manualmente). | — | 🔲 |
| O7 | `npm audit`: vulnerabilidades **altas** no backend (`body-parser`, `express-rate-limit`, `joi`, `jws`, `lodash`, `ip-address`) e no frontend (dependências do `react-scripts`). | `package.json` | 🔲 |
| O8 | Evolution API em `:latest` — uma atualização upstream pode quebrar o WhatsApp sem aviso. Fixar versão. | `deploy/docker-compose.yml` | 🔲 |
| O9 | Cabeçalho `Cache-Control` duplicado em `/static` (nginx `expires` + `add_header`). | `deploy/nginx/nginx-ssl.conf` | 🔲 |

## 🔵 Qualidade de código

| # | Ponto | Detalhe |
|---|---|---|
| Q1 | **Sem testes automatizados no CI.** `npm test` do backend não existe; só os scripts `test:escala` (criados nesta revisão). Frontend sem testes. | Rodar `test:escala` num MySQL de CI. |
| Q2 | **Componentes gigantes**: `GerirUser.tsx` (1.619 linhas), `FormulariosSecretariaCelulasAdmin.tsx` (1.361), `EscalaUser.tsx` (1.3k), `QuizzesSecretariaCelulasAdmin.tsx` (1.021); `EscalaService.js` (1.7k). | Dividir por responsabilidade. |
| Q3 | Tipagem fraca no frontend: 78 ocorrências de `any` e 31 `eslint-disable`. | |
| Q4 | `react-scripts` (Create React App) está descontinuado — fonte da maioria das vulnerabilidades do frontend. | Migrar para Vite. |
| Q5 | Dependências erradas no backend: `@types/react`, `@types/react-dom` e `typescript` em `dependencies` (vão para a imagem de produção). | Remover. |
| Q6 | Padrões inconsistentes: alguns controllers respondem erro direto (`res.status(...)`), outros usam `next(err)`; checagem de admin por string `"administrador"` em vez de `USER_TYPES`. | |
| Q7 | Leituras com efeito colateral (C1) e N+1 queries (ranking, publicação da escala, notificações). | |
| Q8 | Registros de histórico/notificação fora de transação junto com a operação principal. | |
| Q9 | 11 `TODO/FIXME` pendentes no código. | |

---

## Ordem sugerida

1. **C1, C2, C3, C4** (perda de dados e segurança) — mesmo deploy.
2. **O1, O2, O5** (WhatsApp e backup) — antes de ativar o WhatsApp.
3. **R3, R4, O7** (lockout de admin, liderança única, vulnerabilidades).
4. Qualidade (Q1–Q5) de forma contínua.
