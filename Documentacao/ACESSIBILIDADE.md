# Acessibilidade – Casa dos Discípulos

Este documento descreve os recursos de acessibilidade implementados no site para garantir que pessoas **surdas**, **mudas**, **cegas** e com **baixa visão** possam usar a plataforma.

---

## Bibliotecas utilizadas

- **focus-trap-react** – Mantém o foco dentro de modais (evita “cair” fora da janela com o teclado)
- **@axe-core/react** – Auditoria automática em desenvolvimento (reporta violações no console)
- **eslint-plugin-jsx-a11y** – Regras de acessibilidade no código

---

## Resumo das Melhorias

| Necessidade                  | Recursos implementados                                                                 |
|-----------------------------|----------------------------------------------------------------------------------------|
| **Cegos**                   | Leitores de tela (ARIA, labels, skip link), navegação por teclado, foco visível, foco preso em modais |
| **Baixa visão**            | Controle de tamanho do texto, modo alto contraste, zoom sem restrição                  |
| **Surdos**                 | Legendas em vídeos (YouTube/Vimeo), alternativas textuais, instruções para conteúdo   |
| **Mudos**                  | Sem dependência de voz; tudo por teclado e mouse                                      |
| **Preferem menos movimento** | Respeita `prefers-reduced-motion` (animações reduzidas)                              |

---

## Detalhes por Categoria

### Deficiência visual (cegos e baixa visão)

- **Link “Pular para o conteúdo principal”** – visível ao focar com a teclado (Tab), permite pular o menu de navegação e ir direto ao conteúdo
- **Atributos ARIA** – `aria-label`, `aria-describedby`, `role` em botões, links, formulários e modais
- **Landmarks semânticos** – `<main id="main-content">` em todas as páginas; `<aside>`, `<section>`, `<nav>` com rótulos descritivos
- **Formulários** – labels associados a cada campo, mensagens de erro em `aria-describedby` e `role="alert"`
- **Imagens** – atributo `alt` descritivo em imagens
- **Foco visível** – outline claro em links, botões e campos ao navegar com teclado (`:focus-visible`)

### Baixa visão

- **Botão de acessibilidade** – ícone ♿ fixo no canto inferior direito
  - **Tamanho do texto**: 100%, 110%, 125% ou 150%
  - **Alto contraste**: alterna entre layout normal e alto contraste
- **Zoom** – zoom do navegador permitido (sem `maximum-scale` restritivo)
- **Contraste** – modo alto contraste para fundo branco e texto preto

### Surdos

- **Vídeos YouTube** – `cc_load_policy=1` carrega legendas automaticamente quando disponíveis
- **Instrução no formulário de vídeo** – orienta o uso de vídeos com legendas
- **Conteúdo textual** – textos, descrições e instruções em vez de apenas áudio

### Mudos

- **Sem dependência de voz** – não há comandos ou inputs por voz
- **Alternativas** – todas as ações podem ser feitas por teclado e mouse

---

## Navegação por teclado

- **Tab** – percorre links, botões e campos
- **Enter** – ativa links e botões
- **Esc** – fecha modais e dropdowns
- **Setas** – em listas e opções, quando apropriado

---

## Tecnologias assistivas testadas

Recomenda-se testar o site com:

- **NVDA** (Windows, gratuito)
- **JAWS** (Windows)
- **VoiceOver** (macOS, iOS)
- **TalkBack** (Android)

---

## Modais e teclado

Os modais (Confirmar, Dar Pontos, Input, etc.) usam **FocusTrap** para:

- Manter o foco dentro do modal ao pressionar Tab
- Fechar com a tecla **Esc**
- Restaurar o foco ao botão/elemento que abriu o modal ao fechar

## Auditoria em desenvolvimento

Ao rodar `npm start`, o **axe-core** analisa a página e reporta violações de acessibilidade no **console do DevTools** (F12). Use isso para corrigir problemas ao desenvolver.

## Preferência por menos movimento

O site respeita `prefers-reduced-motion` do sistema operacional. Usuários que configuram “reduzir movimento” terão animações e transições minimizadas (útil para enjoo, vertigem, epilepsia fotossensível).

---

## Boas práticas WCAG 2.1

As alterações seguem as diretrizes WCAG 2.1 nível AA quando possível, incluindo:

- Percepção (alternativas textuais, contraste, adaptável)
- Operabilidade (teclado, tempo, navegação)
- Compreensão (texto legível, previsível, assistência de entrada)
- Robusto (compatível com tecnologias assistivas)
