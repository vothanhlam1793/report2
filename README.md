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

Status nội bộ hóa đơn dùng key `B1 -> B10`:

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
| B10 | Hủy |

Dữ liệu status cũ `1..5` vẫn được hỗ trợ bằng normalize mapping.

## Các trang chính

| Route | Vai trò |
|-------|--------|
| `/invoices/dashboard` | Tổng quan hóa đơn, điểm vào chính |
| `/invoices/prepare` | Phiếu kiểm tra kho / queue `B1-B4` |
| `/invoices/warehouse-check?code=HD...` | Phiếu kiểm tra kho của 1 đơn |
| `/invoices/shortage` | Sale quyết định xử lý thiếu hàng |
| `/invoices/quick-purchase` | Danh sách phiếu đặt hàng nhanh |
| `/invoices/quick-receipt` | Danh sách phiếu nhập hàng nhanh |
| `/invoices/package` | Workspace đóng hàng (`B4-B5`) |
| `/invoices/ship` | Workspace giao chành (`B6-B7`) |
| `/invoices/detail?code=HD...` | Chi tiết và xử lý 1 hóa đơn |
| `/invoices` | Tra cứu hóa đơn cũ |

## Trọng tâm vận hành hiện tại

Dashboard hiện là entry point chính cho toàn bộ luồng `B1 -> B4`.

Nguyên tắc hiện tại:

- Không dùng đổi trạng thái trực tiếp từ UI cho các bước chính
- Điều hướng theo `phiếu` hoặc `action nghiệp vụ`
- `referenceCode` là mã tham chiếu gốc của case hóa đơn
- `invoiceCode` là version đơn thực tế đang xử lý, ví dụ: `HD020873.01`
- Hệ thống chỉ cảnh báo khi đơn đổi version, không khóa cứng workflow

Luồng đang dùng cho `B1 -> B4`:

1. `B1 - Mới lên đơn`
2. Mở `Phiếu kiểm tra kho`
3. Nếu thiếu hàng:
   - chuyển sang trang `Thiếu hàng`
   - Sale chọn `Đổi đơn` hoặc `Đặt hàng`
4. Nếu cần bù tồn:
   - tạo `Phiếu đặt hàng nhanh`
   - tạo `Phiếu nhập hàng nhanh`
5. Quay lại `Phiếu kiểm tra kho`
6. Xác nhận đủ hàng để sang `B4`

## Dashboard hiện tại

- Sidebar đã chia rõ section `B1 - B4 Xử Lý Đơn`
- Có loading/spinner khi tải dữ liệu lớn
- Mặc định chỉ hiển thị:
  - đơn còn mở
  - hoặc đơn chưa có trạng thái nhưng phát sinh trong `30 ngày gần nhất`
- Mặc định ẩn các đơn `B9`, `B10` khỏi queue chính
- Đã bỏ khái niệm `chu kỳ quan sát` khỏi dashboard

## Các phiếu đã có trong hệ thống

### Đã có bản MVP dùng được

- `Phiếu kiểm tra kho`
- `Thiếu hàng` (Sale decision)
- `Phiếu đặt hàng nhanh`
- `Phiếu nhập hàng nhanh`

### Chưa hoàn thiện sâu

- Phiếu đóng hàng có log riêng
- Phiếu giao vận có log riêng
- Workspace `B8 -> B9`

## Logging và audit

Đã có collection `invoiceEvents` để ghi log cho các action chính trong luồng dashboard:

- `warehouse_check_created`
- `warehouse_check_refreshed`
- `warehouse_check_confirmed`
- `warehouse_check_shortage_detected`
- `sale_decision_purchase_more`
- `sale_decision_change_order`
- `quick_purchase_created`
- `quick_stock_receipt_created`
- `auto_closed_legacy_invoice`

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
- Dashboard đã bỏ filter chu kỳ và chuyển sang queue vận hành thực tế
- Đã có spinner/loading cho các page tải dữ liệu chậm
- Đã chuẩn hóa một phần dữ liệu cũ: các state mở quá `30 ngày` đã được tự động đưa về `B9`
- Các workspace `prepare`, `package`, `ship` vẫn còn tồn tại để tái sử dụng, nhưng trọng tâm hiện tại là dashboard + phiếu `B1-B4`
- Rule chuyển trạng thái cứng chưa được triển khai; hệ thống ưu tiên cảnh báo mềm và ghi log
