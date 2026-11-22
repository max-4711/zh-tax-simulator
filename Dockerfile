FROM --platform=$BUILDPLATFORM node:24-bookworm-slim AS build
ARG BUILDPLATFORM
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html/zh-tax-simulator
EXPOSE 80
