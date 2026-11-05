# Stage 1: Build k6
FROM golang:1.25-alpine3.21@sha256:b4dbd292a0852331c89dfd64e84d16811f3e3aae4c73c13d026c4d200715aff6 AS k6-builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

ARG XK6_VERSION=v1.2.3
ARG K6_VERSION=v1.4.2
ARG INFLUXDB_EXTENSION_VERSION=v0.7.0

RUN go install go.k6.io/xk6/cmd/xk6@${XK6_VERSION}

RUN xk6 build \
    --k6-version ${K6_VERSION} \
    --with github.com/grafana/xk6-output-influxdb@${INFLUXDB_EXTENSION_VERSION} \
    --output /tmp/k6


# Stage 2: Build TypeScript uploader
FROM node:22-alpine AS uploader-builder

WORKDIR /app

COPY k6-summary-uploader/package*.json ./

RUN npm ci

COPY k6-summary-uploader/tsconfig.json ./
COPY k6-summary-uploader/src ./src

RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Stage 3: Runtime
FROM node:22-alpine

RUN apk add --no-cache ca-certificates \
    && addgroup -g 12345 k6 \
    && adduser -D -u 12345 -G k6 k6

COPY --from=k6-builder /tmp/k6 /usr/local/bin/k6

WORKDIR /uploader

COPY --from=uploader-builder --chown=12345:12345 /app/dist ./dist
COPY --from=uploader-builder --chown=12345:12345 /app/node_modules ./node_modules
COPY --from=uploader-builder --chown=12345:12345 /app/package.json ./package.json

USER 12345

WORKDIR /home/k6

ENTRYPOINT []