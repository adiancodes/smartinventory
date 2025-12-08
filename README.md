# SmartShelfX Inventory Platform

SmartShelfX is a full-stack inventory and order operations suite for multi-warehouse retailers. It couples a Spring Boot API with a React + Vite UI to deliver role-aware dashboards, analytics, restock workflows, and end-customer purchasing with a cohesive glassmorphism design and dark-mode support.

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Full Stack](#running-the-full-stack)
- [Default Data & Accounts](#default-data--accounts)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Notable API Endpoints](#notable-api-endpoints)
- [Troubleshooting](#troubleshooting)

## Key Features

- **Role-based authentication** powered by JWT with dedicated dashboards for Admin, Warehouse Manager, and Customer roles.
- **Warehouse analytics cockpit** with live charts (Recharts) and export tooling for PDF (Apache PDFBox) and Excel (Apache POI).
- **Inventory management** including product catalogue, stock health indicators, restock recommendations, and purchase order capture for managers.
- **Customer storefront** offering product browsing, intelligent filters, address management, purchase history, and one-click reorders.
- **Unified theming** that applies a glassmorphism aesthetic across all screens with instant light/dark toggling.
- **Responsive layout** tuned for full-width presentation on desktop while remaining usable on tablets.

## Technology Stack

| Layer | Tech |
| ----- | ---- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, React Query, React Hook Form, Zod, Recharts |
| Backend | Java 22 (compatible with Java 17+), Spring Boot 3.3, Spring Security, Spring Data JPA, PostgreSQL, HikariCP, Apache PDFBox, Apache POI |
| Tooling | Maven Wrapper, npm, Vitest, Testing Library, JWT, PostgreSQL client of choice |

## Repository Layout

```
smartinventory/
├── backend/                 # Spring Boot API
│   ├── src/main/java/com/smartshelfx/inventoryservice
│   │   ├── analytics/       # Analytics dashboard, export services
│   │   ├── auth/            # Auth controllers, DTOs, services
│   │   ├── product/         # Catalogue entities and endpoints
│   │   ├── purchase/        # Purchase flows and summaries
│   │   ├── restock/         # Restock orders & recommendations
│   │   ├── security/        # JWT, filters, config
│   │   └── ...              # Address, warehouse, common modules
│   └── src/main/resources
│       └── application.yml  # Environment-driven configuration
├── frontend/                # React + Vite client
│   ├── src/
│   │   ├── api/             # Axios clients for backend endpoints
│   │   ├── components/      # Shared UI (TopNavbar, theme, forms)
│   │   ├── context/         # Auth & theme providers
│   │   ├── pages/           # Role dashboards & auth flows
│   │   └── routes/          # Protected route guards
│   └── tailwind.config.js   # Tailwind theme setup
└── README.md
```

## Prerequisites

- Java 17 or later (project currently built with Java 22)
- Maven 3.9+ (Maven Wrapper provided)
- Node.js 18+
- npm 9+
- PostgreSQL 14+ running locally on `localhost:5432`

## Backend Setup

1. **Create `backend/.env`** (if it does not already exist) and populate:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
   - `JWT_SECRET`, `JWT_EXPIRATION_MINUTES`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`
   ```dotenv
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=smartshelfx
   DB_USERNAME=postgres
   DB_PASSWORD=ChangeMe123!

   JWT_SECRET=replace-with-long-random-string
   JWT_EXPIRATION_MINUTES=60

   SEED_ADMIN_EMAIL=admin@example.com
   SEED_ADMIN_PASSWORD=ChangeMe123!
   SEED_ADMIN_NAME=System Admin
   ```

2. **Verify PostgreSQL access**
   - Create the database defined by `DB_NAME` (`CREATE DATABASE smartshelfx;`).
   - Ensure the user has privileges to create tables.

3. **Run the API**
   ```powershell
   cd backend
   ./mvnw spring-boot:run
   ```
   The service listens on `http://localhost:8080/api`.

4. **Smoke test**
   - POST `/api/auth/login` with seeded credentials to obtain a JWT.
   - GET `/api/analytics/dashboard` with the token to confirm role access.

## Frontend Setup

1. **Install dependencies**
   ```powershell
   cd frontend
   npm install
   ```

2. **Start the dev server**
   ```powershell
   npm run dev
   ```
   Vite serves the UI on `http://localhost:5173` and proxies `/api` requests to the backend.

3. **Production build** (optional)
   ```powershell
   npm run build
   npm run preview
   ```

## Running the Full Stack

1. Start PostgreSQL.
2. Launch the backend with `./mvnw spring-boot:run`.
3. In a new terminal, run `npm run dev` from `frontend/`.
4. Visit `http://localhost:5173` and log in with the seeded accounts.

## Default Data & Accounts

- The backend seeds warehouses and the first admin from the `.env` values (`seed.*` properties in `application.yml`).
- Example admin credentials (change in production):
  - Email: `admin@gmail.com`
  - Password: `123456789`
- Managers and customer accounts can be created via the registration flow or seeded scripts as required.

## Testing

- **Backend**
  ```powershell
  cd backend
  ./mvnw clean test
  ```
- **Frontend** (Vitest + Testing Library scaffold)
  ```powershell
  cd frontend
  npm run test
  ```

## Build & Deployment

- Backend runnable jar:
  ```powershell
  cd backend
  ./mvnw clean package
  java -jar target/inventory-service-0.0.1-SNAPSHOT.jar
  ```
- Frontend static build lives under `frontend/dist/` after `npm run build`.
- Serve the frontend via any static host (Nginx, S3) and configure it to forward `/api` to the Spring service.

## Notable API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/register` | Register new users (role defaults to CUSTOMER unless elevated by admin) |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/analytics/dashboard` | Analytics snapshot (Admin/Manager) |
| GET | `/api/analytics/export/pdf` | Generate PDF analytics report for the selected scope |
| GET | `/api/analytics/export/excel` | Generate Excel analytics workbook |
| GET | `/api/products` | Product catalogue with filters |
| POST | `/api/purchases` | Create customer purchase orders |
| GET | `/api/restock/recommendations` | Manager/Admin restock recommendations |
| POST | `/api/restock/orders` | Raise restock purchase orders |

All protected routes require the `Authorization: Bearer <token>` header.

## Troubleshooting

- **Cannot connect to PostgreSQL** – confirm `.env` credentials and that the database exists. The service exits if HikariCP cannot obtain a connection.
- **JWT rejected** – tokens expire after `JWT_EXPIRATION_MINUTES`. Log in again to refresh.
- **PDF export fails or downloads empty file** – ensure the backend is running the latest build (rupee symbol is normalised to ASCII for PDF generation) and that the browser allows downloads.
- **Frontend API errors** – verify Vite proxy is forwarding to `http://localhost:8080/api`. Update `vite.config.ts` if you run the backend on another host or port.

---

For feature demos and UI captures, refer to the React pages under `frontend/src/pages/dashboard`. Contributions and bug reports are welcome via issues or pull requests.
