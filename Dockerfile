# Stage 1: Build Angular application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (use npm install if package-lock is not updated, or npm ci)
RUN npm install

# Copy application source
COPY . .

# Build application
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist/PPFrontend/browser /usr/share/nginx/html

# Copy Nginx configuration to support Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
