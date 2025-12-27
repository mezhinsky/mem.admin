# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ВАЖНО: Vite читает VITE_* только на этапе build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


FROM nginx:1.27-alpine AS runner

# SPA fallback, иначе будут 404 на /articles и т.п.
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]