# Especificação do Sistema & Plano de Refatoração
## Casa dos Discípulos

**Última atualização:** 18/02/2025

---

## 1. Visão Geral do Sistema

### 1.1 Escopo
Plataforma web para gestão de igrejas: formação (Escola de Discípulos), acompanhamento de células (Secretaria) e divulgação de eventos.

### 1.2 Módulos Independentes

| Módulo | Propósito | Quem usa |
|--------|-----------|----------|
| **Módulos (Escola de Discípulos)** | Estudo com conteúdo + quiz opcional | Todos (membros e líderes) |
| **Lições** | Conteúdo para visualização e download | Apenas líderes de células |
| **Formulários** | Relatórios semanais das células | Líderes preenchem, Admin visualiza |
| **Eventos** | Informações e próximos eventos (carrossel na home) | Admin altera, todos veem |
| **Usuários e Células** | Gestão de pessoas e grupos | Admin, líderes, membros (perfil) |

---

## 2. Especificação por Módulo

### 2.1 Escola de Discípulos (Módulos e Quizzes)

**Fluxo:** Módulo (conteúdo) → Quiz (se existir) → Pontuação → Ranking

- **Progressão obrigatória:** Admin define ordem; usuário deve concluir na sequência.
- **Módulo = Nível:** Nível do usuário = quantidade de módulos concluídos (Módulo 1 = Nível 1, etc.).
- **Quiz opcional:** Módulo pode ou não ter quiz.
- **Quiz em múltiplos módulos:** Um quiz pode pertencer a vários módulos.
  - **1ª realização:** Pontuação integral.
  - **Replicação (mesmo quiz, outro módulo):** 1/3 da pontuação (participação).
- **Gamificação:** Pontos, ranking, níveis.

### 2.2 Lições (Secretaria das Células)

- **Público:** Apenas líderes de células.
- **Conteúdo:** Texto, links, vídeos, arquivos (PDF etc.).
- **Ações:** Visualizar e baixar.
- **Upload:** Admin pode anexar arquivos em campos tipo upload.

### 2.3 Formulários (Secretaria das Células)

- **Criação:** Admin define formulários com campos dinâmicos.
- **Preenchimento:** Líder escolhe a célula e preenche.
- **Periodicidade:** Vários envios por célula (ex.: relatórios semanais).
- **Visualização Admin:**
  - Lista de todas as respostas.
  - Expandir resposta para ver detalhes.
  - Dashboard: mapeamento de células que responderam ou não (fase inicial).

### 2.4 Eventos

- **Uso:** Alteração frequente (ex.: semanal).
- **Exibição:** Carrossel na homepage (informações importantes + próximos eventos).

### 2.5 Usuários e Células

- **Tipos:** administrador, lider, membro.
- **Célula principal:** Membro escolhe no perfil (vinculação opcional).
- **Visitas:** Não precisa registrar; o líder inclui presenças/visitas nos formulários (reports).

---

## 3. Arquitetura e Padrões Desejados

- Código limpo, moderno e bem organizado.
- Separação clara: componentes, serviços, hooks.
- Uso de variáveis de ambiente para URLs da API.
- Nomenclatura consistente (ex.: Quiz na Escola de Discípulos, não na Secretaria).
- Remoção de código morto e páginas obsoletas.

---

## 4. Plano de Refatoração (Fases)

### Fase 1: Limpeza e Consistência (Base) ✅ CONCLUÍDA
1. **Remover páginas obsoletas** e referências: ✅
   - `InicioFormularioSecretariaUser` (+ rota + CSS)
   - `PreencherFormularioSecretariaUser` (formulário mock; fluxo real está em `FormulariosSecretariaCelulasLeader`)
2. **Padronizar rotas:** Usar apenas `/admin/*` e `/usuario/*` (manter redirects para compatibilidade). ✅
3. **Padronizar links no Portal Admin:** Apontar para `/admin/*`. ✅
4. **Corrigir rota desprotegida:** `/EditarModulosEscolaDiscipulosAdmin/:id_modulo` → usar `ProtectedRoute`. ✅
5. **Corrigir navigations internas:** CriarModulosEscolaDiscipulosAdmin, EditarModulosEscolaDiscipulosAdmin, ModulosEscolaDiscipulosAdmin, CriarFormulariosSecretariaCelulasAdmin. ✅

