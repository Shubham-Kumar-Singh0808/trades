# Changes Log

## 2026-04-22 - Fix: HOPPING Mode Validation + Vendor /api/trades 500

### Issues
- `POST /api/trades` with multipart form failed validation for mode value `HOPPING`.
- Vendor `GET /api/trades` could fail with `500` when pageable sorting (`createdAt`) was applied on a `TradeBid`-root query.

### Backend Fixes
- Added web conversion component: `TradeModeConverter` to map form string values (`DIRECT`, `HOPPING`, etc.) through `TradeMode.fromValue(...)` during `@ModelAttribute` binding.
- Moved vendor trade pagination query to `TradeRepository` (Trade-root JPQL with `exists` subquery) so pageable sorting by trade fields works reliably.
- Updated `TradeService.getAllTrades(...)` vendor path to use the new `TradeRepository.findDistinctByVendorId(...)`.

### Validation
- Backend clean compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-20 - Next Round Email Update (Show Previous Round L1)

### Backend Updates
- Updated round-start notification flow to include previous round L1 explicitly.
- `TradeService.startNextRound(...)` now passes:
  - previous round number
  - previous round L1 value (`finalL1Rate` captured before increment)
- `EmailService.sendTradeBidReopenedNotification(...)` now sends vendor email text in this style:
  - "L1 for round X is Y"
  - "If you want to update your bid for round Z, click below"

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-20 - Tracking List Terminology Update to Packing List

### Backend Updates
- Added packing-list endpoint aliases in `TradeController` while keeping old tracking-list URLs for backward compatibility:
  - `GET /api/trades/{id}/packing-list/view` (alias of tracking-list view)
  - `GET /api/trades/{id}/packing-list/download` (alias of tracking-list download)
- Updated response download/inline filenames from `tracking-list.pdf` to `packing-list.pdf`.

### Frontend Updates
- Trade create screen label changed from `Tracking List PDF` to `Packing List PDF`.
- Trade details screen now:
  - requests preview/download using `/packing-list/...` endpoints
  - shows `Packing List` in button/title/error/loading text
  - downloads as `trade-{id}-packing-list.pdf`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-20 - Hotfix: trade_closed Column Mismatch (500 on /api/trades)

### Root Cause
- `Trade` entity had a persisted boolean field `tradeClosed`, which Hibernate mapped to `trade.trade_closed`.
- Existing PostgreSQL schema did not contain `trade_closed`, causing SQLState `42703` (`column does not exist`) on trade reads.

### Fix Applied
- Removed persisted `tradeClosed` field from `Trade` entity.
- Updated trade-closure checks in `TradeService` to derive closed state from `closedAt != null`.
- Updated `TradeResponse` mapping to return `tradeClosed` as computed (`closedAt != null`) without requiring a DB column.

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-20 - Mode Alias + Round Close Flow Update

### Backend Updates
- `TradeMode` now accepts UI values `DIRECT` and `HOPPING` and maps them to persisted enum values (`ONLINE`, `HYBRID`).
- Trade create notification email now displays mode as `DIRECT`/`HOPPING` instead of raw enum names.
- Added round lifecycle controls:
  - `PATCH /api/trades/{id}/bids/round/close` closes only the current round.
  - `PATCH /api/trades/{id}/bids/next-round` starts a new round.
  - `PATCH /api/trades/{id}/bids/close` now performs final trade closure only after a round is closed.
- Added `tradeClosed` flag on `Trade` and exposed it in `TradeResponse`.
- Added error code `TRADE_ROUND_STILL_OPEN` when trying to final-close an open round.

### Email Updates
- Round start email wording updated to reflect "new round started" and includes round number and current lowest bid.

### Frontend Updates
- Trade create form now submits mode values as `DIRECT` and `HOPPING`.
- Trade details admin/executive actions updated:
  - while open: `Close Round`
  - after round close: `Start Next Round` and `Close Trade`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-20 - Tender Bidding Lifecycle (Rounds, L1/L2/L3, Close/Reopen, Role-Based Views)

