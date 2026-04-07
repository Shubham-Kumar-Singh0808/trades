# Changes Log

## 2026-04-05 - Role-Aware User Management, Forgot Password, and Profile Updates

### Admin User Management
- `CreateUserRequest` redesigned for role-aware onboarding:
  - vendor: name, email, phone, companyName
  - executive/admin: name, email, phone
- Admin create now sends email invite with setup-password link (no direct password entry in UI).
- Added admin endpoints:
  - `PUT /api/admin/users/{id}` (edit user details)
  - `DELETE /api/admin/users/{id}` (delete user)
- Existing enable/disable endpoint retained and wired in UI.

### Authentication Enhancements
- Added forgot/reset password APIs:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Added token purposes:
  - `ADMIN_USER_SETUP`
  - `PASSWORD_RESET`
- Setup-password flow now supports both vendor and admin-invited users.
- Added profile update API:
  - `POST /api/auth/me/profile`

### User Profile Fields
- Added `name`, `mobileNo`, `companyName` to `AppUser`.
- Session response now includes profile fields for UI personalization.
- Vendor records synchronize with app user profile updates where applicable.

### Frontend Updates
- Role-aware navigation and route protection:
  - Users page is admin-only.
- Users page now supports:
  - role-specific create form
  - edit user data
  - enable/disable login
  - delete user
- Added pages:
  - forgot password
  - reset password
  - profile update
- Login page now includes forgot-password entry and reset success toast.

### Validation
- Backend compile: `BUILD SUCCESS`
- Backend tests: `BUILD SUCCESS`
- Frontend build: `BUILD SUCCESS`

## 2026-04-04 - Vendor End-to-End Onboarding with HTML Emails and UI Flows

### Backend Onboarding Enhancements
- Added vendor self-registration endpoint: `POST /api/auth/vendor/register` with full vendor details + password.
- Added token purpose model (`EMAIL_VERIFICATION`, `VENDOR_PASSWORD_SETUP`) to separate activation and password-setup links.
- Added activation redirect endpoint: `GET /api/auth/activate-account?token=...`:
  - success redirect: `/login?activation=success`
  - failure redirect: `/login?activation=failed`
- Added vendor password setup endpoint: `POST /api/auth/setup-password`.

### Admin Vendor Creation Flow
- `POST /api/vendors` now also:
  - creates linked app user with `VENDOR` role
  - keeps account disabled until setup complete
  - generates password setup token
  - sends HTML invitation email with setup button

### Vendor Registration Flow
- Self-registered vendor creates both vendor profile + app user.
- Account starts inactive.
- Sends styled HTML activation email including requested greeting and CTA button.
- Activation updates user and vendor to active/verified state.

### Frontend Integration
- Added public pages:
  - `frontend/src/pages/VendorRegistrationPage.jsx`
  - `frontend/src/pages/VendorSetupPasswordPage.jsx`
- Updated routing in `frontend/src/App.jsx` for:
  - `/vendor/register`
  - `/vendor/setup-password`
- Updated `LoginPage`:
  - toast for activation success/failure and password setup success
  - vendor register navigation link
- Updated `VendorsPage` with success feedback after admin creates vendor invitation.

### API Docs Updated
- `memory-bank/apidocs/AuthenticationAPI.md`
- `memory-bank/apidocs/VendorAPI.md`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Backend tests: `./mvnw.cmd test` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-04 - Link-Based PDF Access, Watermarked Download, Cookie Auth, and Frontend UI

### Backend Authentication and Session
- Login now sets HttpOnly JWT cookie (`TRADES_AUTH`).
- Added logout endpoint: `POST /api/auth/logout` (clears cookie).
- Added session endpoint: `GET /api/auth/me` for frontend session restore.
- JWT filter now accepts token from either header or cookie.

### Backend Trade Access Flow
- Trade notifications now include a details URL (frontend link), no file attachment.
- Added trade PDF endpoints:
  - `GET /api/trades/{id}/view` (inline PDF)
  - `GET /api/trades/{id}/download` (watermarked PDF)
- Added PDF watermark generation via Apache PDFBox.
- Watermark text logic:
  - vendor user: `name | companyName`
  - fallback: requester email

