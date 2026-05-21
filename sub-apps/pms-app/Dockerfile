# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src ./src
RUN mkdir -p databases uploads
EXPOSE 3802
CMD ["node", "server.js"]
