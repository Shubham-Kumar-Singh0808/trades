# Authentication API

Controller: AuthenticationController
Base path: /api/auth
Security: Public unless specified.

## 1) Register
- Method: POST
- Path: /api/auth/register
- Use: Generic app user registration with email verification flow.

## 2) Login
- Method: POST
- Path: /api/auth/login
- Use: Authenticate user credentials.
- Normal flow: sets JWT HttpOnly cookie (TRADES_AUTH).
- Temporary-credential flow: returns requiresPasswordSetup=true and setupToken.

Request body:
```json
{
  "email": "admin@pawfectfoods.com",
  "password": "admin@pawfectfoods"
}
```

## 3) Vendor GST Lookup
- Method: GET
- Path: /api/auth/vendor/gst-lookup?gstNo={gstNo}
- Use: Return company name and registered address from GST number.
- Used by: Vendor registration UI autofill.

Example response:
```json
{
  "gstNo": "27ABCDE1234F1Z5",
  "companyName": "GST Registered Company ABCDE123",
  "registeredAddress": "Registered Office, State-27, India"
}
```

## 4) Vendor Self Registration
- Method: POST
- Path: /api/auth/vendor/register
- Use: Submit vendor onboarding request with mandatory details and exactly 3 contact persons.
- Behavior:
  - Company name and registered address are derived from GST lookup.
  - Vendor request is created with PENDING_APPROVAL.
  - Login is not enabled until admin approval.

Request body:
```json
{
  "name": "John Vendor",
  "gstNo": "27ABCDE1234F1Z5",
  "officeAddress": "Plot 22, Industrial Area, Pune",
  "email": "vendor1@pawfectfoods.com",
  "password": "StrongPass@123",
  "contactPersons": [
    {
      "name": "Contact One",
      "designation": "Sales Manager",
      "email": "c1@vendor.com",
      "phone": "9876543210"
    },
    {
      "name": "Contact Two",
      "designation": "Operations Lead",
      "email": "c2@vendor.com",
      "phone": "9876543211"
    },
    {
      "name": "Contact Three",
      "designation": "Finance Head",
      "email": "c3@vendor.com",
      "phone": "9876543212"
    }
  ]
}
```

## 5) Verify Email
- Method: GET
- Path: /api/auth/verify-email?token={token}
- Use: Email verification for token-driven flows.

## 6) Activate Account (UI Redirect)
- Method: GET
- Path: /api/auth/activate-account?token={token}
- Use: Verifies token and redirects to frontend login with activation status query params.

## 7) Setup Password
- Method: POST
- Path: /api/auth/setup-password
- Use: Set password for setup-token users.

## 8) Forgot Password
- Method: POST
- Path: /api/auth/forgot-password

## 9) Reset Password
- Method: POST
- Path: /api/auth/reset-password

## 10) Logout
- Method: POST
- Path: /api/auth/logout

## 11) Current Session
- Method: GET
- Path: /api/auth/me
- Security: authenticated

## 12) Update Profile
- Method: POST
- Path: /api/auth/me/profile
- Security: authenticated
- Behavior: vendor users cannot directly update profile here; vendor updates must go through vendor change-request workflow.
