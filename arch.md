# Architecture - report2

## Tổng quan kiến trúc

```
KiotViet API
    |
    | (sync định kỳ qua cron)
    v
sync-kiot-odoo (Python)
    |
    | (upsert qua JSON-RPC)
    v
Odoo (odoo.creta.vn)        MongoDB (camerangochoang.com:27040/report)
    |                               |
    |  dữ liệu gốc nghiệp vụ       |  dữ liệu vận hành nội bộ
    |  customer, product,           |  invoice.status, notes,
    |  invoice, invoice lines       |  productBarcode, phieu,
    |                               |  transaction, task
    +-----------+-------------------+
                |
                v
          report2 (Node.js / Express)
                |
                v
          Browser (Vue 2 + Backbone)
```

## Vai trò từng thành phần

### sync-kiot-odoo
- Python service chạy trên server riêng
- Đồng bộ KiotViet -> Odoo theo cron
- Có 2 mode: `full` và `incremental`
- Lưu cursor sync ở `.sync_state.json`
- Incremental mặc định mỗi 5 phút qua cron

### Odoo (odoo.creta.vn)
- Nguồn dữ liệu trung tâm cho:
  - `res.partner` (khách hàng, match theo `x_kiotviet_1`)
  - `product.product` (sản phẩm, match theo `x_kiotviet_code`)
  - `sale.order` (hóa đơn, match theo `client_order_ref`)
  - `sale.order.line` (chi tiết hóa đơn)
- Company đang dùng: `CRETA` (id=1)
- Hóa đơn có detail sync từ `2026-04-01` đến nay

### MongoDB (report2)
- Chứa dữ liệu vận hành nội bộ, không có trong Odoo
- Collections chính:
  - `invoices`: trạng thái xử lý đơn hàng (`status`, `notes`, `actions`)
  - `productBarcodes`: barcode thực tế đã quét theo từng line đơn
  - `phieus`: phiếu giao vận, ứng ship
  - `transactions`: thu tiền, đối soát
  - `tasks`: giao việc nội bộ
  - `notes`: ghi chú khách hàng
  - `customers`: metadata khách nội bộ

### report2 (Node.js)
- Express app, port 3000
- Đọc Odoo qua JSON-RPC (`routes/adapter/odoo.js`)
- Đọc/ghi MongoDB qua Mongoose
- Fallback: nếu Odoo không có, gọi thẳng KiotViet API cũ
- Render view bằng EJS, logic frontend dùng Vue 2 + Backbone

## Cấu trúc thư mục quan trọng

```
report2/
├── app/
│   ├── controllers/          CRUD cho MongoDB models
│   ├── lib/
│   │   └── invoiceStatus.js  Config + normalize status B1-B9 (backend)
│   ├── models/               Mongoose schemas
│   └── routes/               Express route modules
├── routes/
│   ├── adapter/
│   │   ├── kiot.js           Kết nối KiotViet API (cũ, fallback)
│   │   └── odoo.js           Kết nối Odoo JSON-RPC (mới, ưu tiên)
│   └── invoices.js           Route cho /invoices/*
├── views/
│   ├── invoices/
│   │   ├── dashboard.ejs     Tổng quan hóa đơn (entry point chính)
│   │   ├── index.ejs         Danh sách hóa đơn
│   │   ├── detail.ejs        Chi tiết + xử lý 1 đơn
│   │   ├── prepare.ejs       Workspace chuẩn bị đơn (B2-B4)
│   │   ├── package.ejs       Workspace đóng hàng (B4-B5)
│   │   └── ship.ejs          Workspace giao chành (B6-B7)
│   └── menu.ejs              Nav chính
└── public/
    └── js/
        └── invoice-status.js Config + helper status B1-B9 (frontend)
```

## Luồng dữ liệu invoice

```
Odoo sale.order + sale.order.line
    |
    | GET /api/kiot/invoices/:code
    | (ưu tiên Odoo, fallback KiotViet)
    v
report2 adapter (routes/adapter/odoo.js)
    |
    | normalize ra shape gần giống KiotViet:
    | { code, purchaseDate, customerCode, customerName, total, invoiceDetails[] }
    v
Frontend (Vue 2)
    |
    | đọc thêm trạng thái nội bộ
    | GET /api/invoices/code/:code (MongoDB)
    v
Hiển thị: invoice_kiot + invoice (Mongo)
```

## Status vận hành hóa đơn

Lưu tại `invoice.status` trong MongoDB:

| Key | Order | Ý nghĩa |
|-----|-------|---------|
| B1  | 1     | Mới lên đơn |
| B2  | 2     | Kiểm tra tồn kho |
| B3  | 3     | Chờ đủ hàng |
| B4  | 4     | Sẵn sàng đóng hàng |
| B5  | 5     | Đã đóng hàng |
| B6  | 6     | Đang giao ra chành |
| B7  | 7     | Đã tới chành |
| B8  | 8     | Khách đã nhận |
| B9  | 9     | Hoàn thành |
| B10 | -     | Hủy (đã định nghĩa, chưa đưa vào UI) |

Mapping dữ liệu cũ (số 1-5 sang key mới):
- `1 -> B1`, `2 -> B4`, `3 -> B5`, `4 -> B7`, `5 -> B8`

Config chung:
- Backend: `app/lib/invoiceStatus.js`
- Frontend: `public/js/invoice-status.js`

## API chính

| Endpoint | Nguồn | Ý nghĩa |
|----------|-------|---------|
| GET `/api/kiot/invoices` | Odoo → KiotViet | Danh sách hóa đơn |
| GET `/api/kiot/invoices/:code` | Odoo → KiotViet | Chi tiết 1 hóa đơn + lines |
| GET `/api/invoices/code/:code` | MongoDB | Trạng thái vận hành nội bộ của đơn |
| GET/POST `/api/invoices` | MongoDB | CRUD trạng thái đơn |
| GET/POST `/api/productBarcodes` | MongoDB | Barcode đã quét |
| GET/POST `/api/phieus` | MongoDB | Phiếu giao vận |
| GET/POST `/api/transactions` | MongoDB | Giao dịch thu tiền |

## Biến môi trường

Xem `.env.example` để biết đầy đủ. Các biến quan trọng:

```
MONGO_URL       MongoDB connection string
ODOO_URL        URL Odoo server
ODOO_DB         Tên database Odoo
ODOO_USERNAME   Tài khoản Odoo
ODOO_PASSWORD   Mật khẩu Odoo
ODOO_COMPANY_NAME  Tên company dùng cho sync (mặc định: CRETA)
KIOT_CLIENT_ID  KiotViet API client id (fallback)
KIOT_CLIENT_SECRET  KiotViet API secret (fallback)
```
