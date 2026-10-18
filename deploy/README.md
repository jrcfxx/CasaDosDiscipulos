<div align="center">

<img src="../Documentacao/assets/wave-banner.svg" width="100%" alt="" />

<img src="../Documentacao/assets/logo-glow.svg" width="120" alt="Casa dos Discípulos" />

<img src="../Documentacao/assets/logo_mark.png" width="72" alt="Logo" />

# Deploy

<img src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=600&size=24&duration=3000&pause=900&color=F4B002&center=true&vCenter=true&width=560&height=42&lines=Docker+%C2%B7+Nginx+%C2%B7+MySQL;Evolution+%C2%B7+HTTPS" alt="" />

<img src="../Documentacao/assets/divider-animated.svg" width="420" alt="" />

<img src="../Documentacao/assets/docs-hero-banner.jpg" width="85%" alt="Banner" />

<br />

[Hospedagem](../Documentacao/HOSPEDAGEM.md)
&nbsp;✦&nbsp;
[Custos](../Documentacao/RELATORIO_CUSTOS_E_DEPLOY.md)
&nbsp;✦&nbsp;
[Segurança](../Documentacao/SEGURANCA.md)

</div>

---

## Uso

```bash
cp .env.example .env
chmod +x deploy.sh
./deploy.sh
# HTTPS:
./deploy.sh --enable-ssl
```

Smoke: `GET /api/health`

<p align="center">
  <img src="../Documentacao/assets/docs-emblem.jpg" width="140" alt="" />
</p>

---

## Serviços

| Container | Função |
|-----------|--------|
| web | Nginx + React |
| backend | API |
| mysql | Banco (interno) |
| evolution | WhatsApp (`127.0.0.1:8080`) |

---

<div align="center">

<img src="../Documentacao/assets/logo-glow.svg" width="64" alt="" />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:02869b,100:f4b002&height=120&section=footer" width="100%" alt="" />

</div>
