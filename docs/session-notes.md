# Session Report — Trạng thái sau phiên triển khai dashboard-centric

> File này tóm tắt trạng thái codebase hiện tại trên nhánh `dev`.
> Dùng file này để tiếp tục session mới mà không cần đọc lại toàn bộ lịch sử chat.

---

## Trạng thái hiện tại

- **Repo:** `report2`
- **Branch làm việc:** `dev`
- **Runtime local đang dùng:** `http://10.7.0.2:38655`
- **Entry point chính:** `/invoices/dashboard`
- **Auth:** đã có login/session, session lưu Mongo, giữ đăng nhập qua restart app trong `7 ngày`

---

## Những gì đã đạt được trong phiên này

### 1. Môi trường và runtime

- Dự án đã chạy ổn trên `38655`
- MongoDB đã cấu hình đúng qua `.env`
- Odoo credentials đã được nạp vào `.env`
- Session login đã chuyển sang `connect-mongo`
- Cookie đăng nhập giữ được sau khi restart app

### 2. Auth và users

- Có `/login`
- Có session-based auth
- Có role cơ bản:
  - `admin`
  - `staff`
  - `viewer`
- Có page `/users`
- Có seed admin từ `.env`

### 3. App shell và navigation

- Đã có app shell thống nhất
- Sidebar + topbar dùng chung
- Các route chính trong khu `invoices` đã ăn cùng layout
- Sidebar hiện chia theo nhóm:
  - `Dashboard`
  - `B1 - B4 Xử Lý Đơn`
  - `B5 Trở Đi`
  - `Tra Cứu`

### 4. Dashboard-centric workflow

Dashboard hiện là entry point trung tâm cho vận hành.

Đã làm:

- bỏ đổi trạng thái trực tiếp trên các màn hình chính
- chuyển tư duy sang `phiếu` / `action nghiệp vụ`
- dashboard có cột `Bước tiếp theo`
- dashboard không còn `chu kỳ quan sát`
- dashboard chỉ tập trung đơn còn mở hoặc đơn mới `30 ngày gần nhất`
- mặc định ẩn `B9`, `B10`
- có loading/spinner khi tải dữ liệu chậm
- có nhãn bước `B1 - Mới lên đơn`

### 5. Luồng B1 -> B4 đã có MVP dùng được

Đã có các page / action sau:

- `/invoices/prepare`
  - queue phiếu kiểm tra kho
- `/invoices/warehouse-check?code=...`
  - phiếu kiểm tra kho cho 1 đơn
- `/invoices/shortage`
  - Sale quyết định thiếu hàng
- `/invoices/quick-purchase`
  - danh sách phiếu đặt hàng nhanh, tạo mới trực tiếp, detail độc lập
- `/invoices/quick-receipt`
  - danh sách phiếu nhập hàng nhanh, tạo mới từ nhiều purchase, detail độc lập

Luồng đang dùng:

1. `B1 - Mới lên đơn`
2. mở `Phiếu kiểm tra kho`
3. nếu thiếu hàng:
   - tạo `Quick Purchase` ngay từ `WHC` hoặc yêu cầu Sale đổi đơn
   - `Quick Purchase` có thể sinh `Quick Receipt`
4. quay lại `Phiếu kiểm tra kho` / `invoice reference`
5. xác nhận đủ hàng để sang `B4`

### 6. Reference code + version hóa đơn

- Đã áp dụng `referenceCode` là trung tâm
- ví dụ:
  - `HD020873` là mã tham chiếu
  - `HD020873.01` là version hóa đơn thực tế
- Version active là invoice có hậu tố `.nn` lớn nhất
- `invoice` trong report2 được hiểu là `invoice reference`
- `WHC` resolve theo `referenceCode`, không còn tách phiếu theo từng version invoice
- `activeInvoiceCode` được dùng để bám version nguồn hiện hành
- Khi source invoice đổi version, case giữ workflow status nhưng ghi `invoiceEvent` kiểu `source_invoice_changed`

### 7. invoiceEvents

Đã có collection `invoiceEvents` để log các action chính:

- `warehouse_check_created`
- `warehouse_check_refreshed`
- `warehouse_check_confirmed`
- `warehouse_check_shortage_detected`
- `sale_decision_purchase_more`
- `sale_change_requested`
- `quick_purchase_created`
- `quick_stock_receipt_created`
- `source_invoice_changed`
- `auto_closed_legacy_invoice`

API đọc log:

- `GET /api/invoice-events`

### 8. Chuẩn hóa dữ liệu cũ

Đã thêm script:

- `scripts/normalize-old-invoices.js`

Đã chạy thật:

- cutoff: `2026-04-08`
- source invoices: `4268`
- local states: `9602`
- số state mở cũ được chuyển về `B9`: `2168`

Sau chuẩn hóa:

- `B8: 1098`
- `B4: 84`
- `B1: 71`
- `B5: 3233`
- `B7: 2947`
- `B9: 2168`
- `B3: 1`

---

## Những gì còn dang dở

### 1. Dashboard vẫn chưa hoàn toàn “sạch” về dữ liệu vận hành

- nguồn 30 ngày gần nhất thực tế chỉ khoảng `202` đơn
- nhưng Mongo state cũ vẫn còn nhiều record mở ở:
  - `B5`
  - `B7`
  - `B8`
- cần thêm một vòng report / chuẩn hóa tiếp nếu muốn queue gọn hơn

### 2. Tồn kho Kiot chưa thật sự đáng tin 100%

- logic `Phiếu kiểm tra kho` đã có
- nhưng map tồn Kiot theo mã sản phẩm vẫn cần kiểm tra thêm

### 3. invoiceEvents đã có timeline ở `WHC` và `detail`, nhưng chưa đồng đều cho mọi object con

- `WHC` và `detail` đã render timeline cơ bản
- chưa có timeline riêng cho `Quick Purchase` / `Quick Receipt`

### 4. B5 trở đi vẫn chưa chuyển hoàn toàn sang mô hình phiếu/action

- `Đóng hàng`
- `Giao chành`
- `B8 -> B9`

Hiện các page này còn để tái sử dụng tạm, chưa phải workflow cuối cùng.

---

## Việc hợp lý nhất cho session tiếp theo

1. Chuẩn hóa tiếp `Quick Receipt` / `Quick Purchase` timeline và liên kết chéo
2. Làm report/script tiếp cho các đơn cũ đang treo ở `B5`, `B7`, `B8`
3. Chuẩn hóa sâu hơn logic `B5 -> B9`
4. Kiểm tra lại nguồn tồn kho Kiot để kết luận đủ/thiếu chính xác hơn

---

## Ghi chú ngắn

- Không ưu tiên refactor toàn bộ route cũ trong lúc này
- Trọng tâm hiện tại là dashboard và luồng `B1 -> B4`
- Các page cũ khác giữ lại để tái sử dụng tạm hoặc đóng dần sau
