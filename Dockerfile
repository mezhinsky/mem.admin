# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite читает VITE_* ТОЛЬКО на этапе build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_PUBLIC_SITE_URL
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL

ARG VITE_FRONTEND_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL

ARG VITE_TG_WEBHOOK_SECRET
ENV VITE_TG_WEBHOOK_SECRET=$VITE_TG_WEBHOOK_SECRET

RUN echo "Building with VITE_API_BASE_URL=$VITE_API_BASE_URL"
RUN npm run build


FROM nginx:1.27-alpine AS runner

# SPA fallback
COPY nginx.default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
