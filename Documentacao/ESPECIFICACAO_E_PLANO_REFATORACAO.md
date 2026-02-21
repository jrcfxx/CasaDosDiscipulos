# Especificação e Plano de Refatoração — Casa dos Discípulos

Visão técnica dos módulos e histórico de refatoração.

---

## 1. Visão geral do sistema

### 1.1 Escopo

Plataforma web para gestão de igrejas: formação (Escola de Discípulos), acompanhamento de células (Secretaria) e divulgação de eventos.

### 1.2 Módulos independentes

| Módulo | Propósito | Quem usa |
|--------|-----------|----------|
| **Módulos (Escola de Discípulos)** | Estudo com conteúdo + quiz opcional | Todos (membros e líderes) |
| **Lições** | Conteúdo para visualização e download | Líderes de células |
| **Formulários** | Relatórios semanais das células | Líderes preenchem; Admin visualiza |
| **Eventos** | Informações e próximos eventos (carrossel na home) | Admin altera; todos veem |
| **Usuários e Células** | Gestão de pessoas e grupos | Admin, líderes, membros (perfil) |

---

## 2. Especificação por módulo

### 2.1 Escola de Discípulos (Módulos e Quizzes)

**Fluxo:** Módulo (conteúdo) → Quiz (se existir) → Pontuação → Ranking

- **Progressão obrigatória:** Admin define ordem; usuário deve concluir na sequência.
- **Módulo = Nível:** Nível do usuário = quantidade de módulos concluídos.
- **Quiz opcional:** Módulo pode ou não ter quiz.
- **Quiz em múltiplos módulos:** Um quiz pode pertencer a vários módulos.
  - **1ª realização:** Pontuação integral.
  - **Replicação (mesmo quiz, outro módulo):** 1/3 da pontuação (participação).
- **Gamificação:** Pontos, ranking, níveis.

### 2.2 Lições (Secretaria das Células)

- **Público:** Líderes de células.
- **Conteúdo:** Texto, links, vídeos, arquivos (PDF etc.).
- **Ações:** Visualizar e baixar.
- **Upload:** Admin pode anexar arquivos em campos tipo upload.

### 2.3 Formulários (Secretaria das Células)

- **Criação:** Admin define formulários com campos dinâmicos (texto, textarea, número, data, link, upload, vídeo).
- **Tipos de campo:** Admin escolhe entre linha única ou área de texto por campo.
- **Preenchimento:** Líder escolhe a célula e preenche.
- **Periodicidade:** Vários envios por célula (ex.: relatórios semanais).
- **Visualização Admin:** Lista de respostas, expandir detalhes, dashboard de células respondidas.

### 2.4 Eventos

- **Uso:** Alteração frequente (ex.: semanal).
- **Exibição:** Carrossel na homepage (informações importantes + próximos eventos).

### 2.5 Usuários e Células

- **Tipos:** administrador, lider, membro.
- **Célula principal:** Membro escolhe no perfil (vinculação opcional).
- **Visitas:** Registradas via formulários (relatórios).

---

## 3. Arquitetura e padrões

- Código limpo e bem organizado.
- Separação clara: componentes, serviços, hooks.
- Variáveis de ambiente para URLs da API.
- Nomenclatura consistente (ex.: Quiz na Escola de Discípulos, não na Secretaria).
- Remoção de código morto e páginas obsoletas.

---

## 4. Plano de refatoração (status)

### Fase 1: Limpeza e consistência ✅

- Remover páginas obsoletas e referências.
- Padronizar rotas (`/admin/*` e `/usuario/*`).
- Padronizar links no Portal Admin.
- Corrigir rota desprotegida e navigations internas.

### Fase 2: Escola de Discípulos (Usuário) ✅

- ModulosEscolaDiscipulosUser integrado com API.
- PreencherModulosEscolaDiscipulosUser com conteúdo real e quiz.
- Progressão sequencial e pontuação diferenciada no quiz.

### Fase 3: Formulários (Líder e Admin) ✅

- FormulariosSecretariaCelulasLeader com seletor de célula e integração com API.
- FormulariosSecretariaCelulasAdmin com listagem, expansão e dashboard.
- Campos dinâmicos: admin define tipo (texto vs. textarea).

### Fase 4: Banco de dados e modelo ✅

- Tabela `usuario_celula` (id_usuario, id_celula, principal).
- Nível mantido; ordem de módulos validada.
- Campo `ordem` em `modulo`.

### Fase 5: Lições, Perfil e Eventos ✅

- Lições com upload/download.
- Perfil com seleção de célula principal.
- HomePage com carrossel de eventos.
- CRUD de eventos.

### Fase 6: Refinamentos e qualidade ✅

- URLs da API em configuração.
- Tratamento de erros padronizado.
- Documentação atualizada.

---

## 5. Fluxo de formulários (atual)

- **FormulariosSecretariaCelulasLeader:** Lista formulários → escolhe formulário → escolhe célula → preenche → envia.
- **Rota:** `/usuario/formularios` (opcional: `?formularioId=X` para deep link).
- **API:** `POST /api/formulario-resposta` com `{ id_formulario, id_celula, campos: [...] }`.
- **Campos:** Admin define tipo em cada campo (texto linha única ou área de texto multilinhas).

---

[← Voltar ao índice](./README.md)