### Backend Configuration
- Added `app.frontend.base-url=http://localhost:4000`.
- Enabled CORS credentials support for frontend origin.

### Frontend (React + Material UI)
- Added new app at `frontend/` with Vite configured to port `4000`.
- Implemented professional UI pages:
  - login
  - users (admin API integration + pagination)
  - vendors (API integration + pagination)
  - trades (create/list with notification scope and selected vendor support)
  - trade details (view PDF in tab and download watermarked PDF)
- API client uses `withCredentials=true` for cookie auth.

### API Docs Updated
- Updated `memory-bank/apidocs/AuthenticationAPI.md` for cookie auth, logout, and session notes.
- Updated `memory-bank/apidocs/TradeAPI.md` for link-based details, view endpoint, and watermarked download endpoint.

### Validation
- Backend compile check passed:
  - `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend install/run currently blocked by environment disk space (`ENOSPC`).

## 2026-04-04 - Link-Based Trade Access, Watermarked Download, and React UI Scaffold

### Backend: Cookie Authentication and CORS
- Updated `AuthenticationController`:
  - login now sets HttpOnly JWT cookie `TRADES_AUTH`
  - added `POST /api/auth/logout` to clear cookie
- Updated `JwtFilter`:
  - accepts JWT from `Authorization` header or `TRADES_AUTH` cookie
- Updated `SecurityConfig`:
  - enabled CORS with credentials for frontend URL (`app.frontend.base-url`)

### Backend: Link Instead of File in Notifications
- Extended trade notification email content to include details URL.
- Trade emails no longer require file attachment delivery.
- Trade details URL pattern: `<frontendBaseUrl>/trades/{tradeId}`

### Backend: Trade PDF View + Watermarked Download
- Added `PdfWatermarkService` using Apache PDFBox.
- Added endpoints in `TradeController`:
  - `GET /api/trades/{id}/view` -> inline PDF view
  - `GET /api/trades/{id}/download` -> attachment download with watermark
- Watermark text:
  - vendor downloader: `name | companyName`
  - fallback: downloader email
- Extended `FileStorageService` with byte-read support.

### Backend: Dependencies and Properties
- Added Maven dependency:
  - `org.apache.pdfbox:pdfbox`
- Added property:
  - `app.frontend.base-url=http://localhost:4000`

### Frontend: React + Material UI (localhost:4000)
- Added new app under `frontend/` with Vite config on port 4000.
- Implemented pages and integration:
  - Login
  - Users (paginated)
  - Vendors (paginated)
  - Trades list/create
  - Trade details page with inline PDF viewer and watermarked download button
- Uses credentialed API calls (`withCredentials=true`) for HttpOnly cookie auth.

### Validation Status
- Backend compile check: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend package install blocked by environment disk space (`ENOSPC`).

## 2026-04-04 - Pagination/Sorting Expansion and Trade Recipient Selection

### Pagination and Sorting Enhancements
- Updated admin user listing to support pagination and sorting:
  - `GET /api/admin/users?page=0&size=10&sort=email,asc`
- Refactored:
  - `AdminUserController.getUsers(...)` -> returns `Page<UserResponse>`
  - `AdminUserService.getAllUsers(Pageable)` -> pageable repository query

### Trade Notification Recipient Selection
- Added notification scope options for trade creation:
  - `SELECTED` -> notify only chosen vendor IDs
  - `ALL_ACTIVE` -> notify all active vendors
  - `ALL` -> notify all vendors regardless of active status
- Added `TradeNotificationScope` enum.
- Updated `CreateTradeRequest` with:
  - `notificationScope`
  - `vendorIds`
- Updated `TradeService.createTrade(...)` to resolve recipients based on scope.
- Added error code `TRADE_NOTIFICATION_INVALID_SELECTION` for invalid selected-vendor input.

### Repository Update
- Added `VendorRepository.findByIdIn(List<UUID> ids)` for selected vendor notification mode.

### API Docs Update
- Updated `memory-bank/apidocs/AdminUsersAPI.md` with pagination/sorting for list users.
- Updated `memory-bank/apidocs/TradeAPI.md` with notification scope options and selected-vendor cURL example.

## 2026-04-04 - Vendor and Trade Management Implementation

