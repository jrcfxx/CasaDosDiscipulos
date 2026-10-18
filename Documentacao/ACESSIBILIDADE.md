<div align="center">

<img src="../Codigo/frontend/src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Acessibilidade

**Para que toda a Casa possa participar — WCAG 2.1 AA**

[Índice](./README.md)
&nbsp;·&nbsp;
[Frontend](../Codigo/frontend/README.md)

</div>

---

A plataforma foi pensada para pessoas cegas, surdas, com baixa visão ou mobilidade reduzida usarem o sistema com autonomia — no mesmo cuidado visual do portal (contraste, tipografia Montserrat e foco visível).

---

## Leitores de tela

| Recurso | Detalhe |
|---------|---------|
| Skip link | Primeiro Tab → conteúdo principal |
| Título dinâmico | Ex.: “Casa dos Discípulos – Entrar” |
| Landmarks | `main`, `nav`, `section` com rótulos |
| Formulários | `label` + `htmlFor` / `id` |
| ARIA | `aria-label`, `aria-live`, `aria-current` |
| Modais | FocusTrap · Esc · foco restaurado |
| Erros | `role="alert"` no login e toasts |

**Testado com:** NVDA, JAWS, VoiceOver, TalkBack.

---

## Surdez

| Recurso | Detalhe |
|---------|---------|
| Vídeos | Legendas (YouTube `cc_load_policy`, tracks em MP4/Vimeo) |
| Conteúdo | Nada essencial só em áudio |
| Avisos | Notificações visuais in-app |

---

## Baixa visão

| Recurso | Detalhe |
|---------|---------|
| Tamanho do texto | Barra de acessibilidade: 100%–150% |
| Alto contraste | Fundo claro / texto escuro |
| Zoom | Sem bloqueio do navegador |
| Foco | Outline claro em `:focus-visible` |
| Movimento | Respeita `prefers-reduced-motion` |

---

## Mobilidade reduzida

Tudo operável por teclado · alvos clicáveis adequados · Enter / Espaço / Esc.

| Tecla | Ação |
|-------|------|
| Tab / Shift+Tab | Navegar |
| Enter / Espaço | Ativar |
| Esc | Fechar overlays |

---

## Componentes

| Componente | Função |
|------------|--------|
| SkipLink | Pular navegação |
| AccessibilityBar | Texto e contraste |
| LiveAnnouncer | Anúncios para leitores |
| Toast / ConfirmModal | Feedback acessível |

---

## Para quem publica conteúdo

1. Vídeos sempre com legendas  
2. Imagens com `alt` descritivo  
3. Texto claro, sem jargão desnecessário  
4. Links com rótulo significativo (evitar “clique aqui”)

---

## Auditoria

Com `npm start`, o **@axe-core/react** reporta violações no console do navegador.

---

<div align="center">

[Índice](./README.md)

<br />

<sub>Casa dos Discípulos · Acessibilidade · 2026</sub>

</div>
