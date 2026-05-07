# report2

`report2` là hệ thống vận hành nội bộ của CRETA, dùng để theo dõi khách hàng, hóa đơn, xử lý đơn hàng, barcode, đóng hàng, giao vận và thu tiền.

Dự án hiện đang được phát triển lại theo hướng lấy Odoo làm nguồn dữ liệu trung tâm cho hóa đơn, đồng thời tiếp tục giữ MongoDB riêng để lưu trạng thái vận hành nội bộ.

## Mục tiêu hiện tại

- Bỏ dần phụ thuộc trực tiếp vào KiotViet trong luồng xử lý hóa đơn
- Dùng Odoo làm nguồn dữ liệu chính cho:
  - khách hàng
  - sản phẩm
  - hóa đơn
  - chi tiết hóa đơn
- Dùng MongoDB của `report2` cho dữ liệu vận hành:
  - trạng thái xử lý hóa đơn
  - barcode đã quét
  - phiếu giao vận / ứng ship
  - transaction / thu tiền
  - task / note nội bộ

## Công nghệ

- Node.js + Express
- EJS templates
- Vue 2 trên frontend
- Backbone models cho một số luồng cũ
- MongoDB + Mongoose
- Odoo JSON-RPC adapter
- KiotViet adapter cũ vẫn giữ làm fallback

## Luồng dữ liệu chính

```
KiotViet -> sync-kiot-odoo -> Odoo -> report2 UI
                              |
MongoDB report2 --------------+
```

- `sync-kiot-odoo` chạy cron để đồng bộ KiotViet sang Odoo
- `report2` đọc invoice từ Odoo qua endpoint cũ `/api/kiot/invoices...`
- `report2` vẫn lưu status và dữ liệu vận hành nội bộ trong MongoDB

## Status hóa đơn mới

Status nội bộ hóa đơn dùng key `B1 -> B9`:

| Key | Tên |
|-----|-----|
| B1 | Mới lên đơn |
| B2 | Kiểm tra tồn kho |
| B3 | Chờ đủ hàng |
| B4 | Sẵn sàng đóng hàng |
| B5 | Đã đóng hàng |
| B6 | Đang giao ra chành |
| B7 | Đã tới chành |
| B8 | Khách đã nhận |
| B9 | Hoàn thành |

`B10 = Hủy` đã được ghi nhận về nghiệp vụ nhưng chưa đưa vào UI hiện tại.

Dữ liệu status cũ `1..5` vẫn được hỗ trợ bằng normalize mapping.

## Các trang chính

| Route | Vai trò |
|-------|--------|
| `/invoices/dashboard` | Tổng quan hóa đơn, điểm vào chính |
| `/invoices` | Danh sách hóa đơn cũ |
| `/invoices/detail?code=HD...` | Chi tiết và xử lý 1 hóa đơn |
| `/invoices/prepare` | Workspace chuẩn bị đơn (`B2-B4`) |
| `/invoices/package` | Workspace đóng hàng (`B4-B5`) |
| `/invoices/ship` | Workspace giao chành (`B6-B7`) |

## Khởi chạy local

```bash
npm install
npm start
```

App mặc định chạy ở:

```bash
http://127.0.0.1:3000
```

Trang nên mở đầu tiên:

```bash
http://127.0.0.1:3000/invoices/dashboard
```

## Biến môi trường

Tạo `.env` dựa theo `.env.example`.

Các nhóm cấu hình chính:

```bash
# MongoDB
MONGO_URL=
MONGO_USER=
MONGO_PASS=

# KiotViet fallback
KIOT_CLIENT_ID=
KIOT_CLIENT_SECRET=
KIOT_RETAILER=cretasolu

# Odoo source
ODOO_URL=https://odoo.creta.vn
ODOO_DB=creta
ODOO_USERNAME=
ODOO_PASSWORD=
ODOO_COMPANY_NAME=CRETA
```

## Các file nên đọc trước khi phát triển tiếp

- `arch.md` - kiến trúc hệ thống
- `plan.md` - hướng phát triển tiếp theo
- `app/lib/invoiceStatus.js` - status B1-B9 phía backend
- `public/js/invoice-status.js` - status B1-B9 phía frontend
- `routes/adapter/odoo.js` - adapter đọc Odoo
- `views/invoices/dashboard.ejs` - dashboard điều hành hóa đơn
- `views/invoices/detail.ejs` - trang chi tiết hóa đơn

## Ghi chú hiện trạng

- Odoo đã có invoice detail từ `2026-04-01` đến nay
- Trang dashboard đã có filter theo chu kỳ quan sát
- Các workspace `prepare`, `package`, `ship` đã có bản đầu tiên
- Rule chuyển trạng thái cứng chưa được triển khai
- `B10 Hủy` chưa đưa vào UI
