# Evolution API — Casa dos Discípulos

Stack Docker para rodar a Evolution API (WhatsApp) localmente.

**Inclui:** Evolution API + PostgreSQL + Redis + Evolution Manager (interface web).

## Uso

```powershell
docker compose up -d
```

- **API:** `http://localhost:8080`
- **Manager (interface com QR Code):** `http://localhost:3090`

## Conectar o WhatsApp

1. Acesse **http://localhost:3090** (Evolution Manager)
2. Faça login com a apikey: `casadosdiscipulos-local`
3. Clique na instância `casadosdiscipulos` e em **Conectar**
4. Escaneie o QR Code com o WhatsApp no celular

**Documentação completa:** [Documentacao/CONFIGURAR_WHATSAPP_LOCAL.md](../Documentacao/CONFIGURAR_WHATSAPP_LOCAL.md)
