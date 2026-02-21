# Acessibilidade — Casa dos Discípulos

O sistema foi desenvolvido para que **cegos, surdos, pessoas com baixa visão ou mobilidade reduzida** possam utilizá-lo de forma independente.

---

## Princípios

A Casa dos Discípulos segue as diretrizes **WCAG 2.1 nível AA** e adota boas práticas de acessibilidade em todas as áreas da aplicação.

---

## Recursos por necessidade

### 👁️ Usuários cegos (leitores de tela)

| Recurso | Descrição |
|---------|-----------|
| **Skip Link** | Primeiro elemento ao pressionar Tab; pula a navegação e vai direto ao conteúdo |
| **Título dinâmico** | Cada tela tem título descritivo (ex.: "Casa dos Discípulos – Gerenciar usuários") |
| **Landmarks** | `<main id="main-content">`, `<nav>`, `<section>` com `aria-label` |
| **Labels em formulários** | Todo campo tem `label` associado via `htmlFor`/`id` |
| **ARIA** | `aria-label`, `aria-describedby`, `role`, `aria-live` em elementos dinâmicos |
| **Modais** | Foco preso com FocusTrap; fechar com Esc; foco restaurado ao fechar |
| **Navegação ativa** | Links atuais com `aria-current="page"` |
| **Login** | Labels para leitores de tela; erros com `role="alert"` e `aria-describedby` |
| **Teclado** | Tab, Enter, Esc; setas em listas quando aplicável |
| **Imagens** | `alt` descritivo em todas as imagens |
| **Notificações** | Toasts e mensagens com `aria-live` e `role="alert"` |

**Leitores testados:** NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)

---

### 👂 Usuários surdos

| Recurso | Descrição |
|---------|-----------|
| **Vídeos legendados** | YouTube com `cc_load_policy=1`; Vimeo e .mp4 com `<track kind="captions">` |
| **Instruções** | Campo de vídeo orienta o uso de legendas |
| **Sem áudio exclusivo** | Toda informação importante tem alternativa visual |
| **Notificações** | Notificações in-app; nada depende apenas de som |

---

### 👓 Usuários com baixa visão

| Recurso | Descrição |
|---------|-----------|
| **Tamanho do texto** | Botão ♿ no canto inferior direito: 100%, 110%, 125% ou 150% |
| **Alto contraste** | Modo alto contraste (fundo branco, texto preto) no mesmo menu |
| **Zoom** | Zoom do navegador permitido (sem restrições) |
| **Foco visível** | Outline claro ao navegar com Tab (`:focus-visible`) |
| **Redução de movimento** | Respeita `prefers-reduced-motion` |

---

### ⌨️ Usuários com mobilidade reduzida

| Recurso | Descrição |
|---------|-----------|
| **Teclado** | Todas as funções acessíveis por teclado |
| **Áreas clicáveis** | Tamanho adequado; suporte a Enter e Espaço |
| **Sem voz** | Nenhum comando por voz necessário |

---

## Navegação por teclado

| Tecla | Ação |
|-------|------|
| **Tab** | Avançar entre links, botões e campos |
| **Shift+Tab** | Voltar |
| **Enter** | Ativar links e botões |
| **Espaço** | Marcar checkboxes; ativar botões |
| **Esc** | Fechar modais, dropdowns e menus |
| **Setas** | Navegar em listas e opções (quando implementado) |

---

## Componentes acessíveis

| Componente | Função |
|------------|--------|
| **SkipLink** | Link de pular navegação (visível ao focar) |
| **AccessibilityBar** | Tamanho do texto e alto contraste; Tab + Enter para abrir; Esc para fechar |
| **LiveAnnouncer** | Anuncia mensagens para leitores de tela |
| **Toast** | `role="alert"` e `aria-live="polite"` |
| **Modais** | FocusTrap, fechamento com Esc, foco restaurado |

---

## Diretrizes para criadores de conteúdo

1. **Vídeos** — Use apenas vídeos com legendas. No YouTube, ative legendas; no Vimeo, adicione na configuração.
2. **Imagens** — Descreva no campo alt o que a imagem mostra.
3. **Textos** — Evite jargões; use linguagem clara.
4. **Links** — Use texto descritivo (evite "clique aqui").

---

## WCAG 2.1 — Princípios aplicados

- **Percepção** — Alternativas textuais, contraste adequado, conteúdo adaptável
- **Operabilidade** — Teclado, tempo suficiente, navegação clara
- **Compreensão** — Texto legível, previsível, assistência de entrada
- **Robustez** — Compatível com tecnologias assistivas

---

## Auditoria em desenvolvimento

Com `npm start`, o **@axe-core/react** analisa a página e reporta violações no **console do DevTools** (F12). Use isso para corrigir problemas durante o desenvolvimento.

---

*[Voltar ao índice](./README.md)*
