# Acessibilidade – Casa dos Discípulos

Este documento descreve os recursos de acessibilidade implementados para que **pessoas cegas, surdas, com baixa visão e com outras deficiências** possam usar a plataforma de forma independente.

---

## Recursos por Necessidade

### 👁️ Para usuários cegos (leitores de tela)

- **Link "Pular para o conteúdo principal"** – Primeiro elemento ao pressionar Tab; pula a navegação e vai direto ao conteúdo
- **Título da página dinâmico** – Cada tela tem um título descritivo (ex: "Casa dos Discípulos – Gerenciar usuários") anunciado pelo leitor de tela
- **Landmarks semânticos** – `<main id="main-content">` em todas as páginas; `<nav>`, `<section>` com `aria-label`
- **Labels em formulários** – Todo campo tem `label` associado via `htmlFor`/`id`
- **ARIA** – `aria-label`, `aria-describedby`, `role`, `aria-live` em elementos dinâmicos
- **Modais** – Foco preso com FocusTrap; fechar com Esc; foco restaurado ao fechar
- **Navegação ativa** – Links atuais da página com `aria-current="page"` para o leitor anunciar a posição
- **Formulário de login** – Labels visíveis para leitores de tela; erros com `role="alert"` e `aria-describedby` nos campos
- **Navegação por teclado** – Tab, Enter, Esc, setas em listas
- **Imagens** – `alt` descritivo em todas as imagens
- **Mensagens dinâmicas** – Toasts e notificações com `aria-live` e `role="alert"` para serem anunciados

**Tecnologias testadas:** NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS), TalkBack (Android)

### 👂 Para usuários surdos

- **Vídeos sempre com suporte a legendas:**
  - YouTube: `cc_load_policy=1` carrega legendas automaticamente quando disponíveis
  - Vimeo: suporta legendas na configuração do vídeo
  - Vídeos próprios (.mp4): `<track kind="captions">` em todos os players
- **Instruções explícitas** – No campo de vídeo, orientação para usar apenas vídeos legendados
- **Nenhum conteúdo somente em áudio** – Toda informação importante tem alternativa visual
- **Notificações visuais** – Notificações in-app; nada depende apenas de som

### 👓 Para usuários com baixa visão

- **Tamanho do texto** – Botão ♿ no canto inferior direito: 100%, 110%, 125% ou 150%
- **Alto contraste** – Modo alto contraste (fundo branco, texto preto) no mesmo menu
- **Zoom** – Zoom do navegador permitido (sem restrições)
- **Foco visível** – Outline claro ao navegar com Tab (`:focus-visible`)
- **Preferência do sistema** – Respeita `prefers-reduced-motion` (reduz animações)

### ⌨️ Para usuários com mobilidade reduzida

- **Teclado completo** – Todas as funções acessíveis por teclado
- **Elementos clicáveis** – Tamanho adequado; suporte a Enter e Espaço
- **Sem dependência de voz** – Nenhum comando por voz necessário

---

## Navegação por teclado

| Tecla | Ação |
|-------|------|
| **Tab** | Avança entre links, botões e campos |
| **Shift+Tab** | Volta |
| **Enter** | Ativa links e botões |
| **Espaço** | Marca checkboxes; ativa botões |
| **Esc** | Fecha modais, dropdowns e menus |
| **Setas** | Navega em listas e opções (quando implementado) |

---

## Componentes acessíveis

- **SkipLink** – Link de pular navegação (visível ao focar)
- **AccessibilityBar** – Menu de tamanho do texto e alto contraste (Tab + Enter para abrir; Esc para fechar)
- **LiveAnnouncer** – Anuncia mensagens para leitores de tela (uso interno)
- **Toast** – `role="alert"` e `aria-live="polite"` para ser anunciado
- **Modais** – FocusTrap, fechamento com Esc, foco restaurado

---

## Diretrizes para quem cria conteúdo

1. **Vídeos** – Use apenas vídeos com legendas. No YouTube, ative legendas; no Vimeo, adicione na configuração.
2. **Imagens** – Descreva no campo alt o que a imagem mostra.
3. **Textos** – Evite jargões; use linguagem clara.
4. **Links** – Texto do link deve ser descritivo (evite "clique aqui").

---

## Boas práticas WCAG 2.1

As alterações seguem as diretrizes WCAG 2.1 nível AA:

- **Percepção** – Alternativas textuais, contraste, adaptável
- **Operabilidade** – Teclado, tempo, navegação
- **Compreensão** – Texto legível, previsível, assistência de entrada
- **Robusto** – Compatível com tecnologias assistivas

---

## Auditoria em desenvolvimento

Com `npm start`, o **@axe-core/react** analisa a página e reporta violações no **console do DevTools** (F12). Use isso para corrigir problemas durante o desenvolvimento.
