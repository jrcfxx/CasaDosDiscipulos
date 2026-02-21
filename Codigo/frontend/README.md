# Casa dos Discípulos — Frontend

Aplicação React da plataforma Casa dos Discípulos: formação, células e eventos.

---

## Stack

- **React** 18
- **TypeScript**
- **React Router** 6
- **Axios** (via apiClient)
- **CSS** com variáveis (tokens) e Montserrat como fonte principal

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Desenvolvimento em `http://localhost:3000` |
| `npm run build` | Build de produção em `build/` |
| `npm test` | Rodar testes (interativo) |
| `npm run eject` | Ejetar CRA (operação irreversível; não recomendado) |

---

## Estrutura principal

```
src/
├── components/       # Componentes reutilizáveis
│   ├── layout/       # Header, Footer, Layout, etc.
│   ├── ui/           # Buttons, Toast, modais
│   └── acessibilidade/  # SkipLink, AccessibilityBar, LiveAnnouncer
├── pages/            # Páginas/rotas
├── services/         # API (eventoService, apiClient)
├── contexts/         # AuthContext
├── hooks/            # usePageTitle, etc.
├── utils/            # generateUid, errorUtils
├── types/            # Tipos TypeScript
└── index.css         # Estilos globais e tokens
```

---

## Variáveis de ambiente

Crie `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

Em produção (com proxy Nginx), use:

```env
REACT_APP_API_URL=/api
```

---

## Acessibilidade

O frontend segue WCAG 2.1 e inclui:

- Skip Link e barra de acessibilidade (tamanho de texto, alto contraste)
- Títulos dinâmicos por página
- Formulários com labels e ARIA
- Navegação por teclado

Consulte [ACESSIBILIDADE.md](../../Documentacao/ACESSIBILIDADE.md) para detalhes.

---

## Marca

- **Fonte:** Montserrat (`tokens.css`: `--font-sans`)
- **Cores:** Teal `#02869b`, Dourado `#f4b002`

---

*[Voltar ao índice da documentação](../../Documentacao/README.md)*
