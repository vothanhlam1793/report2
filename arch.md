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
  - `invoices`: `invoice reference` nội bộ (`status`, `activeInvoiceCode`, `notes`, `actions`)
  - `warehouseChecks`: phiếu kiểm tra kho theo `referenceCode`
  - `quickPurchaseRequests`: phiếu đặt hàng nhanh độc lập
  - `quickStockReceipts`: phiếu nhập hàng nhanh độc lập
  - `invoiceEvents`: log thao tác nghiệp vụ theo `referenceCode` + `invoiceCode`
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
│   │   ├── prepare.ejs       Queue phiếu kiểm tra kho
│   │   ├── warehouse-check.ejs Phiếu kiểm tra kho của 1 đơn
│   │   ├── shortage.ejs      Sale xử lý thiếu hàng
│   │   ├── quick-purchase.ejs Danh sách phiếu đặt hàng nhanh
│   │   ├── quick-receipt.ejs Danh sách phiếu nhập hàng nhanh
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
| B2  | 2     | Kiểm tra tồn kho xong |
| B3  | 3     | Chờ đủ hàng |
| B4  | 4     | Sẵn sàng đóng hàng |
| B5  | 5     | Đã đóng hàng |
| B6  | 6     | Đang giao ra chành |
| B7  | 7     | Đã tới chành |
| B8  | 8     | Khách đã nhận |
| B9  | 9     | Hoàn thành |
| B10 | 10    | Hủy |

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
| GET `/api/warehouse-checks/invoice/:code` | MongoDB + Odoo + Kiot | Phiếu kiểm tra kho của đơn |
| POST `/api/warehouse-checks/invoice/:code/confirm-enough` | MongoDB | Xác nhận đủ hàng / thiếu hàng |
| POST `/api/warehouse-checks/invoice/:code/shortage-decision` | MongoDB | Sale quyết định đổi đơn / đặt hàng |
| POST `/api/warehouse-checks/invoice/:code/quick-purchase` | MongoDB | Tạo phiếu đặt hàng nhanh |
| POST `/api/warehouse-checks/invoice/:code/quick-receipt` | MongoDB | Tạo phiếu nhập hàng nhanh |
| GET `/api/invoice-events` | MongoDB | Đọc log thao tác nghiệp vụ |
| GET/POST `/api/productBarcodes` | MongoDB | Barcode đã quét |
| GET/POST `/api/phieus` | MongoDB | Phiếu giao vận |
| GET/POST `/api/transactions` | MongoDB | Giao dịch thu tiền |

## Mô hình định danh mới

- `invoice` trong report2 được hiểu là một `invoice reference`, không phải hóa đơn gốc.
- Dữ liệu gốc như chi tiết hàng, khách hàng, tổng tiền được tham chiếu từ Odoo/KiotViet.
- `referenceCode`: mã tham chiếu gốc của case hóa đơn
  - ví dụ: `HD020873`
- `invoiceCode`: mã version thực tế đang xử lý
  - ví dụ: `HD020873.01`
- `activeInvoiceCode`: version nguồn hiện hành của `invoice reference`
  - rule chuẩn: version có hậu tố `.nn` lớn nhất là version active mới nhất

Nguyên tắc vận hành thống nhất:

- Mọi nghiệp vụ nội bộ trong report2 xoay quanh `referenceCode`.
- `invoiceCode` chỉ là version nguồn đang được tham chiếu tại một thời điểm.
- `activeInvoiceCode` là version nguồn hiện hành của case; khi có version `.nn` lớn hơn xuất hiện thì case được repoint sang version đó nhưng không tự reset workflow status.
- `warehouseCheck` là phiếu nghiệp vụ của case theo `referenceCode`.
  - Quy tắc chuẩn: `1 referenceCode = 1 warehouseCheck active`.
- `quickPurchaseRequest`, `quickStockReceipt`, `invoiceEvents` là các document hỗ trợ của cùng `invoice reference`.
- Nếu invoice nguồn đổi version (`.01`, `.02`...), hệ thống không mở case mới, mà cập nhật version tham chiếu trong cùng `referenceCode`.

## Các entity hỗ trợ chính

### Warehouse Check
- Là document kiểm tra kho của `invoice reference`
- Mở từ `invoiceCode` nhưng resolve theo `referenceCode`
- Dữ liệu dòng hàng tham chiếu động từ Odoo khi phiếu chưa `completed`
- Chỉ snapshot dữ liệu khi complete phiếu

### Quick Purchase Request
- Là entity độc lập
- Có thể tạo:
  - từ `WHC` shortage flow
  - trực tiếp từ danh sách `Quick Purchase`
- Trạng thái đang dùng:
  - `created`
  - `ordered`
  - `partially_received`
  - `received`
  - `cancelled`
- Detail có `supplierMessage` để copy gửi nhà cung cấp
- Khi đã `ordered` thì detail bị khóa chỉnh sửa

### Quick Stock Receipt
- Là entity độc lập
- Có thể tham chiếu từ nhiều `Quick Purchase`
- Trạng thái đang dùng:
  - `created`
  - `confirmed`
  - `cancelled`
- Nếu receipt tham chiếu purchase thì `receivedQty` không được nhỏ hơn tổng số lượng purchase tham chiếu
- Khi `confirmed`, purchase liên quan được đồng bộ sang `partially_received` hoặc `received`

Mọi phiếu và log mới đều lưu cả `referenceCode` và `invoiceCode`.

## Dashboard hiện tại

- Dashboard là entry point chính của hệ thống
- Đã bỏ `chu kỳ quan sát`
- Chỉ hiển thị:
  - đơn còn mở
  - hoặc đơn chưa có trạng thái nhưng phát sinh trong `30 ngày gần nhất`
- Mặc định ẩn `B9`, `B10`
- Sidebar chia rõ section `B1 - B4 Xử Lý Đơn`

## Chuẩn UI danh sách

Áp dụng cho các màn danh sách mới và các tính năng sẽ làm sau này:

- Mọi màn danh sách có nhiều bản ghi nên có phân trang client-side hoặc server-side.
- Bộ lựa chọn page size chuẩn:
  - `10`, `20`, `30`, `50`, `100`
- Mặc định page size:
  - `30`
- Các filter và lựa chọn hiển thị nên được lưu bằng `localStorage` để người dùng quay lại vẫn giữ nguyên ngữ cảnh.
- Tối thiểu cần nhớ các lựa chọn sau nếu màn có hỗ trợ:
  - keyword search
  - trạng thái/filter checkbox
  - page size
  - trang hiện tại
- Với filter trạng thái nhiều lựa chọn, ưu tiên dùng checkbox thay vì select một lựa chọn nếu nghiệp vụ thường xuyên cần loại bớt một vài trạng thái.
- Các modal mới nên ưu tiên dùng overlay/state do Vue điều khiển hoặc helper Bootstrap-compatible, tránh phụ thuộc cứng vào `$.fn.modal`.

## Chuẩn hóa dữ liệu cũ

- Đã thêm script: `scripts/normalize-old-invoices.js`
- Mục đích:
  - tìm các `invoice state` còn mở nhưng đơn đã quá `30 ngày`
  - đưa về `B9`
  - ghi `invoiceEvents` kiểu `auto_closed_legacy_invoice`

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
