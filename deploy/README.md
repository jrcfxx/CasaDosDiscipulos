<div align="center">

<img src="../Documentacao/assets/logo_mark.png" alt="Casa dos Discípulos" width="48" />

# Deploy

Docker · Nginx · MySQL · Evolution

<img src="../Documentacao/assets/header-line.svg" alt="" width="200" />

<br />

[`Hospedagem`](../Documentacao/HOSPEDAGEM.md)
&nbsp;&nbsp;·&nbsp;&nbsp;
[`Custos`](../Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md)

</div>

---

## Uso

```bash
cp .env.example .env
chmod +x deploy.sh
./deploy.sh
./deploy.sh --enable-ssl   # após certificados em nginx/ssl/
```

Smoke: `GET /api/health`

---

## Serviços

| Container | Função |
|-----------|--------|
| web | Nginx + React |
| backend | API |
| mysql | Banco (rede interna) |
| evolution | WhatsApp (`127.0.0.1:8080`) |

---

<div align="center">

[`Documentação`](../Documentacao/README.md)

</div>
