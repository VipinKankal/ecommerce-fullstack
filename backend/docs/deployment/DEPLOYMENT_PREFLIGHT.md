# Deployment Preflight Checklist

Use this checklist before every production release.

## 1. Build and test

1. `./mvnw.cmd -DskipTests compile` succeeds.
2. `./mvnw.cmd test` succeeds.
3. No failing migrations or startup errors in logs.

## 2. Secrets and config

1. Real values are loaded from environment or secret manager.
2. `JWT_SECRET_KEY` is strong (64+ random chars).
3. `DB_PASSWORD`, `MAIL_PASSWORD`, payment keys are not in git.
4. `JPA_SHOW_SQL=false` in production.
5. `CORS_ALLOWED_ORIGINS` only contains trusted frontend domains.

## 3. Database safety

1. MySQL user has least privileges (no global admin if not required).
2. Automated DB backups enabled.
3. Restore drill validated on staging.

## 4. Security controls

1. App runs behind HTTPS (TLS cert valid).
2. Only required ports are open.
3. Admin endpoints require admin token and are tested.
4. Rate-limited auth endpoints return `429` under abuse.
5. Invalid JWT requests return `401`.

## 5. External integrations

1. SMTP auth works for OTP emails.
2. Razorpay/Stripe keys are correct and verified in live/sandbox mode as intended.

## 6. Runtime health

1. `/` health welcome endpoint responds.
2. Startup logs show DB connected and no fatal exceptions.
3. Error logs are centralized (ELK/Cloud logs/etc.).
4. Alerting configured for 5xx spikes and downtime.

## 7. Post-deploy smoke tests

Run these from Postman master collection:

1. Auth OTP send/signin
2. Customer profile
3. Seller profile
4. Seller products list/create
5. Order create + payment callback

## 8. Rollback readiness

1. Previous stable artifact is available.
2. DB rollback strategy is documented.
3. Team knows rollback trigger conditions.
