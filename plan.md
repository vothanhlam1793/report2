# Plan - report2

## Trạng thái hiện tại (tính đến khi dừng)

### Đã hoàn thành
- Adapter Odoo cho invoice: `routes/adapter/odoo.js`
  - `getInvoice(code)` trả shape gần giống KiotViet
  - `getAllInvoices()` trả danh sách đơn theo company CRETA
  - customerCode đọc từ `x_kiotviet_1` trên Odoo partner
- Bộ status `B1..B10` đã chuẩn hóa
  - config backend: `app/lib/invoiceStatus.js`
  - config frontend: `public/js/invoice-status.js`
  - normalize mapping từ dữ liệu cũ `1..5` sang `B1..B9`
  - API invoice controller đọc/ghi status theo key mới
- Dashboard entry point: `/invoices/dashboard`
  - KPI cards theo `B1..B10`
  - bảng đơn có filter theo `Trạng thái / Loại xử lý / Search`
  - cột `Bước tiếp theo`
  - loading/spinner khi tải dữ liệu
  - mặc định chỉ hiển thị đơn còn mở hoặc đơn mới `30 ngày gần nhất`
  - mặc định ẩn `B9`, `B10`
  - đã bỏ `chu kỳ quan sát`
- Sidebar đã đổi trọng tâm theo loại phiếu/xử lý:
  - `B1 - B4 Xử Lý Đơn`
  - `B5 Trở Đi`
  - `Tra Cứu`
- Luồng `B1 -> B4` đã có bản MVP dùng được:
  - `/invoices/prepare`: queue phiếu kiểm tra kho
  - `/invoices/warehouse-check?code=...`: phiếu kiểm tra kho của 1 đơn
  - `/invoices/shortage`: Sale xử lý thiếu hàng
  - `/invoices/quick-purchase`: list/detail entity đặt hàng nhanh
  - `/invoices/quick-receipt`: list/detail entity nhập hàng nhanh
- `referenceCode` đã được áp dụng để gom các version hóa đơn như `.01`, `.02`
- version active của case là invoice có hậu tố `.nn` lớn nhất
- `invoice` trong report2 được hiểu là `invoice reference`
- `warehouseCheck` đã chuyển sang `referenceCode-centric`
- Đã có `invoiceEvents` cho luồng dashboard `B1 -> B4`
- Đã chuẩn hóa dữ liệu cũ:
  - script `scripts/normalize-old-invoices.js`
  - auto đóng `2168` state mở quá `30 ngày` về `B9`

### Đã quyết định nhưng chưa làm hết
- Rule chuyển trạng thái cứng (guardrails): chưa triển khai
- Workspace `B8 -> B9` (hoàn tất): chưa có trang riêng
- Chưa có timeline riêng cho `Quick Purchase` / `Quick Receipt`
- Chưa có list/detail chuẩn hóa cho phiếu đóng hàng và giao vận

---

## Phase tiếp theo

### Phase 1: Hoàn thiện luồng dashboard-centric

**1.1 Timeline xử lý trên Phiếu kiểm tra kho / Detail**
- hiển thị `invoiceEvents` thành timeline dễ đọc
- thấy rõ:
  - ai tạo phiếu kho
  - ai chọn thiếu hàng
  - lúc nào tạo đặt hàng nhanh / nhập hàng nhanh
  - lúc nào auto-close dữ liệu cũ

**1.2 Chuẩn hóa dữ liệu mở còn lại**
- rà tiếp các đơn đang ở `B5`, `B7`, `B8` nhưng đã quá cũ
- bổ sung report phân loại trước khi auto đẩy về `B9` hoặc `B10`
- cân nhắc script riêng cho `B10` nếu xác định được logic hủy

**1.3 Hiển thị số lượng queue ngay trên sidebar/dashboard**
- badge số lượng cho:
  - `Thiếu hàng`
  - `Phiếu đặt hàng nhanh`
  - `Phiếu nhập hàng nhanh`

**1.4 Hoàn thiện page list cho phiếu nhanh**
- thêm search/filter
- link ngược về `warehouse-check`
- `Quick Purchase`:
  - `created / ordered / partially_received / received / cancelled`
- `Quick Receipt`:
  - `created / confirmed / cancelled`
- `Quick Purchase` có `supplierMessage`, nút `Đã đặt hàng`, lock chỉnh sửa sau khi ordered
- `Quick Receipt` có thể tham chiếu từ nhiều `Quick Purchase`

---

### Phase 2: B5 trở đi

**2.1 Thêm workspace hoàn tất `B8 -> B9`**
- route: `/invoices/finish`
- hiển thị đơn `B8, B9`
- thao tác: xác nhận khách đã nhận, xác nhận hoàn thành
- có thể kéo dữ liệu transaction để đối chiếu tiền

**2.2 Guardrails chuyển trạng thái**
Thêm rule vào từng workspace hoặc detail:
- `B4 -> B5`: cần đủ barcode theo số lượng từng line
- `B5 -> B6`: cần có số kiện (`SO_KIEN_HANG` trong `invoice.notes`)
- `B6 -> B7`: cần có ít nhất 1 phiếu giao vận trong `phieus`
- `B8 -> B9`: cần đã ghi nhận thu tiền trong `transactions`

Nếu chưa đáp ứng điều kiện:
- hiển thị cảnh báo rõ
- vẫn cho phép override nếu cần (không chặn cứng 100%)

