# Authentication API

Controller: `AuthenticationController`
Base path: `/api/auth`
Security: Public endpoints (no JWT required).

## 1) Register
- Method: `POST`
- Path: `/api/auth/register`
- Use: Create a new user account with default role assignment and trigger email verification.
- Common use case: New vendor self-signup flow.

Request body:
```json
{
  "email": "newuser@pawfectfoods.com",
  "password": "StrongPass@123"
}
```

cURL:
```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@pawfectfoods.com",
    "password": "StrongPass@123"
  }'
```

## 2) Login
- Method: `POST`
- Path: `/api/auth/login`
- Use: Authenticate user credentials and set JWT in HttpOnly cookie (`TRADES_AUTH`).
- Common use case: User signs in and uses token for secured endpoints.

Request body:
```json
{
  "email": "admin@pawfectfoods.com",
  "password": "admin@pawfectfoods"
}
```

cURL:
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawfectfoods.com",
    "password": "admin@pawfectfoods"
  }'
```

Example response:
```json
{
  "token": "<JWT_TOKEN>",
  "tokenType": "Bearer",
  "expiresAt": "2026-04-05T06:00:00Z"
}
```

Error response format (standardized):
```json
{
  "timestamp": "2026-04-04T06:40:00Z",
  "status": 403,
  "error": "Forbidden",
  "code": "AUTH_USER_DISABLED",
  "message": "You are not allowed to login. Please contact the admin.",
  "path": "/api/auth/login",
  "details": {}
}
```

Common login errors:
- Disabled user:
  - status: `403`
  - code: `AUTH_USER_DISABLED`
  - message: `You are not allowed to login. Please contact the admin.`
- Email not verified:
  - status: `403`
  - code: `AUTH_EMAIL_NOT_VERIFIED`
- Invalid credentials:
  - status: `401`
  - code: `AUTH_INVALID_CREDENTIALS`

## 3) Vendor Self Registration
- Method: `POST`
- Path: `/api/auth/vendor/register`
- Use: Vendor submits full profile details + password. Account stays inactive until email activation.

Request body:
```json
{
  "name": "John Vendor",
  "companyName": "Pawfect Supplies Pvt Ltd",
  "mobileNo": "9876543210",
  "email": "vendor1@pawfectfoods.com",
  "password": "StrongPass@123"
}
```

## 4) Verify Email
- Method: `GET`
- Path: `/api/auth/verify-email?token={token}`
- Use: Activate account once user clicks verification link.
- Common use case: Email ownership verification during onboarding.

cURL:
```bash
curl -X GET "http://localhost:8080/api/auth/verify-email?token=<VERIFICATION_TOKEN>"
```

## 5) Activate Account (UI Redirect)
- Method: `GET`
- Path: `/api/auth/activate-account?token={token}`
- Use: Verifies token and redirects user to UI login page with activation status query param.
- Success redirect: `http://localhost:4000/login?activation=success`
- Failure redirect: `http://localhost:4000/login?activation=failed`

## 6) Vendor Setup Password
- Method: `POST`
- Path: `/api/auth/setup-password`
- Use: Vendor sets initial password from email invitation (admin-created vendor flow).

Request body:
```json
{
  "token": "<SETUP_TOKEN>",
  "password": "NewStrongPass@123"
}
```

## 7) Logout
- Method: `POST`
- Path: `/api/auth/logout`
- Use: Clears the auth cookie and logs out current session.

cURL:
```bash
curl -X POST "http://localhost:8080/api/auth/logout"
```

## Notes
- Vendor self-registration sends rich HTML activation email with CTA button.
- Admin-created vendor onboarding sends HTML password setup email with CTA button.
- JWT is also accepted from `Authorization: Bearer <token>`, but frontend uses HttpOnly cookie flow.
