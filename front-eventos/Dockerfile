# Etapa 1: compilar el front de React (Vite deja los archivos en dist/)
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Ruta relativa: el front le pega a /api del mismo nginx que lo sirve, y nginx la balancea
ENV VITE_API_URL=/api
RUN npm run build

# Etapa 2: solo los archivos compilados, servidos con "serve" (sin node_modules ni el código fuente)
FROM node:24-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 8080
# -s: cualquier ruta del front (/login, /panel/eventos…) carga index.html, para React Router
CMD ["serve", "-s", "dist", "-l", "8080"]