### Backend Updates
- Added persistent bid model and repository:
  - `TradeBid` entity stores vendor bid per trade + round.
  - `TradeBidRepository` supports leaderboard, participant, and round-history queries.
- Extended `Trade` entity and `TradeResponse` with bidding metadata:
  - `biddingOpen`
  - `currentRound`
  - `finalL1Rate`
  - `closedAt`
- Added bid management APIs under `/api/trades/{id}/bids`:
  - `POST /api/trades/{id}/bids` (VENDOR) submit/update bid for current round
  - `GET /api/trades/{id}/bids/top3` (ADMIN/EXECUTIVE) returns anonymous L1/L2/L3 board
  - `GET /api/trades/{id}/bids/board` (ADMIN/EXECUTIVE/VENDOR) role-specific dashboard payload
  - `PATCH /api/trades/{id}/bids/close` (ADMIN/EXECUTIVE) closes round, finalizes L1 for round, sends notifications
  - `PATCH /api/trades/{id}/bids/reopen` (ADMIN/EXECUTIVE) opens next round and notifies participants
- Added trade bid-specific error codes in `ErrorCode`.
- Updated vendor trade listing behavior:
  - vendor `GET /api/trades` now returns only trades where vendor has participated (submitted at least one bid).

### Email Workflow Updates
- Trade creation email continues to include CTA link to open trade and place bid.
- On bid close:
  - L1 vendor receives winner email with trade details and action prompt.
  - admins receive final summary email containing round-wise participation, rates, and L1/L2/L3 rankings.
- On bid reopen:
  - participating vendors receive reopen email with current lowest bid and direct link to update bid.

### Frontend Updates
- `TradesPage` now uses session roles:
  - create-trade action visible only to ADMIN/EXECUTIVE.
- `TradeDetailsPage` now includes bidding dashboard:
  - vendor: submit/update bid, see own bids, own current bid, and final L1 rate
  - admin/executive: see anonymous L1/L2/L3 during active bidding, close/reopen controls, full bid table after closure
  - role-specific visibility enforced in UI according to bidding state

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - Vendor List 500 Fix (executive_approved Migration)

### Root Cause
- Startup schema update attempted to enforce `NOT NULL` on `vendor.executive_approved` while existing rows had null values.
- This caused DDL error and led to unstable runtime behavior on vendor endpoints (`/api/vendors`, `/api/vendors/registration-requests`).

### Fix Applied
- Changed `Vendor.executiveApproved` from primitive `boolean` to nullable `Boolean` with default `FALSE` in model.
- Updated executive queue filtering to include legacy rows where `executiveApproved` is `NULL`.
- Updated service logic and response mapping to use null-safe checks (`Boolean.TRUE.equals(...)`).