### Vendor Module
- Added entities:
  - `Vendor` (UUID PK, indexed email, active flag, createdAt)
  - `SubVendor` (UUID PK, many-to-one with vendor)
- Added repositories:
  - `VendorRepository`
  - `SubVendorRepository`
- Added DTOs:
  - `CreateVendorRequest`
  - `SubVendorRequest`
  - `VendorResponse`
- Added `VendorService` with:
  - create, update, getById, getAll(pageable), addSubVendor, delete, activate, deactivate
- Added business validation:
  - max 3 sub-vendors per vendor
  - unique vendor email conflict handling
- Added `VendorController` endpoints under `/api/vendors` with RBAC:
  - POST create (ADMIN, EXECUTIVE)
  - GET list/byId (ADMIN, EXECUTIVE, VENDOR)
  - PUT/DELETE/activate/deactivate (ADMIN)
  - POST subvendors (ADMIN, EXECUTIVE)

### Trade Module
- Added entities:
  - `Trade` (UUID PK, unique business `tradeId`, indexed `tradeId` and `createdAt`)
  - `TradeMode` enum (ONLINE, OFFLINE, HYBRID)
- Added repository:
  - `TradeRepository`
- Added DTOs:
  - `CreateTradeRequest`
  - `TradeResponse`
- Added `TradeService` with:
  - createTrade, getAllTrades(pageable), getTradeById
- Added `TradeController` endpoints under `/api/trades`:
  - POST create (multipart, ADMIN/EXECUTIVE)
  - GET list/byId (ADMIN/EXECUTIVE/VENDOR)

### File Upload and Notification
- Added `FileStorageService`:
  - `saveFile()` with PDF-only and max-size validation
  - `getFile()`
- Configured storage path and size limits using properties.
- Extended `EmailService`:
  - keeps verification email flow
  - added trade creation notification to all active vendors

### Error Handling and Codes
- Added `BusinessException` for status + code + message flows.
- Extended `ErrorCode` with vendor/trade/file specific codes.
- Updated `GlobalExceptionHandler` to handle `BusinessException` consistently.

### Audit Logging
- Extended action mapping in `AuditLoggingAspect` to include:
  - vendor creation
  - sub-vendor creation
  - trade creation

### Reset and Config Integration
- Updated `DataResetInitializer` to truncate new tables (`vendor`, `sub_vendor`, `trade`) during reset.
- Added application properties:
  - `app.file.upload-dir=/uploads/trades`
  - `app.file.max-size-bytes=5242880`
  - multipart max file/request size

### API Documentation
- Added `memory-bank/apidocs/VendorAPI.md`.
- Added `memory-bank/apidocs/TradeAPI.md`.
- Updated `memory-bank/apidocs/README.md` mapping with new controller docs.

### Verification
- Ran `./mvnw.cmd test`.
- Result: `BUILD SUCCESS`.

## 2026-04-04 - UUID IDs, Table Indexing, and Full DB Reset/Re-seed

### UUID Primary Key Migration
- Converted primary keys from `Long` to `UUID` in:
  - `AppUser`
  - `Role`
  - `EmailVerificationToken`
  - `AuditLog`
- Updated all related repositories to `JpaRepository<..., UUID>`.
- Updated admin APIs/service/DTO to use UUID user IDs (`/api/admin/users/{userId}`).

### Indexing for Faster Lookup
- Added table indexes for frequent lookup fields:
  - `app_user`: email, enabled, emailVerified
  - `roles`: name
  - `email_verification_token`: token, expiresAt, user_id
  - `audit_logs`: username, endpoint, timestamp, statusCode
  - `user_roles` join table: user_id, role_id

### Reset + Default Seed Initialization
- Added `DataResetInitializer` (`ApplicationRunner`, order 1):
  - truncates `audit_logs`, `email_verification_token`, `user_roles`, `app_user`, `roles`
  - controlled by `app.bootstrap.reset-data`
- Kept `DataInitializer` (order 2) for default role/admin initialization.
- Main app property set: `app.bootstrap.reset-data=true`
- Test property set: `app.bootstrap.reset-data=false`

