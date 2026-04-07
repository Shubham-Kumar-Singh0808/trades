# Trade API

Controller: TradeController
Base path: /api/trades

Security by endpoint:
- POST /api/trades: ADMIN, EXECUTIVE
- GET /api/trades: ADMIN, EXECUTIVE, VENDOR
- GET /api/trades/{id}: ADMIN, EXECUTIVE, VENDOR

## 1) Create Trade
- Method: POST
- Path: /api/trades
- Content-Type: multipart/form-data
- Roles: ADMIN, EXECUTIVE
- Use: Create a trade with PDF attachment and notify all active vendors by email.
- Email sends a details URL (no file attachment).

Form fields:
- tradeId (string, unique)
- mode (ONLINE | OFFLINE | HYBRID)
- description (string)
- notificationScope (SELECTED | ALL_ACTIVE | ALL)
- vendorIds (UUID list, required only when notificationScope=SELECTED)
- file (PDF)

cURL:
```bash
curl -X POST "http://localhost:8080/api/trades" \
  -H "Authorization: Bearer <ADMIN_OR_EXECUTIVE_TOKEN>" \
  -F "tradeId=TRD-2026-0001" \
  -F "mode=ONLINE" \
  -F "description=Sample trade for dry food imports" \
  -F "notificationScope=ALL_ACTIVE" \
  -F "file=@D:/docs/trade.pdf;type=application/pdf"
```

Create trade and notify selected vendors only:
```bash
curl -X POST "http://localhost:8080/api/trades" \
  -H "Authorization: Bearer <ADMIN_OR_EXECUTIVE_TOKEN>" \
  -F "tradeId=TRD-2026-0002" \
  -F "mode=OFFLINE" \
  -F "description=Selected vendor notification sample" \
  -F "notificationScope=SELECTED" \
  -F "vendorIds=3fa85f64-5717-4562-b3fc-2c963f66afa6" \
  -F "vendorIds=7b8d6f5e-1a5b-4b83-b577-5b83a212b8a4" \
  -F "file=@D:/docs/trade.pdf;type=application/pdf"
```

Validation:
- only PDF allowed
- max file size enforced by config

## 2) Get All Trades (Paginated)
- Method: GET
- Path: /api/trades?page=0&size=10&sort=createdAt,desc
- Roles: ADMIN, EXECUTIVE, VENDOR
- Use: View paginated trades with sorting.

cURL:
```bash
curl -X GET "http://localhost:8080/api/trades?page=0&size=10&sort=createdAt,desc" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>"
```

## 3) Get Trade By ID
- Method: GET
- Path: /api/trades/{id}
- Roles: ADMIN, EXECUTIVE, VENDOR
- ID format: UUID

cURL:
```bash
curl -X GET "http://localhost:8080/api/trades/52aa2181-68a3-48c6-a5fe-cf0ee1f3b623" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>"
```

## 4) View Trade PDF (Inline)
- Method: GET
- Path: /api/trades/{id}/view
- Roles: ADMIN, EXECUTIVE, VENDOR
- Use: Open PDF in browser tab/viewer.

cURL:
```bash
curl -X GET "http://localhost:8080/api/trades/52aa2181-68a3-48c6-a5fe-cf0ee1f3b623/view" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>"
```

## 5) Download Trade PDF (Watermarked)
- Method: GET
- Path: /api/trades/{id}/download
- Roles: ADMIN, EXECUTIVE, VENDOR
- Use: Download PDF with user watermark.
- Watermark source:
  - if downloader email matches vendor: `vendorName | companyName`
  - otherwise: downloader email

cURL:
```bash
curl -L -X GET "http://localhost:8080/api/trades/52aa2181-68a3-48c6-a5fe-cf0ee1f3b623/download" \
  -H "Authorization: Bearer <ANY_ROLE_TOKEN>" \
  --output trade.pdf
```

## Email Notification Behavior
When a trade is created:
- Recipient selection is controlled by `notificationScope`:
  - `SELECTED`: sends only to provided `vendorIds`
  - `ALL_ACTIVE`: sends to all active vendors
  - `ALL`: sends to all vendors (active and inactive)
- Subject: New Trade Created
- Body includes:
  - tradeId
  - description
  - mode
  - details link URL to frontend trade tab/page

## Example TradeResponse
```json
{
  "id": "52aa2181-68a3-48c6-a5fe-cf0ee1f3b623",
  "tradeId": "TRD-2026-0001",
  "mode": "ONLINE",
  "description": "Sample trade for dry food imports",
  "pdfPath": "/uploads/trades/7abf7de4-23b6-4f6e-9a30-1b8aef77f0bc_trade.pdf",
  "createdAt": "2026-04-04T15:00:00Z",
  "createdBy": "admin@pawfectfoods.com"
}
```