### Validation
- Backend clean compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`
- Backend startup verified: application starts successfully on port `8080` without `executive_approved` null-value DDL failure.

## 2026-04-19 - Executive Approval 409 Conflict Fix

### Issue Addressed
- Executive approval API (`PATCH /api/vendors/{id}/registration/approve`) was returning `409 CONFLICT`.

### Root Cause
- Executive approval flow wrote a new enum status value path that could conflict with existing DB constraints in some environments.

### Fix Applied
- Refactored executive-first approval tracking to use dedicated vendor fields instead of status transition:
  - `executiveApproved` (boolean)
  - `executiveApprovedAt` (timestamp)
  - `executiveApprovedBy` (email)
- Executive approval now keeps `registrationStatus=PENDING_APPROVAL` and marks the executive-approved flag.
- Admin queue still includes pending registrations and can directly approve or finalize executive-reviewed ones.
- Executive queue now shows only pending rows where `executiveApproved=false`.
- Vendors UI final-approve label now uses `executiveApproved` flag.

### Validation
- Backend clean compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - Vendor Approval Retry Handling (409 Conflict Improvement)

### Issue Addressed
- Admin approval endpoint returned `409 CONFLICT` when a user with same vendor email already existed, even in retry/recovery scenarios.

### Backend Update
- Added case-insensitive user lookup method:
  - `AppUserRepository.findFirstByEmailIgnoreCase(...)`
- Updated `VendorService.approveRegistration(...)`:
  - if matching user exists and has `VENDOR` role, approval now reuses and updates that user (enabled/verified/profile sync)
  - only conflicts with non-vendor existing users remain blocked as `409`

### Validation
- Backend clean compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-19 - Vendor Approval 500 Error Hardening

### Issue Addressed
- `PATCH /api/vendors/{id}/registration/approve` was returning generic `500 INTERNAL_SERVER_ERROR` in some approval scenarios.

### Backend Fixes
- Added case-insensitive user existence check in `AppUserRepository`:
  - `existsByEmailIgnoreCase(...)`
- Updated `VendorService.approveRegistration(...)`:
  - uses case-insensitive pre-check before user creation
  - catches `DataIntegrityViolationException` on user save and returns business conflict
- Updated global exception handling:
  - maps `DataIntegrityViolationException` to HTTP `409 CONFLICT` with `CONFLICT` error code instead of generic 500

### Validation
- Backend compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-19 - Prevent Data Loss On Restart

### Root Cause
- Database rows were being removed on each restart because:
  - `spring.jpa.hibernate.ddl-auto=create` recreated schema at startup
  - `app.bootstrap.reset-data=true` triggered table truncation in bootstrap initializer

### Fix Applied
- Updated `application.properties`:
  - `spring.jpa.hibernate.ddl-auto=update`
  - `app.bootstrap.reset-data=false`
- Updated `DataResetInitializer` truncate SQL to remove stale `sub_vendor` table reference.

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-19 - Executive First Approval + Admin Final/Direct Approval

### Workflow Update
- Updated vendor registration approval flow to support:
  - executive first approval
  - admin final approval after executive approval
  - admin direct approval from pending state (without executive step)

### Backend Changes
- Added intermediate vendor status: `EXECUTIVE_APPROVED`
- `PATCH /api/vendors/{id}/registration/approve` now allows `ADMIN` and `EXECUTIVE`
- Service logic updated:
  - executive approval transitions `PENDING_APPROVAL` -> `EXECUTIVE_APPROVED`
  - admin approval transitions `PENDING_APPROVAL` or `EXECUTIVE_APPROVED` -> `APPROVED` and enables login
- Registration request listing updated by role:
  - admin sees both `PENDING_APPROVAL` and `EXECUTIVE_APPROVED`
  - executive sees `PENDING_APPROVAL`

### Frontend Changes (`/vendors`)
- Approve button is no longer disabled for executive users.
- Approve button label is role/status aware:
  - executive: `Approve & Forward`
  - admin on executive-approved row: `Final Approve`
  - admin direct path: `Approve`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - Vendor Approval Email + Sub-Vendor Feature Removal

### Vendor Approval Email
- Updated vendor approval notification email to richer HTML format with direct login link.
- `sendVendorApprovedEmail(...)` now sends a dedicated approval template to improve visibility/usability for approved vendors.

### Backend Cleanup (Sub-Vendor Removed)
- Removed sub-vendor feature from backend and database model:
  - removed `SubVendor` entity
  - removed `SubVendorRepository`
  - removed `SubVendorRequest` DTO
  - removed `/api/vendors/{id}/subvendors` create/update endpoints
  - removed sub-vendor service logic and authorization checks from `VendorService`
  - removed sub-vendor payload from `VendorResponse`
  - removed stale sub-vendor audit mapping and error code

### Frontend Update (`/vendors`)
- Removed all sub-vendor management UI.
- Added `View Contact Details` action in vendor list.
- Added contact-details dialog that shows vendor contact persons (name/designation/email/phone).

### Validation
- Backend clean compile: `./mvnw.cmd clean -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - GST Status Visibility and Read-Only GST Auto Fields

