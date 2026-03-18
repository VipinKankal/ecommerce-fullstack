# Ecommerce
[![Backend CI](https://github.com/VipinKankal/Ecommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/VipinKankal/Ecommerce/actions/workflows/ci.yml)

## API Testing (Postman Master Collection)

Postman assets are versioned in repo (master collection is generated from controller mappings):

- `docs/postman/Ecommerce-Full-Collection.postman_collection.json`
- `docs/postman/Ecommerce-Local.postman_environment.json`
- `docs/postman/Ecommerce-CI-Smoke.postman_collection.json`

### Import order

1. Import environment file
2. Import collection file
3. Select `Ecommerce Local` environment
4. Fill runtime variables: `otp`, `customerJwt`, `sellerJwt`, `adminJwt`, `productId`, `orderId`

### Recommended smoke sequence

1. `Auth -> Send OTP - Customer`
2. `Auth -> Signin - Customer`
3. `Seller -> Create Seller`
4. `Auth -> Signin - Seller`
5. `Seller Products -> Get Seller Products`
6. `Orders -> Create Order`

Note: if any endpoint path differs from your controller mappings, update only request URL in collection.

## CI Automation

GitHub Actions workflow added:

- `.github/workflows/ci.yml`

What it runs:

1. Maven compile and tests on every push/PR
2. MySQL service container for integration tests
3. App boot + Newman smoke tests using `docs/postman/Ecommerce-CI-Smoke.postman_collection.json`

## Production Environment Variables

Set these variables in server/runtime secrets (not in source code):

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET_KEY` (minimum 64+ random characters)
- `JWT_EXPIRATION_MS` (for example `86400000`)
- `MAIL_USERNAME`
- `MAIL_PASSWORD` (Gmail app password if Gmail SMTP is used)
- `CORS_ALLOWED_ORIGINS` (comma-separated frontend origins)
- `SWAGGER_ENABLED` (`true` only when docs exposure is intended)
- `FLYWAY_ENABLED` (`true` recommended)

Deployment docs:

- `docs/deployment/prod.env.example`
- `docs/deployment/DEPLOYMENT_PREFLIGHT.md`
- `docs/deployment/sql/01_check_duplicate_emails.sql`
- `docs/deployment/sql/02_cleanup_duplicate_emails.sql`
- `docs/deployment/sql/03_add_unique_indexes.sql`

## Swagger and Flyway

1. Swagger UI: `/swagger-ui.html` (only if `SWAGGER_ENABLED=true`)
2. OpenAPI JSON: `/v3/api-docs` (only if `SWAGGER_ENABLED=true`)
3. Flyway migrations location: `src/main/resources/db/migration`
4. New migrations added:
   - `V2__add_core_indexes.sql`
   - `V3__enforce_unique_emails.sql`
5. `V3` creates unique indexes only when no duplicate emails are present.
6. Duplicate check queries:
   - Seller: `SELECT email, COUNT(*) c FROM seller GROUP BY email HAVING c > 1;`
   - User: `SELECT email, COUNT(*) c FROM user GROUP BY email HAVING c > 1;`

## Mandatory Before Production

1. Run with `SPRING_PROFILES_ACTIVE=prod`.
2. Set valid secrets:
   - `JWT_SECRET_KEY` (64+ chars, non-default)
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD`
3. Run duplicate-email SQL runbook:
   - `docs/deployment/sql/01_check_duplicate_emails.sql`
   - `docs/deployment/sql/02_cleanup_duplicate_emails.sql` (if duplicates exist)
   - `docs/deployment/sql/03_add_unique_indexes.sql`

## Monitoring Endpoints

Actuator endpoints enabled:

- `GET /actuator/health`
- `GET /actuator/health/liveness`
- `GET /actuator/health/readiness`
- `GET /actuator/info`

## Branch Protection (Recommended)

Apply on `main` branch in GitHub settings:

1. Require pull request before merging
2. Require status checks to pass before merging:
   - `build-test`
   - `postman-smoke`
3. Require branches to be up to date before merging
4. Require conversation resolution before merging
5. Restrict direct pushes to `main`
