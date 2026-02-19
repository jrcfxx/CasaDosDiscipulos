# Backend - Casa dos Discípulos
FROM node:20-alpine

WORKDIR /app

# Copia apenas arquivos de dependência
COPY package*.json ./
RUN npm ci --only=production

# Copia código
COPY . .

# Cria diretório para uploads
RUN mkdir -p uploads/perfil

EXPOSE 3001

# Migrations rodam no entrypoint antes de iniciar
CMD ["sh", "-c", "npx knex migrate:latest --knexfile knexfile.cjs || true && node src/app.js"]