### Backend Updates
- Extended GST lookup payload and vendor persistence with status metadata:
  - `gstStatus`
  - `gstActive`
- Updated mapping chain:
  - RapidAPI response -> `GstLookupResponse`
  - `AuthService.registerVendor(...)` -> `Vendor`
  - `VendorResponse` -> executive/admin UI consumption

### Frontend Updates
- `VendorRegistrationPage`:
  - company name and registered address fields are now disabled + auto-only (manual typing blocked)
  - added GST status banner after fetch (`Active` / `Not Active`)
- `VendorsPage` (executive/admin pending registration table):
  - added GST Status column with active/not-active chip and raw GST status text

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - GST Company Name Preference Update

### Backend Behavior Update
- Updated GST name mapping priority in `GstLookupService`:
  - prefer `data.tradeName` as `companyName`
  - fallback to `data.legalName` when trade name is empty

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`

## 2026-04-19 - GST Lookup Switched to RapidAPI

### Backend Integration
- Updated `GstLookupService` to call RapidAPI endpoint:
  - `GET https://gst-insights-api.p.rapidapi.com/getAddressUsingGST/{gstNo}`
- Added required headers to outgoing request:
  - `x-rapidapi-host`
  - `x-rapidapi-key`
  - `Content-Type: application/json`
- Mapped RapidAPI response fields to internal `GstLookupResponse`:
  - `data.gstNumber` -> `gstNo`
  - `data.legalName` (fallback `data.tradeName`) -> `companyName`
  - `data.address.*` merged into `registeredAddress`
- Added configuration keys in `application.properties`:
  - `app.gst-insights.base-url`
  - `app.gst-insights.host`
  - `app.gst-insights.key`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Backend tests: `./mvnw.cmd test -DskipITs` -> `BUILD SUCCESS`

## 2026-04-19 - Vendor Registration UI Refinement

### Frontend UX Improvements
- Refined layout for `vendor/register` page with clearer section hierarchy:
  - Basic Details
  - Contact Persons (3 mandatory)
  - Account Credentials
- Improved responsive behavior for mobile/tablet by reorganizing content into a structured two-column desktop layout and single-column mobile flow.
- Added a sticky left-side context panel (desktop) with flow guidance and approval summary.
- Enhanced field ergonomics:
  - `type="email"` for email fields
  - `type="tel"` for phone fields
  - GST field `maxLength=15` and helper text
  - Clearer helper text for password and GST auto-fetch fields

### Validation
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-19 - Executive Temporary Credential Login Fix

### Backend Fix
- Updated authentication user-details mapping so temporary-credential users are not blocked by Spring Security before setup-token logic runs.
- File updated:
  - `src/main/java/com/pawfectfoods/trades/security/CustomUserDetailsService.java`
- Change:
  - User disable condition now checks only `enabled` state.
  - Email verification gating remains enforced in `AuthService.login(...)`, which allows ADMIN_USER_SETUP flow while keeping normal unverified login blocked.

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Backend tests: `./mvnw.cmd test -DskipITs` -> `BUILD SUCCESS`

## 2026-04-19 - GST-Based Vendor Registration and Approval Workflow

### Backend Enhancements
- Added GST lookup API for vendor onboarding:
  - `GET /api/auth/vendor/gst-lookup?gstNo=...`
- Vendor self registration now requires:
  - `name`, `email`, `gstNo`, `officeAddress`, `password`
  - exactly 3 mandatory contact persons (`name`, `designation`, `email`, `phone`)
