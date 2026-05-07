# Plan - report2

## Trạng thái hiện tại (tính đến khi dừng)

### Đã hoàn thành
- Adapter Odoo cho invoice: `routes/adapter/odoo.js`
  - `getInvoice(code)` trả shape gần giống KiotViet
  - `getAllInvoices()` trả danh sách đơn theo company CRETA
  - customerCode đọc từ `x_kiotviet_1` trên Odoo partner
- Bộ status `B1..B9` đã chuẩn hóa
  - config backend: `app/lib/invoiceStatus.js`
  - config frontend: `public/js/invoice-status.js`
  - normalize mapping từ dữ liệu cũ `1..5` sang `B1..B9`
  - API invoice controller đọc/ghi status theo key mới
- Trang dashboard: `/invoices/dashboard`
  - KPI cards theo `B1..B9`
  - 4 workspace blocks
  - cảnh báo vận hành
  - bảng đơn có filter
  - bộ lọc chu kỳ quan sát theo ngày
- Workspace pages:
  - `/invoices/prepare`: nhóm `B2, B3, B4`
  - `/invoices/package`: nhóm `B4, B5`
  - `/invoices/ship`: nhóm `B6, B7`
- Nav menu mới: `Tổng quan hóa đơn / Chuẩn bị đơn / Đóng hàng / Giao chành / Danh sách hóa đơn`
- Điều hướng từ detail sang workspace tương ứng
- Workspace nhận `?code=HD...` từ URL và auto điền search

### Đã quyết định nhưng chưa làm
- `B10 = Hủy`: nghiệp vụ đã chốt, chưa đưa vào UI
- Rule chuyển trạng thái cứng (guardrails): chưa triển khai
- Workspace `B8 -> B9` (hoàn tất): chưa có trang riêng
- Migration sạch status MongoDB từ `1..5` sang `B1..B9`: chưa chạy

---

## Phase tiếp theo

### Phase 1: Hoàn thiện workspace hóa đơn

**1.1 Thêm workspace hoàn tất `B8 -> B9`**
- route: `/invoices/finish`
- hiển thị đơn `B8, B9`
- thao tác: xác nhận khách đã nhận, xác nhận hoàn thành
- có thể kéo dữ liệu transaction để đối chiếu tiền

**1.2 Guardrails chuyển trạng thái**
Thêm rule vào từng workspace hoặc detail:
- `B4 -> B5`: cần đủ barcode theo số lượng từng line
- `B5 -> B6`: cần có số kiện (`SO_KIEN_HANG` trong `invoice.notes`)
- `B6 -> B7`: cần có ít nhất 1 phiếu giao vận trong `phieus`
- `B8 -> B9`: cần đã ghi nhận thu tiền trong `transactions`

Nếu chưa đáp ứng điều kiện:
- hiển thị cảnh báo rõ
- vẫn cho phép override nếu cần (không chặn cứng 100%)

**1.3 Thêm `B10 = Hủy` vào UI**
- thêm vào config `B1..B9` thành `B1..B10`
- mặc định ẩn đơn hủy trong dashboard
- thêm toggle `Hiện đơn hủy` hoặc tab riêng
- khi Kiot/Odoo trả `status = 2`, map sang `B10`

**1.4 Cột "kẹt bao lâu" trong bảng dashboard**
- tính số giờ/ngày đơn đang ở trạng thái hiện tại
- highlight đơn kẹt quá X giờ
- ưu tiên hiển thị đơn cũ nhất trong mỗi nhóm

---

### Phase 2: Biến `invoice detail` thành control center đúng nghĩa

**2.1 Refactor block status trên detail**
- hiển thị rõ bước hiện tại theo `B1..B9`
- chỉ cho chuyển sang bước kế tiếp, không nhảy bừa
- hiển thị tên người thay đổi cuối và thời gian

**2.2 Block barcode progress**
- với mỗi line trong `invoiceDetails`:
  - hiển thị số lượng cần
  - số barcode đã quét
  - trạng thái: đủ / thiếu / dư
  - màu badge theo tiến độ
- tổng hợp: `X / Y dòng đã đủ hàng`

**2.3 Block đóng hàng**
- số kiện
- người đóng
- thời gian đóng
- ghi chú đóng gói
- lưu vào `invoice.notes` với type `SO_KIEN_HANG`

**2.4 Block giao vận**
- tạo / liệt kê phiếu giao vận
- ghi nhận:
  - đơn vị giao
  - phí ship
  - ứng ship (nếu có)
  - mã vận đơn
  - ghi chú
- lưu vào `phieus`

**2.5 Block thu tiền**
- tổng đơn từ Odoo
- các transaction đã ghi nhận
- trạng thái: chưa thu / thu một phần / đã đủ
- thêm giao dịch mới
- lưu vào `transactions`

---

### Phase 3: Dashboard điều hành nâng cao

**3.1 Cột kẹt theo thời gian thực**
- thêm vào bảng dashboard
- highlight đơn kẹt quá ngưỡng:
  - `B3` quá 1 ngày
  - `B5` quá 4 giờ
  - `B7` quá 2 ngày

**3.2 Nhóm đơn ưu tiên**
- section riêng: `Cần xử lý ngay`
- lọc tự động đơn đang trễ theo quy tắc

**3.3 Thống kê theo chu kỳ**
- số đơn hoàn thành trong chu kỳ
- tỷ lệ đơn đến `B9`
- thời gian trung bình từ `B1` đến `B9`

---

### Phase 4: Dọn dẹp kỹ thuật

**4.1 Migration MongoDB status**
- Khi workflow ổn định, chạy script cập nhật tất cả `invoice.status` cũ `1..5` sang `B1..B9`
- Sau đó bỏ normalize mapping cũ khỏi code

**4.2 Bỏ hoàn toàn phụ thuộc KiotViet**
- Rà tất cả chỗ còn gọi `kiot.js` trực tiếp
- Thay bằng Odoo adapter hoặc MongoDB
- Bỏ preload Kiot trong `app.js`/`kiot.js`

**4.3 Dọn route cũ**
- `/crm` và các route không còn dùng
- Route customer chưa rõ vai trò

---

## Quyết định kỹ thuật cần chốt sau

1. `B9 = Hoàn thành` có cần bắt buộc đã thu đủ tiền hay chỉ là xác nhận vận hành?
2. Sau khi dọn KiotViet, có muốn thêm lớp cache cho invoice list hay vẫn gọi thẳng Odoo?
3. `phieu` và `transaction` có cần liên kết với nhau hay chỉ cần liên kết với `invoice.code`?
4. Có cần thêm nhân sự phụ trách vào từng bước hay chỉ dùng lúc này?

---

## Cấu hình dự án song song

`sync-kiot-odoo` (Python) phải được chạy riêng để dữ liệu invoice trong Odoo luôn mới.

Lịch sync đề xuất:
- `sync-invoices incremental`: mỗi 5 phút
- `sync-products incremental`: mỗi 5 phút
- `sync-customers incremental`: mỗi 30 phút
- `sync-invoices --since YYYY-MM-DD`: chạy tay khi cần backfill

Xem `sync-kiot-odoo/README.md` để biết chi tiết cài đặt.
