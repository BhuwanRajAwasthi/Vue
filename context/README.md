# NepKart - Codebase Context Documentation

Welcome to the context documentation for **NepKart**, a modern full-stack e-commerce web application built with Vue 3, Vite, Pinia, Node.js, Express, and MongoDB.

This directory (`/context`) contains comprehensive architecture guides, structural specifications, API references, database schemas, frontend state flow documentation, and setup instructions for developers and AI agents working on this codebase.

---

## 📑 Context Documents Directory

| Document | Description |
| :--- | :--- |
| **[`architecture.md`](./architecture.md)** | High-level system architecture, client-server topology, data flow diagrams, OAuth flows (Google & GitHub), eSewa payment integration, Cloudinary asset pipeline, and RBAC security model. |
| **[`project-structure.md`](./project-structure.md)** | Exhaustive file and directory tree breakdown covering every module across both `Backend/` and `Frontend/`, their exports, imports, and responsibilities. |
| **[`api-specification.md`](./api-specification.md)** | Full REST API documentation for all endpoints (`/api/auth`, `/api/products`, `/api/orders`, `/api/payments`), payload schemas, query parameters, headers, and responses. |
| **[`database-schema.md`](./database-schema.md)** | Detailed Mongoose schema definitions, field types, validations, lifecycle hooks, default values, references, indexes, and the database seeding system. |
| **[`frontend-architecture.md`](./frontend-architecture.md)** | Detailed breakdown of Vue 3 Composition API structure, Pinia stores (`authStore`, `productStore`), Vue Router configuration, view components, Tailwind CSS styling, and client-side persistence. |
| **[`setup-and-environment.md`](./setup-and-environment.md)** | Step-by-step developer onboarding guide, environment variable reference, MongoDB setup, database seeding, running dev servers, and deployment notes. |

---

## 🚀 Quick High-Level Overview

```
+-------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                 |
|                                                                               |
|  Vue 3 (Composition API) + Vite + Pinia + Vue Router + Tailwind CSS 4         |
|  - Storefront (Catalog, Product Details, Search & Filters, Cart)              |
|  - Auth (Local JWT, Continue with Google, Continue with GitHub)               |
|  - Admin Dashboard (Product Catalog CRUD, Cloudinary Uploads, Order Status)   |
|  - Checkout & Payments (Cash on Delivery, eSewa ePay v2 Gateway)              |
+---------------------------------------+---------------------------------------+
                                        | HTTP REST (JSON / Multipart)
                                        v
+-------------------------------------------------------------------------------+
|                             EXPRESS.JS BACKEND                                |
|                                                                               |
|  Port: 4000 | Node.js (ESM / CommonJS)                                        |
|  - Middleware: CORS, JSON parser, JWT Auth, RBAC Admin Guard                   |
|  - Services: Google OAuth 2.0, GitHub OAuth, Nodemailer SMTP, Cloudinary SDK   |
+---------------------------------------+---------------------------------------+
                                        | Mongoose ODM
                                        v
+-------------------------------------------------------------------------------+
|                             MONGODB DATABASE                                  |
|                                                                               |
|  Collections: `users`, `products`, `orders`                                   |
+-------------------------------------------------------------------------------+
```

### Core Tech Stack

#### Frontend
- **Framework**: Vue 3 (`3.5.31`) with `<script setup lang="ts">` (Composition API)
- **Language**: TypeScript (`~6.0.0`) with `vue-tsc`
- **Build Tool**: Vite (`8.0.3`) with `@vitejs/plugin-vue` and `unplugin-icons`
- **State Management**: Pinia (`3.0.4`)
- **Routing**: Vue Router (`4.2.2`) with HTML5 History mode
- **UI & Styling**: Tailwind CSS (`4.2.4`), PrimeVue (`4.5.5`) with Aura theme, PrimeIcons (`7.0.0`)

#### Backend
- **Runtime**: Node.js (`^20.19.0 || >=22.12.0`)
- **Server Framework**: Express.js (`4.18.2`)
- **Database / ODM**: MongoDB (`mongodb://127.0.0.1:27017/ecommerce_db`) via Mongoose (`7.0.0`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken` `9.0.0`), `bcryptjs` password hashing, native OAuth 2.0 (Google, GitHub)
- **File Uploads**: Multer (`1.4.5-lts.2`) paired with Cloudinary v2 SDK (`2.11.0`)
- **Notifications**: Nodemailer (`9.1.1`) for transactional order receipt emails
- **Payments**: eSewa Payment Gateway (ePay v2) HMAC-SHA256 digital signature integration

