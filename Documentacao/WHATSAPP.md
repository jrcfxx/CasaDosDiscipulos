# Integração WhatsApp - Casa dos Discípulos

O sistema envia notificações automáticas por WhatsApp aos usuários. Para isso, é utilizada a **Evolution API**, uma API open-source que conecta ao WhatsApp via WhatsApp Web (Baileys).

---

## O que é notificado

1. **Escalação**: Quando o usuário é escalado para um evento, recebe mensagem no WhatsApp com título do evento, área e data.
2. **Módulos pendentes**: Toda **segunda-feira às 9h** (configurável), usuários com módulos da Escola de Discípulos pendentes recebem lembrete no WhatsApp.

---

## Pré-requisitos

- **Evolution API** rodando (Docker ou self-hosted)
- Usuários com **telefone** cadastrado (Perfil ou cadastro por Admin)
- Formato do telefone: `(11) 99999-9999` ou `11999999999` (Brasil)

---

## Configuração da Evolution API

### 1. Subir a Evolution API (Docker)

```bash
docker run -d \
  --name evolution_api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=change-me \
  atendai/evolution-api:latest
```

### 2. Criar instância e conectar WhatsApp

1. Acesse `http://localhost:8080` (ou a URL da Evolution)
2. Crie uma nova instância (ex: `casadosdiscipulos`)
3. Escaneie o QR Code com o WhatsApp que será usado para enviar as mensagens

### 3. Variáveis de ambiente (.env do backend)

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=casadosdiscipulos
EVOLUTION_API_KEY=change-me
```

- **EVOLUTION_API_URL**: URL base da Evolution API
- **EVOLUTION_INSTANCE_NAME**: Nome da instância criada no passo 2
- **EVOLUTION_API_KEY**: Chave de autenticação da Evolution (se configurada)

---

## Fluxo de uso

1. **Cadastro do telefone**: O usuário informa o telefone no Perfil ou o admin cadastra em Gerir Usuários.
2. **Escalação**: Ao escalar alguém, a notificação in-app é criada e, se o usuário tiver telefone, também recebe no WhatsApp.
3. **Job semanal**: Todo domingo à noite / segunda de manhã (cron), o sistema busca usuários com módulos pendentes e envia lembrete.

---

## Personalizar horário do job

Variável `WHATSAPP_CRON_MODULOS` (formato cron):

- `0 9 * * 1` = Segunda às 9h
- `0 10 * * 0` = Domingo às 10h
- `0 20 * * 5` = Sexta às 20h

Timezone padrão: `America/Sao_Paulo`.

---

## Desativar WhatsApp

Se `EVOLUTION_API_URL` não estiver definido, todas as chamadas ao WhatsApp são ignoradas. As notificações in-app continuam funcionando normalmente.

---

## Evolution API - Documentação

- [Evolution API](https://github.com/EvolutionAPI/evolution-api)
- [Documentação oficial](https://doc.evolution-api.com)
