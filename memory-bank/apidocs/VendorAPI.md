# Vendor API

Controller: VendorController
Base path: /api/vendors

Security by endpoint:
- ADMIN: full access
- EXECUTIVE: create and view
- VENDOR: view only

## 1) Create Vendor
- Method: POST
- Path: /api/vendors
- Roles: ADMIN, EXECUTIVE
- Use: Create a new vendor account profile and send password-setup email invitation.
- Use case: Onboard a new vendor company before trade notifications.

Behavior notes:
- Vendor is created as inactive until password setup is completed.
- Backend also creates corresponding app user with VENDOR role.
- Invitation email contains setup link to UI: `/vendor/setup-password?token=...`.

Request body:
```json
{
  "name": "John Vendor",
  "companyName": "Pawfect Supplies Pvt Ltd",
  "mobileNo": "9876543210",
  "email": "vendor1@pawfectfoods.com"
}
```

cURL:
```bash
curl -X POST "http://localhost:8080/api/vendors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_OR_EXECUTIVE_TOKEN>" \
  -d '{
    "name": "John Vendor",
    "companyName": "Pawfect Supplies Pvt Ltd",
    "mobileNo": "9876543210",
    "email": "vendor1@pawfectfoods.com"
  }'
```

## 2) Get All Vendors (Paginated)
- Method: GET
- Path: /api/vendors?page=0&size=10&sort=name,asc
- Roles: ADMIN, EXECUTIVE, VENDOR
- Use: Fetch vendors page-by-page with sorting.
- Supported sort fields: name, companyName, createdAt

cURL:
```bash
curl -X GET "http://localhost:8080/api/vendors?page=0&size=10&sort=companyName,asc" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>"
```

## 3) Get Vendor By ID
- Method: GET
- Path: /api/vendors/{id}
- Roles: ADMIN, EXECUTIVE, VENDOR
- ID format: UUID

cURL:
```bash
curl -X GET "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>"
```

## 4) Update Vendor
- Method: PUT
- Path: /api/vendors/{id}
- Roles: ADMIN
- Use: Modify vendor profile fields.

cURL:
```bash
curl -X PUT "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "name": "Updated Vendor",
    "companyName": "Updated Company",
    "mobileNo": "9999999999",
    "email": "vendor1@pawfectfoods.com"
  }'
```

## 5) Delete Vendor
- Method: DELETE
- Path: /api/vendors/{id}
- Roles: ADMIN
- Use: Remove vendor and its sub-vendors.

cURL:
```bash
curl -X DELETE "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## 6) Add SubVendor
- Method: POST
- Path: /api/vendors/{id}/subvendors
- Roles: ADMIN, EXECUTIVE
- Constraint: Maximum 3 sub-vendors per vendor.

Request body:
```json
{
  "name": "Sub Vendor 1",
  "companyName": "Sub Company",
  "contactNo": "8888888888"
}
```

cURL:
```bash
curl -X POST "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6/subvendors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_OR_EXECUTIVE_TOKEN>" \
  -d '{
    "name": "Sub Vendor 1",
    "companyName": "Sub Company",
    "contactNo": "8888888888"
  }'
```

## 7) Activate Vendor
- Method: PATCH
- Path: /api/vendors/{id}/activate
- Roles: ADMIN

cURL:
```bash
curl -X PATCH "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6/activate" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## 8) Deactivate Vendor
- Method: PATCH
- Path: /api/vendors/{id}/deactivate
- Roles: ADMIN

cURL:
```bash
curl -X PATCH "http://localhost:8080/api/vendors/3fa85f64-5717-4562-b3fc-2c963f66afa6/deactivate" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Example VendorResponse
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "John Vendor",
  "companyName": "Pawfect Supplies Pvt Ltd",
  "mobileNo": "9876543210",
  "email": "vendor1@pawfectfoods.com",
  "active": true,
  "createdAt": "2026-04-04T14:30:00Z",
  "subVendors": [
    {
      "id": "7b8d6f5e-1a5b-4b83-b577-5b83a212b8a4",
      "name": "Sub Vendor 1",
      "companyName": "Sub Company",
      "contactNo": "8888888888"
    }
  ]
}
```
