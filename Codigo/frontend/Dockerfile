# Frontend - Casa dos Discípulos
# Estágio 1: Build do React
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL da API em produção (será sobrescrita no build)
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Estágio 2: Nginx servindo os arquivos estáticos
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# Config padrão - será sobrescrita pelo docker-compose em produção
RUN echo 'server{listen 80;root /usr/share/nginx/html;index index.html;location /{try_files $uri $uri/ /index.html;}}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