### Fase 2: Escola de Discípulos (Usuário) ✅ CONCLUÍDA
1. **ModulosEscolaDiscipulosUser:** Integrar com API (remover dados fixos). ✅
2. **PreencherModulosEscolaDiscipulosUser:** Buscar módulo por ID, exibir conteúdo real e quiz (se houver). ✅
3. **Progressão sequencial:** Módulos liberados conforme conclusão (primeiro não concluído na ordem). ✅
4. **Quiz com pontuação diferenciada:** 1ª vez = 100%; repetição = 33%. ✅

### Fase 3: Formulários (Líder e Admin) ✅ CONCLUÍDA
1. **FormulariosSecretariaCelulasLeader:** ✅
   - Seletor de célula ao preencher.
   - Integração com `POST /api/formulario-resposta`.
   - Payload: `id_formulario`, `id_celula`, `campos` com `id_formulario_campo`.
2. **FormulariosSecretariaCelulasAdmin:** ✅
   - Listar respostas ao clicar em formulário.
   - Expandir resposta para ver detalhes.
   - Dashboard: células que responderam vs. não responderam.

### Fase 4: Banco de Dados e Modelo ✅ CONCLUÍDA
1. **Usuário × Célula:** Tabela `usuario_celula` (id_usuario, id_celula, principal: boolean). ✅
2. **Nível:** Mantido como dado explícito em usuário; ordem de módulos já validada. ✅
3. **Ordem de módulos:** Campo `ordem` em `modulo` e validação de progressão. ✅

### Fase 5: Lições, Perfil e Eventos ✅ CONCLUÍDA
1. **Lições:** Suporte a upload/download em campos (já existente). ✅
2. **Perfil:** Seleção de célula principal pelo membro e líder. ✅
3. **HomePage:** Carrossel com informações e eventos. ✅
4. **Eventos:** CRUD completo e exposição na API. ✅

### Fase 6: Refinamentos e Qualidade ✅ PARCIALMENTE CONCLUÍDA
1. Extrair URLs da API para configuração: `src/config/api.ts` + `REACT_APP_API_URL` no `.env`. ✅
2. Padronizar tratamento de erros: em andamento.
3. Revisar nomes de componentes: pendente.
4. Documentar APIs e fluxos principais: pendente.

---

## 5. Páginas a Remover (Fase 1)

| Página | Motivo |
|--------|--------|
| `InicioFormularioSecretariaUser` | Obsoleta; redireciona para rota inexistente |
| `PreencherFormularioSecretariaUser` | Formulário mock; fluxo real em `FormulariosSecretariaCelulasLeader` |

**Rotas a remover:**
- Qualquer referência a `InicioFormularioSecretariaUser`
- `/usuario/formularios/preencher/:id` (ou redirecionar para `/usuario/formularios` com formId em query)

---

## 6. Fluxo de Formulários (Arquitetura Atual vs. Desejada)

**Atual:**
- `FormulariosSecretariaCelulasLeader`: lista forms, preenche na mesma tela.
  - Erro: chama `POST /api/formulario/:id/resposta` (não existe).
  - Erro: não envia `id_celula`.
  - Erro: payload usa `id_campo` e `conteudo` em vez de `id_formulario_campo` e `resposta`.
- `PreencherFormularioSecretariaUser`: formulário fixo (nome, sobrenome, etc.), não usa API.

**Desejado:**
- Uma única página: `FormulariosSecretariaCelulasLeader` (ou nome mais genérico).
- Fluxo: listar formulários → escolher formulário → escolher célula → preencher → enviar.
- Rota: `/usuario/formularios` (opcional: `?formularioId=X` para deep link).
- API: `POST /api/formulario-resposta` com `{ id_formulario, id_celula, campos: [...] }`.

---

## 7. Próximos Passos Imediatos

1. Validar este documento com o cliente/equipe.
2. Iniciar Fase 1 (remoção de código obsoleto e padronização).
3. Seguir com Fases 2–6 conforme prioridade e disponibilidade.
