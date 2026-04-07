# Project Details

Last updated: 2026-04-04 (Vendor + Trade modules)

## Project Overview
- Name: trades
- Language: Java 17
- Framework: Spring Boot 3.3.5
- Build tool: Maven (`mvnw.cmd`)
- Database (main): PostgreSQL
- Database (tests): H2 in-memory

## Main Features
- JWT authentication and validation
- Role-based access control (RBAC)
- Roles: `ADMIN`, `EXECUTIVE`, `VENDOR`
- User registration with email verification
- Admin user management
- API audit logging using Spring AOP
- Idempotent startup data bootstrap (roles + default admin)
- Standardized API error response with error codes
- UUID primary keys across core tables
- Indexed tables for faster lookup
- Optional bootstrap data reset before default initialization
- Vendor and SubVendor management with pagination/sorting
- Trade management with PDF upload and vendor email notifications
- Link-based trade notification (email contains details URL, not file attachment)
- JWT HttpOnly cookie authentication support
- React + Material UI frontend scaffold (localhost:4000)

## Architecture (Clean Layering)
- Controller layer: HTTP endpoints and request/response mapping
- Service layer: business logic and transactional flows
- Repository layer: JPA data access
- Model layer: entities and enums
- Security layer: JWT, filter, user details, Spring Security config
- Cross-cutting layer: AOP audit logging

## Key Domain Models
- `AppUser`
  - table: `app_user`
  - fields: id (UUID), email, password, enabled, emailVerified, roles
- `Role`
  - table: `roles`
  - fields: id (UUID), name (`RoleName`)
  - relation: many-to-many with `AppUser` via `user_roles`
- `EmailVerificationToken`
  - table: `email_verification_token`
  - fields: id (UUID), token, user, expiresAt, used
- `AuditLog`
  - fields: id (UUID), username, endpoint, httpMethod, actionMessage, timestamp, statusCode
- `RoleName` enum
  - `ADMIN`, `EXECUTIVE`, `VENDOR`
- `Vendor`
  - table: `vendor`
  - fields: id (UUID), name, companyName, mobileNo, email, active, createdAt
  - relation: one-to-many with `SubVendor` (max 3 enforced in service)
- `SubVendor`
  - table: `sub_vendor`
  - fields: id (UUID), name, companyName, contactNo, vendor
- `Trade`
  - table: `trade`
  - fields: id (UUID), tradeId, mode, description, pdfPath, createdAt, createdBy

## Security Design
- Stateless auth (`SessionCreationPolicy.STATELESS`)
- JWT in `Authorization: Bearer <token>`
- JWT also supported via HttpOnly cookie: `TRADES_AUTH`
- Session endpoint for cookie bootstrap: `GET /api/auth/me`
- `JwtFilter` validates token and sets security context
- `CustomUserDetailsService` loads users by email
- Access rules:
  - `/api/auth/**` -> public
  - `/api/admin/**` -> `ROLE_ADMIN`
  - all other endpoints -> authenticated
- Endpoint-level role controls:
  - Vendor create/subvendor: ADMIN, EXECUTIVE
  - Vendor view: ADMIN, EXECUTIVE, VENDOR
  - Vendor update/delete/activate/deactivate: ADMIN
  - Trade create: ADMIN, EXECUTIVE
  - Trade view: ADMIN, EXECUTIVE, VENDOR

## Authentication Flow
1. Register (`/api/auth/register`)
   - creates user with default role `VENDOR`
   - sets `emailVerified=false`
   - generates verification token and stores in DB
   - sends verification email
2. Verify email (`/api/auth/verify-email?token=...`)
   - validates token (exists, unused, not expired)
   - sets user `emailVerified=true` and token `used=true`
3. Login (`/api/auth/login`)
   - authenticates credentials
   - requires user enabled and verified
   - disabled user message: `You are not allowed to login. Please contact the admin.`
   - returns JWT and expiry info

## Error Handling
- Global handler: `GlobalExceptionHandler` (`@RestControllerAdvice`)
- Standard error payload fields:
  - timestamp
  - status
  - error
  - code
  - message
  - path
  - details
- Example auth error codes:
  - `AUTH_USER_DISABLED`
  - `AUTH_EMAIL_NOT_VERIFIED`
  - `AUTH_INVALID_CREDENTIALS`
  - `VALIDATION_FAILED`

## Admin Capabilities
- Create users
- Assign/update roles
- Enable/disable users
- List users (paginated + sortable)

## Startup Initialization
- `DataResetInitializer` runs first when `app.bootstrap.reset-data=true`.
  - truncates: `audit_logs`, `email_verification_token`, `user_roles`, `app_user`, `roles`
- `DataInitializer` runs at startup (`ApplicationRunner`, transactional, idempotent).
- Inserts roles if missing: `ADMIN`, `EXECUTIVE`, `VENDOR`.
- Creates default admin user if missing:
  - email: `admin@pawfectfoods.com`
  - password: BCrypt encoded from bootstrap properties
  - enabled: true
  - emailVerified: true
