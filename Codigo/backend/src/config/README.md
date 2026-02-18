# 📁 Config

Arquivos de configuração do projeto.

## Estrutura

### Variáveis de Ambiente (.env)

O projeto utiliza variáveis de ambiente para configurações sensíveis:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=casa_dos_discipulos

# Autenticação
JWT_SECRET=seu_secret_jwt_seguro
JWT_EXPIRES_IN=7d
```

## Como Usar

1. Copie `.env.example` para `.env`
2. Preencha as variáveis com seus valores
3. Nunca commit o arquivo `.env` (já está no .gitignore)

## Configurações Principais

- **PORT**: Porta do servidor Express (padrão: 3001)
- **DB\_\***: Credenciais do MySQL
- **JWT_SECRET**: Chave secreta para geração de tokens
- **NODE_ENV**: Ambiente (development/production)