### PostgreSQL Schema Alignment for UUID
- Initial run failed due existing schema mismatch (`bigint` id columns vs UUID entity IDs).
- Updated main setting to recreate schema from entities:
  - `spring.jpa.hibernate.ddl-auto=create`
- Re-ran app successfully; logs confirmed:
  - data truncated
  - roles initialized
  - default admin created

### API Docs Update
- Updated `memory-bank/apidocs/AdminUsersAPI.md` to use UUID examples instead of numeric IDs.

## 2026-04-04 - Proper Error Handling and Login Disabled Message

### Login Behavior Update
- Updated `AuthService.login` to check disabled/verification status before authentication.
- If user is disabled, API now returns:
  - status: `403`
  - message: `You are not allowed to login. Please contact the admin.`
- Invalid credentials now return:
  - status: `401`
  - message: `Invalid email or password`

### Standardized Error Coding
- Added `ApiErrorResponse` as a common error payload model.
- Added `ErrorCode` enum for consistent API error codes.
- Added `GlobalExceptionHandler` (`@RestControllerAdvice`) to handle:
  - validation errors
  - `ResponseStatusException`
  - authentication errors
  - access denied errors
  - unexpected server errors
- Error payload now includes:
  - timestamp, status, error, code, message, path, details

### API Documentation Update
- Updated `memory-bank/apidocs/AuthenticationAPI.md` with:
  - standard error response format
  - login error scenarios and error codes

## 2026-04-04 - Human-Readable Audit Messages

### Audit Model Enhancement
- Updated `AuditLog` entity to include `actionMessage` so each record explains what action was performed.

### Audit Aspect Enhancement
- Updated `AuditLoggingAspect` to populate descriptive actions for known controller operations:
  - register -> `User registration requested`
  - verify email -> `Email verification completed`
  - login -> `User login successful`
  - admin create user -> `Admin created a user account`
  - admin assign roles -> `Admin updated user roles`
  - admin set status -> `Admin changed user enabled status`
  - admin list users -> `Admin fetched users list`
- Added fallback message format for unknown endpoints: `<METHOD> <ENDPOINT> invoked`.
- Improved status handling for exceptions:
  - uses `ResponseStatusException` HTTP status when available
  - falls back to `500` for unknown errors

### Verification
- Ran `./mvnw.cmd test`.
- Result: `BUILD SUCCESS`.

## 2026-04-04 - API Docs Folder and Controller Documentation

### Added API Docs Structure
- Created `memory-bank/apidocs/` folder.
- Added `memory-bank/apidocs/README.md` with controller-doc mapping and maintenance policy.
- Added `memory-bank/apidocs/ControllerDocUpdateChecklist.md` for change-time validation.

### Added Controller-wise API Docs
- Added `memory-bank/apidocs/AdminUsersAPI.md`:
  - documents all endpoints in `AdminUserController`
  - includes endpoint use, use case, request/response shapes, and cURL examples
- Added `memory-bank/apidocs/AuthenticationAPI.md`:
  - documents all endpoints in `AuthenticationController`
  - includes endpoint use, use case, request/response shapes, and cURL examples

### Workflow Enforcement
- Updated `memory-bank/README.md` to require API doc updates whenever controller behavior/endpoints change.
- Updated `memory-bank/project-details.md` with explicit API documentation policy and file mapping.

## 2026-04-04 - PostgreSQL Bootstrap, Role Entity, and Mail SSL Update

### Domain & Schema Alignment
- Added `Role` entity mapped to `roles` table.
- Added `RoleRepository` with method `Optional<Role> findByName(RoleName name)`.
- Refactored `AppUser`:
  - table changed to `app_user`
  - roles changed from enum element collection to many-to-many `Set<Role>` via `user_roles`.
- Updated `EmailVerificationToken` table mapping to `email_verification_token`.

### Service and Security Refactor
- Updated `CustomUserDetailsService` to build authorities from `Role.getName()`.
- Updated `AuthService`:
  - resolves default `VENDOR` role via `RoleRepository`
  - throws server error if base roles are not initialized
  - JWT authority mapping uses role entity names
- Updated `AdminUserService`:
  - resolves API-provided `RoleName` values into `Role` entities
  - stores role entities on users
  - returns role names in `UserResponse`

