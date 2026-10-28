# Etapa 1: compilar el front de React
FROM node:24-alpine AS build
WORKDIR /app
COPY front-eventos/package*.json ./
RUN npm ci
COPY front-eventos/ ./
# Ruta relativa: el front le pega a /api del mismo nginx, que la balancea
ENV VITE_API_URL=/api
RUN npm run build

# Etapa 2: nginx con el front compilado y el balanceo
FROM nginx:alpine
# La imagen reemplaza las ${VARIABLES} del template al arrancar (IP_PC1, IP_PC2, IP_PC3)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
