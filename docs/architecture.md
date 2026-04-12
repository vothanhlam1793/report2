# Kiến trúc hệ thống — report.creta.vn

## Tổng quan

Web app quản lý nội bộ Creta: CRM, hóa đơn KiotViet, nhập barcode sản phẩm.

---

## Server Map

| Server | IP Public | VPN IP | Vai trò |
|---|---|---|---|
| SVR5 (`svr3.creta.vn`) | 160.250.186.124 | — | Chạy Docker REPORT + Node-RED |
| SVR12 (`node.creta.vn`) | 160.250.186.95 | 10.7.0.10 | Nginx reverse proxy ra internet |
| Orion | — | 10.7.0.2 | Node-RED barcode receiver, MediaMTX |
| NH-3 | 160.250.186.70 | 10.7.0.1 | WireGuard VPN server |

---

## Domain Map

| Domain | Trỏ về | Thực chất |
|---|---|---|
| `report.creta.vn` | SVR5 160.250.186.124 | Nginx → Docker REPORT port 30004 |
| `node.creta.vn` | SVR12 160.250.186.95 | Nginx → Orion 10.7.0.2:1888 (qua VPN) |
| `svr3.creta.vn` | SVR5 160.250.186.124 | Trực tiếp port 1888 (Node-RED SVR5) |
| `node.creta.work` | **CHẾT** | Server cũ, không dùng nữa |
| `data.creta.work` | **CHẾT** | Server cũ, không dùng nữa |
| `creta.link` | **CHẾT** | Short link service cũ, đã xoá |

---

## Docker Containers trên SVR5

| Container | Image | Port | Vai trò |
|---|---|---|---|
| REPORT | vothanhlam1793/report:latest | 30004→3000 | Web app chính |
| node-1889-node-red-1 | vothanhlam1793/node-red:1 | 1888→1880 | Node-RED (barcode relay) |
| n8n-n8n-1 | — | — | Automation |
| meilisearch_creta_vn | — | — | Search engine |

---

## Luồng Barcode (Thiết bị vật lý)

```
[Thiết bị scan barcode]
        |
        | HTTP POST /barcode
        v
[Orion 10.7.0.2:1888 — Node-RED]
        |
        | WebSocket client
        | ws://svr3.creta.vn:1888/barcode_in
        v
[SVR5 :1888 — Node-RED]
  /barcode_in (websocket in)
        |
  xử lý → parse JSON {code: "..."}
        |
  /scan_barcode (websocket out)
        v
[Browser — /invoices/detail?code=HD...]
  wss://node.creta.vn/scan_barcode
  → f1(code) → add_barcode()
```

## Luồng Barcode (Camera điện thoại)

```
[Người dùng vào /invoices/detail?code=HD...]
        |
        | Bấm "Nhập code" trên sản phẩm
        v
[/invoices/barcode/:invoiceCode/:productCode]
  barcode.ejs + barcodeApp2.js
        |
        | Html5Qrcode — camera sau điện thoại
        | HOẶC nhập tay + Enter
        v
[POST /api/productBarcode/...]
  Lưu vào MongoDB
```

---

## Data Sources

| Nguồn | Endpoint | Dữ liệu |
|---|---|---|
| KiotViet API | `public.kiotapi.com` | Khách hàng, hóa đơn |
| MongoDB | `camerangochoang.com:27040/report` | Barcode, task, note, phiếu... |
| Google Sheets | Apps Script URL (xem .env) | Dữ liệu telesale, báo hành |

---

## Biến môi trường quan trọng

Xem `.env.example` — không bao giờ commit `.env` lên Git.

File env trên server: `/root/.env.report` (dùng khi `docker run --env-file`)

---

## WebSocket URLs (quan trọng)

| Dùng cho | URL đúng | URL cũ (chết) |
|---|---|---|
| Barcode scan từ thiết bị | `wss://node.creta.vn/scan_barcode` | `ws://node.creta.work:1888/scan_barcode` |
| Barcode in relay (Orion→SVR5) | `ws://svr3.creta.vn:1888/barcode_in` | — |
