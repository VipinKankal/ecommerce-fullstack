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

## Windows Notes

- In PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.
- If Maven wrapper complains about `JAVA_HOME`, set it once in the session:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

## Notes

- Use the repository root as the main working directory for Git operations.
- Frontend and backend each keep their own local config files inside their respective folders.
- API and flow documentation already exists under `frontend/docs/` and `backend/docs/`.

## Coupon Workstream Status (2026-03-23)

Latest consolidated commit: `094e99f` (`main`)

| ID | Workstream | Status |
| --- | --- | --- |
| 10 | Advanced user eligibility | Completed |
| 16 | Best coupon suggestion / non-applicable messaging | Completed |
| 18 | Idempotency / concurrency / reservation | Completed |
| 20 | Payment failure + retry flow | Completed |
| 21 | Cancel / return / refund policy | Completed |
| 22 | Fraud control | Completed |
| 23 | Cache layer (coupon fast-path + monitoring) | Completed |
| 24 | Rule-based recommendation engine | Completed |
| 25 | A/B testing | Completed |
| 26 | Funnel analytics tracking | Completed |
| 27 | Metrics dashboard (single coupon tab) | Completed |
| 31 | Coupon unit tests | Completed |
| 32 | Coupon integration tests | Completed |
| 33 | Edge-case tests | Completed |
| 34 | Monitoring / alerts | Completed |

Pending for the above list: `0`
