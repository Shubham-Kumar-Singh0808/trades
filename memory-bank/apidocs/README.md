# API Docs Maintenance

This folder contains controller-wise API documentation.

## Update Policy
- Every controller in `src/main/java/com/pawfectfoods/trades/controller` must have a matching API doc in this folder.
- When any controller endpoint/signature/path/request/response/security rule changes, update the corresponding API doc in the same change.
- Keep examples executable with cURL.

## Current Mapping
- `AdminUserController.java` -> `AdminUsersAPI.md`
- `AuthenticationController.java` -> `AuthenticationAPI.md`
- `VendorController.java` -> `VendorAPI.md`
- `TradeController.java` -> `TradeAPI.md`
