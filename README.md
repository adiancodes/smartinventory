# SmartShelfX Inventory Platform

Fullstack implementation powered by Spring Boot, PostgreSQL, and React. Module 1 delivers role-aware authentication with the UI screens provided, including admin and warehouse manager dashboards.

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- npm or yarn
- PostgreSQL (running locally, accessible via pgAdmin)

## Backend Setup (`backend/`)

1. Copy `.env.example` to `.env` and customise credentials.
2. Update `application.yml` if you use a non-default Postgres host/port.
3. Run database migrations (JPA auto creates tables on first run).
4. Start the API:
   ```powershell
   mvn spring-boot:run
   ```
5. Verify health check: `GET http://localhost:8080/api/health`.

### Seeded Accounts

- Admin user is created from `.env` values on first boot.
- Default warehouses seeded: BLR, MUM.

## Frontend Setup (`frontend/`)

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Start dev server:
   ```powershell
   npm run dev
   ```
3. App runs on `http://localhost:5173` with proxy to backend `/api`.

## Module 1 Deliverables

- JWT authentication with Spring Security.
- Registration & login screens styled per reference.
- Admin dashboard listing warehouse managers.
- Warehouse manager dashboard stub with role-locked navigation.
- React auth context with persistent session handling.

## Testing

- Backend: `mvn test`.
- Frontend: `npm run test` (Vitest setup pending additional specs).

---
Next module will add inventory catalogue CRUD tied to warehouses.
