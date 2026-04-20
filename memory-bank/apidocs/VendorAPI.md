# Vendor API

Controller: VendorController
Base path: /api/vendors

Security by endpoint:
- ADMIN: full access including registration approval
- EXECUTIVE: view/create and review requests
- VENDOR: view and submit own change requests

## 1) Create Vendor (Admin/Executive)
- Method: POST
- Path: /api/vendors
- Roles: ADMIN, EXECUTIVE
- Use: Internal vendor creation with invitation setup flow.

## 2) Get All Vendors
- Method: GET
- Path: /api/vendors?page=0&size=10&sort=name,asc
- Roles: ADMIN, EXECUTIVE, VENDOR

## 3) Get Pending Registration Requests
- Method: GET
- Path: /api/vendors/registration-requests
- Roles: ADMIN, EXECUTIVE
- Use: Executive/admin can review pending vendor registrations.

## 4) Approve Vendor Registration
- Method: PATCH
- Path: /api/vendors/{id}/registration/approve
- Roles: ADMIN
- Use: Final approval. Activates vendor login and sends success email.

## 5) Reject Vendor Registration
- Method: PATCH
- Path: /api/vendors/{id}/registration/reject
- Roles: ADMIN
- Request body (optional):
```json
{
  "reason": "Documents mismatch"
}
```

## 6) Submit Vendor Profile Change Request
- Method: POST
- Path: /api/vendors/me/change-request
- Roles: VENDOR
- Use: Vendor requests changes to profile/contact persons; changes apply only after approval.

Request body:
```json
{
  "name": "Updated Vendor Name",
  "email": "vendor1@pawfectfoods.com",
  "officeAddress": "Updated office address",
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

## 7) List Vendor Profile Change Requests
- Method: GET
- Path: /api/vendors/change-requests?status=PENDING
- Roles: ADMIN, EXECUTIVE

## 8) Approve Vendor Profile Change Request
- Method: PATCH
- Path: /api/vendors/change-requests/{requestId}/approve
- Roles: ADMIN, EXECUTIVE
- Request body (optional):
```json
{
  "reason": "Approved after review"
}
```

## 9) Reject Vendor Profile Change Request
- Method: PATCH
- Path: /api/vendors/change-requests/{requestId}/reject
- Roles: ADMIN, EXECUTIVE
- Request body (optional):
```json
{
  "reason": "Need corrected contact email"
}
```

## 10) Existing Vendor Operations
- GET /api/vendors/{id}
- PUT /api/vendors/{id} (ADMIN)
- DELETE /api/vendors/{id} (ADMIN)
- POST /api/vendors/{id}/subvendors (ADMIN, VENDOR-own)
- PUT /api/vendors/{id}/subvendors/{subVendorId} (ADMIN, VENDOR-own)
- PATCH /api/vendors/{id}/activate (ADMIN)
- PATCH /api/vendors/{id}/deactivate (ADMIN)

## VendorResponse fields (updated)
- id, name, companyName
- gstNo, registeredAddress, officeAddress
- mobileNo, email, active
- registrationStatus, rejectionReason, createdAt
- contactPersons[]
- subVendors[]