- Ensures existing admin account has ADMIN role.
- Logs:
  - roles initialized
  - admin user created or already exists

## API Audit Logging
- Implemented with AOP around all controller methods
- Captures and saves:
  - username
  - endpoint
  - HTTP method
  - action message (human-readable performed action)
  - timestamp
  - response status code
- Includes action mapping for vendor creation, sub-vendor creation, and trade creation.

## Vendor Module
- Service: `VendorService`
  - createVendor
  - updateVendor
  - getVendorById
  - getAllVendors(Pageable)
  - addSubVendor (max 3)
  - deleteVendor
  - activateVendor/deactivateVendor
- Controller: `VendorController` (`/api/vendors`)

## Trade Module
- Service: `TradeService`
  - createTrade
  - getAllTrades(Pageable)
  - getTradeById
- Controller: `TradeController` (`/api/trades`)
- File upload handled by `FileStorageService`.
- On trade creation, active vendors are notified by email.
- Notification targeting options on trade create:
  - selected vendors (`SELECTED` + `vendorIds`)
  - all active vendors (`ALL_ACTIVE`)
  - all vendors (`ALL`)
- Trade document endpoints:
  - `GET /api/trades/{id}/view` (inline PDF)
  - `GET /api/trades/{id}/download` (watermarked PDF)

## Important Files
- `src/main/java/com/pawfectfoods/trades/config/SecurityConfig.java`
- `src/main/java/com/pawfectfoods/trades/config/DataInitializer.java`
- `src/main/java/com/pawfectfoods/trades/config/AppBootstrapProperties.java`
- `src/main/java/com/pawfectfoods/trades/config/MailConfig.java`
- `src/main/java/com/pawfectfoods/trades/security/JwtUtil.java`
- `src/main/java/com/pawfectfoods/trades/security/JwtFilter.java`
- `src/main/java/com/pawfectfoods/trades/security/CustomUserDetailsService.java`
- `src/main/java/com/pawfectfoods/trades/controller/AuthenticationController.java`
- `src/main/java/com/pawfectfoods/trades/controller/AdminUserController.java`
- `src/main/java/com/pawfectfoods/trades/service/AuthService.java`
- `src/main/java/com/pawfectfoods/trades/service/AdminUserService.java`
- `src/main/java/com/pawfectfoods/trades/service/EmailService.java`
- `src/main/java/com/pawfectfoods/trades/aspect/AuditLoggingAspect.java`
- `src/main/java/com/pawfectfoods/trades/service/VendorService.java`
- `src/main/java/com/pawfectfoods/trades/controller/VendorController.java`
- `src/main/java/com/pawfectfoods/trades/service/TradeService.java`
- `src/main/java/com/pawfectfoods/trades/controller/TradeController.java`
- `src/main/java/com/pawfectfoods/trades/service/FileStorageService.java`

## Configuration
- Main config: `src/main/resources/application.properties`
  - PostgreSQL datasource (`pawfectfoods`, user `dspace`)
  - schema generation mode currently set to `create` (rebuilds schema on startup)
  - Gmail SMTP over SSL (port 465)
  - JWT secret and expiration
  - verification URL base
  - bootstrap admin credentials (`app.bootstrap.admin.*`)
  - data reset toggle (`app.bootstrap.reset-data`)
  - file upload config (`app.file.upload-dir`, `app.file.max-size-bytes`)
  - multipart size limits
  - frontend base URL (`app.frontend.base-url=http://localhost:4000`)

## Frontend
- Path: `frontend/`
- Stack: React + Vite + Material UI
- Port: `4000`
- Pages:
  - login
  - users
  - vendors
  - trades list/create
  - trade details with PDF view/download
- Auth bootstrap:
  - frontend calls `/api/auth/me` on load to restore session from HttpOnly cookie.
- Test config: `src/test/resources/application.properties`
  - H2 datasource for isolated tests

## Build and Test
- Run tests: `./mvnw.cmd test`
- Current status: passing

## Notes
- Replace placeholder mail and JWT secret settings before production.
- Keep this file updated whenever architecture/config/features change.

## API Documentation Policy
- API docs live in `memory-bank/apidocs/`.
- Each controller must have a matching API doc file:
  - `AdminUserController.java` -> `memory-bank/apidocs/AdminUsersAPI.md`
  - `AuthenticationController.java` -> `memory-bank/apidocs/AuthenticationAPI.md`
  - `VendorController.java` -> `memory-bank/apidocs/VendorAPI.md`
  - `TradeController.java` -> `memory-bank/apidocs/TradeAPI.md`
- When controller code changes (path, method, request/response, auth rule, behavior), update corresponding API doc in the same change.
- Use `memory-bank/apidocs/ControllerDocUpdateChecklist.md` during controller edits.
