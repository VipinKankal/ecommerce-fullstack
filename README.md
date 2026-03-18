# Ecommerce Fullstack

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
npm install
npm start
```

The frontend development server runs at `http://localhost:3000`.

### Run the Backend

```powershell
cd backend
.\mvnw spring-boot:run
```

The backend application runs at `http://localhost:8080`.

## Useful Commands

### Frontend

```powershell
cd frontend
npm start
npm run build
npx tsc --noEmit
```

### Backend

```powershell
cd backend
.\mvnw test
.\mvnw -DskipTests compile
```

## Notes

- Use the repository root as the main working directory for Git operations.
- Frontend and backend each keep their own local config files inside their respective folders.
- API and flow documentation already exists under `frontend/docs/` and `backend/docs/`.
