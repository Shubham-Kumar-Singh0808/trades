# Admin Users API

Controller: `AdminUserController`
Base path: `/api/admin/users`
Security: `ROLE_ADMIN` required for all endpoints in this controller.

## 1) Create User
- Method: `POST`
- Path: `/api/admin/users`
- Use: Admin creates a platform user and assigns one or more roles.
- Common use case: Operations/admin onboarding a vendor or executive account.

Request body:
```json
{
  "email": "vendor1@pawfectfoods.com",
  "password": "StrongPass@123",
  "roles": ["VENDOR"],
  "enabled": true
}
```

cURL:
```bash
curl -X POST "http://localhost:8080/api/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "email": "vendor1@pawfectfoods.com",
    "password": "StrongPass@123",
    "roles": ["VENDOR"],
    "enabled": true
  }'
```

## 2) Assign/Update Roles
- Method: `PUT`
- Path: `/api/admin/users/{userId}/roles`
- Use: Replace a user\'s current roles with a new role set.
- Common use case: Promoting a user from VENDOR to EXECUTIVE, or granting ADMIN.
- `userId` format: UUID (example: `3fa85f64-5717-4562-b3fc-2c963f66afa6`)

Request body:
```json
{
  "roles": ["EXECUTIVE", "VENDOR"]
}
```

cURL:
```bash
curl -X PUT "http://localhost:8080/api/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "roles": ["EXECUTIVE", "VENDOR"]
  }'
```

## 3) Enable/Disable User
- Method: `PUT`
- Path: `/api/admin/users/{userId}/status`
- Use: Enable or disable login access for a specific user.
- Common use case: Temporarily suspending a compromised or inactive account.
- `userId` format: UUID (example: `3fa85f64-5717-4562-b3fc-2c963f66afa6`)

Request body:
```json
{
  "enabled": false
}
```

cURL:
```bash
curl -X PUT "http://localhost:8080/api/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "enabled": false
  }'
```

## 4) List Users
- Method: `GET`
- Path: `/api/admin/users?page=0&size=10&sort=email,asc`
- Use: Fetch all users with account status and assigned roles.
- Common use case: Admin user management screen/table.
- Pagination: supported via `page`, `size`
- Sorting: supported via `sort` (example fields: `email`, `enabled`, `emailVerified`)

cURL:
```bash
curl -X GET "http://localhost:8080/api/admin/users?page=0&size=10&sort=email,asc" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

## Expected Response Shape (UserResponse)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "vendor1@pawfectfoods.com",
  "enabled": true,
  "emailVerified": true,
  "roles": ["VENDOR"]
}
```