### Database Initialization (Idempotent)
- Added `DataInitializer` (`ApplicationRunner`, `@Transactional`) to:
  - initialize roles if missing (`ADMIN`, `EXECUTIVE`, `VENDOR`)
  - create default admin only if missing (`admin@pawfectfoods.com`)
  - encode admin password with BCrypt (`PasswordEncoder` bean)
  - ensure existing admin has ADMIN role
- Added startup logs for:
  - roles initialized
  - admin user created/already exists

### Bootstrap and Mail Configuration
- Added `AppBootstrapProperties` with configurable admin defaults:
  - `app.bootstrap.admin.email`
  - `app.bootstrap.admin.password`
- Added explicit `MailConfig` providing `JavaMailSender` bean.
- Updated mail properties for Gmail SSL:
  - host: `smtp.gmail.com`
  - port: `465`
  - SSL enabled and socket factory class set to `javax.net.ssl.SSLSocketFactory`
  - default from: `techie3707@gmail.com`

### Application Properties
- Updated PostgreSQL config to:
  - URL: `jdbc:postgresql://localhost:5432/pawfectfoods`
  - username: `dspace`
  - password: `dspace`

### Verification
- Ran `./mvnw.cmd test`.
- Result: `BUILD SUCCESS`.
- Confirmed startup logs include role initialization and admin bootstrap messages.

## 2026-04-04 - Initial API Scaffold

### Project and Dependency Setup
- Updated Spring Boot parent version from `4.0.5` to `3.3.5` for stable Spring Security/JPA compatibility.
- Added/updated dependencies in `pom.xml`:
  - `spring-boot-starter-web`
  - `spring-boot-starter-security`
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-validation`
  - `spring-boot-starter-mail`
  - `spring-boot-starter-aop`
  - JWT libs: `jjwt-api`, `jjwt-impl`, `jjwt-jackson`
  - test libs: `spring-boot-starter-test`, `spring-security-test`, `h2`

### Configuration
- Updated `src/main/resources/application.properties` with:
  - PostgreSQL datasource settings
  - JPA properties
  - SMTP mail properties
  - JWT secret and expiration
  - email verification base URL and from address
- Added `src/test/resources/application.properties` for H2 tests.

### Domain Models
- Added `RoleName` enum with roles: `ADMIN`, `EXECUTIVE`, `VENDOR`.
- Added entities:
  - `AppUser`
  - `EmailVerificationToken`
  - `AuditLog`

### Repository Layer
- Added repositories:
  - `AppUserRepository`
  - `EmailVerificationTokenRepository`
  - `AuditLogRepository`

### DTO Layer
- Added DTOs:
  - `AuthResponse`
  - `LoginRequest`
  - `RegisterRequest`
  - `MessageResponse`
  - `CreateUserRequest`
  - `UpdateRolesRequest`
  - `UpdateUserStatusRequest`
  - `UserResponse`

### Security Layer
- Added `JwtUtil` for token generation and validation.
- Added `JwtFilter` for request token parsing and context authentication.
- Added `CustomUserDetailsService` for loading users from DB.
- Added `SecurityConfig` for stateless security and endpoint authorization.

### Service Layer
- Added `AuthService` for:
  - registration
  - login
  - email verification
- Added `AdminUserService` for:
  - create user
  - assign roles
  - enable/disable user
  - list users
- Added `EmailService` for verification email dispatch.
- Added `AuditLogService` for audit log persistence.

### Controller Layer
- Added `AuthenticationController` endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/verify-email`
- Added `AdminUserController` endpoints:
  - `POST /api/admin/users`
  - `GET /api/admin/users`
  - `PUT /api/admin/users/{userId}/roles`
  - `PUT /api/admin/users/{userId}/status`

### Cross-Cutting Concern (AOP)
- Added `AuditLoggingAspect` to log all API calls from controller package with:
  - username
  - endpoint
  - method
  - timestamp
  - status code

### Verification
- Ran `./mvnw.cmd test`.
- Result: `BUILD SUCCESS`.

---

## Update Rule
Before any new code change:
1. Read `memory-bank/project-details.md`.
2. Read `memory-bank/changes-log.md`.

After any code change:
1. Append a new dated entry here.
2. Update `memory-bank/project-details.md` if project behavior/architecture/config changed.