**2.3 Mở rộng UI cho `B10 = Hủy`**
- mặc định ẩn đơn hủy trong dashboard
- thêm toggle `Hiện đơn hủy` hoặc tab riêng
- khi Kiot/Odoo trả `status = 2`, map sang `B10`

**2.4 Cột "kẹt bao lâu" trong bảng dashboard**
- tính số giờ/ngày đơn đang ở trạng thái hiện tại
- highlight đơn kẹt quá X giờ
- ưu tiên hiển thị đơn cũ nhất trong mỗi nhóm

---

### Phase 3: Biến `invoice detail` thành control center đúng nghĩa

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

### Phase 4: Dashboard điều hành nâng cao

**3.1 Cột kẹt theo thời gian thực**
- thêm vào bảng dashboard
- highlight đơn kẹt quá ngưỡng:
  - `B3` quá 1 ngày
  - `B5` quá 4 giờ
  - `B7` quá 2 ngày

**3.2 Nhóm đơn ưu tiên**
- section riêng: `Cần xử lý ngay`
- lọc tự động đơn đang trễ theo quy tắc

**4.3 Thống kê theo phạm vi thực tế**
- số đơn mở hiện tại
- số đơn thiếu hàng đang chờ Sale
- số phiếu đặt hàng nhanh / nhập hàng nhanh đang mở
- thời gian trung bình từ `B1` đến `B4`

---

### Phase 5: Dọn dẹp kỹ thuật

**5.1 Migration MongoDB status**
- Khi workflow ổn định, chạy script cập nhật tất cả `invoice.status` cũ `1..5` sang `B1..B9`
- Sau đó bỏ normalize mapping cũ khỏi code

**5.2 Bỏ hoàn toàn phụ thuộc KiotViet**
- Rà tất cả chỗ còn gọi `kiot.js` trực tiếp
- Thay bằng Odoo adapter hoặc MongoDB
- Bỏ preload Kiot trong `app.js`/`kiot.js`

**5.3 Dọn route cũ**
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

---

## Kế hoạch Odoo: supplier hints từ report

### Mục tiêu
- Không tiếp tục phụ thuộc vào việc ghi `orderTemplate` ngược về KiotViet vì Public API không update được field này.
- Đưa dữ liệu gợi ý NCC từ file `sync-history/reports/supplier-sync-1778259591-write.json` lên Odoo.
- Lưu dữ liệu trên model `product.product` vào custom field `x_supplier_hints`.

### Bối cảnh đã xác minh
- Kết nối Odoo JSON-RPC trong `.env` hoạt động.
- Adapter Odoo hiện tại của `report2` đang đọc sản phẩm qua model `product.product`.
- Có thể map sản phẩm Odoo theo `default_code = productCode`.
- Report `supplier-sync-1778259591-write.json` hiện có `2049` record thay đổi.
- Mã test đã xác minh trên Odoo:
  - `default_code = SP901470`
  - `product.product.id = 3177`
  - `name = IPC-PS7FP-3M0-IMOU`
- Dữ liệu cần ghi lên Odoo là `results[].nextOrderTemplate`.

### Kết quả mong muốn
- Odoo có field custom `x_supplier_hints` trên `product.product`.
- Với từng sản phẩm match theo `default_code`, field `x_supplier_hints` chứa nội dung gợi ý NCC từ report.
- Bắt đầu bằng test đúng `SP901470`, sau đó mới bulk toàn bộ.

### Kế hoạch thực hiện
1. Vào server Odoo với tài khoản có quyền kỹ thuật hoặc admin.
2. Kiểm tra field `x_supplier_hints` đã tồn tại trên `product.product` chưa.
3. Nếu chưa có, tạo custom field:
   - model: `product.product`
   - technical name: `x_supplier_hints`
   - label: `Supplier Hints`
   - type: `Text`
   - state: `manual`
4. Xác minh field mới có thể đọc/ghi qua JSON-RPC.
5. Đọc file `sync-history/reports/supplier-sync-1778259591-write.json`.
6. Với mỗi record trong `results`:
   - lấy `productCode`
   - map sang Odoo bằng `product.product.default_code`
   - lấy `nextOrderTemplate`
7. Chỉ update các record có:
   - `action` là `append` hoặc `replace`
   - `nextOrderTemplate` không rỗng
8. Chạy thử trước cho đúng `SP901470`.
9. Đọc lại Odoo để xác minh giá trị sau update.
10. Nếu test đúng ý, chạy bulk toàn bộ file report.
11. Ghi log kết quả bulk:
   - tổng số record trong report
   - số sản phẩm tìm thấy trên Odoo
   - số update thành công
   - số không tìm thấy
   - số lỗi

### Quy tắc map dữ liệu
- Nguồn: `results[].productCode`
- Đích: `product.product.default_code`
- Giá trị ghi: `results[].nextOrderTemplate`
- Field đích: `x_supplier_hints`

### Quy tắc an toàn
- Chỉ test `SP901470` trước khi bulk.
- Nếu một `default_code` match nhiều `product.product`, dừng record đó và log lỗi.
- Không tự ghi đè các record không map rõ ràng.
- Giữ log audit cho toàn bộ đợt sync.

### Việc có thể làm tiếp sau khi upload xong
1. Sửa `routes/adapter/odoo.js` để đọc thêm `x_supplier_hints`.
2. Hiển thị `x_supplier_hints` trong UI nơi đang cần gợi ý NCC.
3. Chọn nguồn ưu tiên cho supplier hints:
   - Odoo `x_supplier_hints`
   - fallback KiotViet `orderTemplate`
   - hoặc hiển thị đồng thời cả hai
