<div align="center">

<img src="src/assets/logo_mark.png" alt="Casa dos Discípulos" width="64" />

# Frontend

**React · TypeScript · marca da Casa**

[Documentação](../../Documentacao/README.md)
&nbsp;·&nbsp;
[Começando](../../Documentacao/COMEÇANDO.md)
&nbsp;·&nbsp;
[Acessibilidade](../../Documentacao/ACESSIBILIDADE.md)

</div>

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| React 18 | UI |
| TypeScript | Tipagem |
| React Router 6 | HashRouter |
| Axios (`apiClient`) | API + JWT |
| CSS + tokens | Teal `#02869b` · Dourado `#f4b002` · Montserrat |

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Dev em `http://localhost:3000` |
| `npm run build` | Build em `build/` |
| `npm test` | Testes CRA |
| `npm run test:e2e` | Crawl E2E (Playwright) |

---

## Estrutura

```
src/
├── components/   # layout · ui · fields · accessibility
├── pages/
├── services/     # apiClient e domínios
├── contexts/     # Auth · Accessibility
├── hooks/
├── style/        # tokens.css e páginas
└── utils/
```

---

## Ambiente

```env
REACT_APP_API_URL=http://localhost:3001/api
```

Produção (Nginx no mesmo domínio):

```env
REACT_APP_API_URL=/api
```

---

## Marca

| Token | Valor |
|-------|-------|
| Primária | `#02869b` |
| Destaque | `#f4b002` |
| Fonte | Montserrat |

---

<div align="center">

[Documentação](../../Documentacao/README.md)

<br />

<sub>Casa dos Discípulos · Frontend · 2026</sub>

</div>
