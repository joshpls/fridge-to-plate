# 🍳 Recipe Discovery & Pantry Manager

### A full-stack, self-hosted platform designed for seamless recipe exploration and intelligent pantry tracking. This application bridges the gap between "What should I cook?" and "What do I actually have in my kitchen?"
## 🚀 Overview

Dicovery/Pantry/Recipe            |  Preferences/Household/Admin
:-------------------------:|:-------------------------:
![](fridge2plate_example_1.png)  |  ![](fridge2plate_example_2.png)

### This project is a TypeScript-driven ecosystem consisting of a high-performance React frontend and a robust Node.js/Express backend. It features a unique "Pantry Matching" engine that analyzes recipe requirements against a user's real-time inventory.
## Core Features

- **Intelligent Discovery:** Infinite-scrolling recipe feed with advanced filtering by category, tags, and ingredient inclusion/exclusion.

- **Pantry Integration:** Automated "Missing Ingredient" calculation and one-click "Add to Shopping List" functionality.

- **Social & Personalization:** User profiles with customizable aliases, recipe favoriting, and a nested comment/rating system.

- **Admin Power-User Suite:** Dedicated dashboard for managing global taxonomies (categories/ingredients) and user roles.

- **Secure Self-Hosting:** Optimized for deployment on low-power hardware (Raspberry Pi) via Docker.

# 🛠 Tech Stack
## Frontend

- React 18 + Vite: Modern, lightning-fast frontend tooling.

- Tailwind CSS: Utility-first styling for a custom, responsive "Bento-box" UI.

- TypeScript: Type-safe development across all components and hooks.

- Intersection Observer API: Powering the seamless infinite scroll in the Discovery view.

## Backend

- **Node.js & Express:** Scalable REST API architecture.

- **Prisma ORM:** Type-safe database access and automated migrations.

- **PostgreSQL:** Relational data storage for complex recipe-ingredient relationships.

- **JWT (JSON Web Tokens):** Secure, stateless authentication.

## DevOps & Security

- **Docker:** Containerized environment for consistent deployment.

- **Nginx Proxy Manager:** Reverse proxy handling SSL/TLS termination and DDNS.

- **Hardware:** Optimized to run on a Raspberry Pi Zero 2 W.

- **Security Suite:** * bcrypt for salted password hashing.

    - express-rate-limit to prevent brute-force attacks on auth endpoints.

    - Input validation and sanitized DTO (Data Transfer Object) mapping.

# 🏗 Architecture

## The project follows a Controller-Service-Repository pattern to ensure a clean separation of concerns:

1. **Routes:** Define endpoints and apply middleware (e.g., requireAuth).

2. **Controllers:** Handle HTTP requests/responses and extract parameters.

3. **Services:** Contain the "business logic" (e.g., the matching algorithm for pantry items).

4. **Prisma/DB:** Interacts directly with the PostgreSQL instance.

# 🔒 Security Implementations

## Applied the following:

- **Rate Limiting:** Global limits for general API usage and strict "5 attempts per 15 mins" for authentication to neutralize brute-force bots.

- **Data Masking:** A dedicated mapRecipeToDto layer ensures sensitive user data (like internal IDs or hashed passwords) is never leaked to the frontend.

- **Role-Based Access Control (RBAC):** Middleware-level checks to distinguish between USER and ADMIN privileges.

# 🛠 Setup & Installation
## Prerequisites

- Node.js (v18+)

- Docker & Docker Compose

- PostgreSQL Instance

## Environment Variables

Create a .env file in the root directory:
```Code snippet
DATABASE_URL="postgresql://user:password@localhost:5432/recipe_db"
JWT_SECRET="your_ultra_secure_secret"
PORT=5000
```
## Quick Start

- Install dependencies: npm install

- Run Migrations: npx prisma migrate dev

- Start Dev Server: npm run dev