- Company name and registered address are now auto-derived from GST lookup in backend.
- Added vendor registration lifecycle status:
  - `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
- Added admin/executive registration review flow:
  - `GET /api/vendors/registration-requests`
  - `PATCH /api/vendors/{id}/registration/approve` (ADMIN)
  - `PATCH /api/vendors/{id}/registration/reject` (ADMIN)
- On admin approval:
  - vendor becomes active
  - app user account is created/enabled
  - approval email is sent to vendor
- Added vendor profile change request workflow (approval-based):
  - `POST /api/vendors/me/change-request` (VENDOR)
  - `GET /api/vendors/change-requests?status=PENDING` (ADMIN/EXECUTIVE)
  - `PATCH /api/vendors/change-requests/{id}/approve` (ADMIN/EXECUTIVE)
  - `PATCH /api/vendors/change-requests/{id}/reject` (ADMIN/EXECUTIVE)
- Vendor direct update via `/api/auth/me/profile` is now blocked and requires approval workflow.

### Data Model Additions
- `Vendor` extended with GST/address/status/approval metadata.
- Added `VendorContactPerson` model for mandatory 3 contact entries.
- Added `VendorProfileChangeRequest` model for approval-gated vendor updates.

### Frontend Enhancements
- Rebuilt `frontend/src/pages/VendorRegistrationPage.jsx`:
  - GST fetch button
  - read-only company name and registered address
  - office address field
  - exactly 3 mandatory contact person blocks
  - role-aligned submission messaging (pending admin approval)
- Updated `frontend/src/pages/VendorsPage.jsx`:
  - pending registration requests panel
  - approve/reject actions (admin final approval)
  - pending vendor profile change request panel with approve/reject actions
  - existing vendor list and sub-vendor management retained
- Updated `frontend/src/pages/ProfilePage.jsx`:
  - vendor users now submit change requests instead of direct updates
  - vendor profile includes office address and 3 contact persons
  - company name/registered address shown as read-only GST-derived values

### API Docs Updated
- `memory-bank/apidocs/AuthenticationAPI.md`
- `memory-bank/apidocs/VendorAPI.md`

### Validation
- Backend compile: `./mvnw.cmd -DskipTests compile` -> `BUILD SUCCESS`
- Backend tests: `./mvnw.cmd test` -> `BUILD SUCCESS`
- Frontend build: `npm --prefix D:\trades\frontend run build` -> `BUILD SUCCESS`

## 2026-04-16 - Frontend Build Warning Cleanup

### Frontend Cleanup
- Removed duplicate `display` style keys in:
  - `frontend/src/pages/LoginPage.jsx`
  - `frontend/src/pages/VendorRegistrationPage.jsx`
- This resolves Vite/esbuild duplicate object key warnings raised during production build.

### Validation
- Frontend build: `npm run build` -> `BUILD SUCCESS`
- Remaining warning is only chunk-size advisory (non-blocking).

## 2026-04-16 - Dual Trade PDFs and Temporary Credentials Setup Flow

### Trade Enhancements (Backend + Frontend)
- Trade creation now accepts two required PDF files:
  - `jobSheetFile`
  - `trackingListFile`
- Backend updates:
  - `Trade` model now stores `jobSheetPdfPath` and `trackingListPdfPath`.
  - `CreateTradeRequest` and `TradeResponse` updated for dual PDF fields.
  - Added dedicated document endpoints:
    - `GET /api/trades/{id}/job-sheet/view`
    - `GET /api/trades/{id}/job-sheet/download`
    - `GET /api/trades/{id}/tracking-list/view`
    - `GET /api/trades/{id}/tracking-list/download`
  - Existing `/view` and `/download` now serve job sheet for backward compatibility.
- Frontend updates:
  - `TradesPage` now uploads both PDFs while creating a trade.
  - `TradeDetailsPage` now previews and downloads both job sheet and tracking list PDFs.

### Admin-Created User Temporary Credentials Flow
- Admin create-user flow now generates a temporary alphanumeric password and emails it to the user.
- Temporary credential validity: 2 hours.
- Backend updates:
  - `AdminUserService` now creates 2-hour `ADMIN_USER_SETUP` token and sends temporary credentials email.
  - `EmailService` added temporary credentials email template with user ID (email), temp password, and expiry.
  - `AuthService.login` now detects valid pending setup token and returns setup-required response.
  - `AuthResponse` extended with:
    - `requiresPasswordSetup`
    - `setupToken`
  - `AuthenticationController.login` skips cookie issuance when setup is required.
- Frontend updates:
  - `LoginPage` handles setup-required login response and redirects to:
    - `/setup-password?token=<setupToken>`

### API Docs Updated
- `memory-bank/apidocs/TradeAPI.md`
- `memory-bank/apidocs/AuthenticationAPI.md`

## 2026-04-16 - Trade Mode Labels, Vendor Role Guard, and Sub-Vendor Management

### Trade UI Updates
- Updated trade mode labels in frontend to display business terms:
  - `ONLINE` shown as `DIRECT`
  - `HYBRID` shown as `HOPPING`
- Applied to:
  - trade creation mode dropdown
  - trade list mode column
  - trade details mode display

### Users UI Role Restriction
- Updated user edit flow in `frontend/src/pages/UsersPage.jsx`:
  - Vendor users cannot have role changed in UI.
  - Role changes are allowed only between `ADMIN` and `EXECUTIVE` for non-vendor users.

### Sub-Vendor Management (Backend + Frontend)
- Backend updates:
  - `POST /api/vendors/{id}/subvendors` now allows `ADMIN` and `VENDOR`.
  - Added `PUT /api/vendors/{id}/subvendors/{subVendorId}` for sub-vendor updates.
  - Added ownership checks so vendor users can manage sub-vendors only for their own vendor record.
  - Added repository helper `findByIdAndVendorId(...)` for scoped sub-vendor updates.
- Frontend updates in `frontend/src/pages/VendorsPage.jsx`:
  - Added role-aware "Manage Sub Vendors" action.
  - Added sub-vendor dialog with list, add, and edit capabilities.
  - Enforced max 3 sub-vendors in UI action state.
  - Admin can manage sub-vendors across vendors.
  - Vendor can manage sub-vendors only for own vendor row.

### Routing Context Updates
- Passed `session` from `App.jsx` to vendor and trade pages for role-aware UI behavior.

## 2026-04-16 - Vendor Registration UI Validation Alignment

### Frontend Validation Enhancements
- Updated `frontend/src/pages/VendorRegistrationPage.jsx` to enforce backend-equivalent validation before submit:
  - `name`: required, max 100
  - `companyName`: required, max 150
  - `mobileNo`: required, max 20
  - `email`: required, valid email format, max 150
  - `password`: required, min 8, max 100
  - `confirmPassword`: required, must match password
- Added field-level error rendering using MUI `TextField` `error` and `helperText`.
- Added backend validation details mapping (`response.data.details`) to corresponding form fields for accurate inline error messages.
- Added submit loading state to prevent duplicate submissions and improve UX.

## 2026-04-16 - Setup Password White Screen and Bootstrap Guard

### Frontend Stability Fix
- Fixed white screen on setup-password page caused by a runtime reference error in `frontend/src/pages/VendorSetupPasswordPage.jsx`.
- Replaced invalid `disabled` style checks with `loading` state checks in the submit button styling.

### Frontend Auth Bootstrap Adjustment
- Updated `frontend/src/App.jsx` to skip session bootstrap (`GET /api/auth/me`) on public token/auth utility routes:
  - `/setup-password`
  - `/vendor/setup-password`
  - `/vendor/register`
  - `/forgot-password`
  - `/reset-password`
- Result:
  - Opening setup-password links no longer triggers unauthenticated `/api/auth/me` calls.
  - Token-based setup pages render reliably without white-screen crash.

## 2026-04-16 - Login Page Unauthorized Toast Suppression

### Frontend Auth UX Fix
- Fixed duplicate unauthorized error message on login page when no session cookie is present.
- Added request-level global error toast suppression support in `frontend/src/api/client.js` using `suppressErrorToast` config flag.
- Updated session bootstrap call in `frontend/src/App.jsx`:
  - `GET /api/auth/me` now passes `{ suppressErrorToast: true }`.
- Result:
  - Login page no longer shows `You are not authorized to access this resource` for expected unauthenticated bootstrap checks.
  - Prevents duplicate toast behavior often seen in React Strict Mode development renders.

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
