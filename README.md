hihihihihihihihihihi
Ecommerce Fullstack

Full-stack ecommerce application with the frontend and backend managed in a single monorepo.

## Repository Structure

- `frontend/` - React + TypeScript customer, seller, admin, and courier interfaces
- `backend/` - Spring Boot backend with JPA, security, payments, and API documentation

## Tech Stack

- Frontend: React, TypeScript, Redux Toolkit, Material UI, Tailwind CSS
- Backend: Spring Boot, Spring Security, Spring Data JPA, Flyway, MySQL
- Tooling: npm, Maven Wrapper

## Prerequisites

- Node.js and npm
- Java 21
- A configured MySQL database for the backend

## Getting Started

Open your terminal at the repository root:

```powershell
cd D:\ecommerce-fullstack
```

### Run the Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd start
```

The frontend development server runs at `http://localhost:3000`.

### Run the Backend

```powershell
cd backend
cmd /c mvnw.cmd spring-boot:run
```

The backend application runs at `http://localhost:8080`.

## Quick Setup Verification

Run full setup health-check (frontend + backend):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-setup.ps1
```

Optional:

```powershell
# only frontend checks
powershell -ExecutionPolicy Bypass -File .\scripts\verify-setup.ps1 -SkipBackend

# only backend checks
powershell -ExecutionPolicy Bypass -File .\scripts\verify-setup.ps1 -SkipFrontend
```

## Useful Commands

### Frontend

```powershell
cd frontend
npm.cmd start
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test:ci
```

### Backend

```powershell
cd backend
cmd /c mvnw.cmd test
cmd /c mvnw.cmd -DskipTests compile
```





