# === Stage 1: Build ===
FROM alpine:latest AS builder

WORKDIR /app
COPY package*.json ./
# RUN npm ci

COPY . .
# RUN npm run build

# === Stage 2: Serve with nginx ===
FROM nginx:latest

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
