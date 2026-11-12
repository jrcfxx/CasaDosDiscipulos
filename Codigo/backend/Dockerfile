# Backend - Casa dos Discípulos
FROM node:20-alpine

# Todos os horários do sistema são de Brasília (ver src/utils/dateUtils.js)
RUN apk add --no-cache tzdata
ENV TZ=America/Sao_Paulo

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads/perfil uploads/celulas uploads/fala-ai uploads/campos \
  && chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
