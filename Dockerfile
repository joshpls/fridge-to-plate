# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-build
WORKDIR /app/client

# Copy package files first for better caching
COPY client/package*.json ./
RUN npm install

# Copy source and build (Vite defaults to /dist)
COPY client/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the Node/TS Backend
# ==========================================
FROM node:20-alpine AS backend-build
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

# If you use Prisma (as seen in your controllers), generate the client
# If you don't use Prisma, you can safely remove these two lines
COPY server/prisma ./prisma/
RUN npx prisma generate

# Copy source and compile TypeScript
COPY server/ ./
RUN npm run build

# ==========================================
# STAGE 3: Final Production Image
# ==========================================
FROM node:20-alpine
WORKDIR /app

# 1. Copy the compiled backend and frontend as before
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/server/package*.json ./
COPY --from=backend-build /app/server/node_modules ./node_modules
COPY --from=frontend-build /app/client/dist ./public

# 2. Create the uploads folder and set permissions
# This ensures the Node process can actually write files here
RUN mkdir -p public/uploads && chown -R node:node /app

# 3. Environment setup
USER node
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/index.js"]
