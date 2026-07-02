# P24 Yêu cầu nâng cấp report.creta.vn

> Ngày: 2026-07-02
> Nguồn: creta-task-recurring (P1-DEV #2 + P24-PREFECT AUTO flows)
> Repo: github.com/vothanhlam1793/report2 (branch master, commit dee46b2)
> Deploy hiện tại: SVR5 Docker (image: vothanhlam1793/report:20260505201828)

---

## Tổng quan

report.creta.vn cần 2 thứ:
1. **Tính năng upload ảnh** — Hữu đóng hàng xong chụp ảnh dán Cú → upload vào hóa đơn
2. **API endpoints** — Cho 4 AUTO flow của P24-PREFECT đọc dữ liệu

---

## A. TÍNH NĂNG UPLOAD ẢNH (Module #2)

### Mục đích
Hữu là người đóng hàng, dán Cú (sticker), chụp ảnh kiện hàng đã đóng gói, upload vào hóa đơn tương ứng.

### Vị trí
Trang chi tiết hóa đơn — mục Kho — thêm section "Ảnh đóng hàng".

### Yêu cầu kỹ thuật

#### API (3 endpoints)

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/invoices/:id/images` | Upload ảnh (multipart: `file`) → `{id, url}` |
| GET | `/api/invoices/:id/images` | Danh sách ảnh của hóa đơn |
| DELETE | `/api/invoices/:id/images/:image_id` | Xóa ảnh |

#### DB changes (MongoDB)

```
 invoices collection:
   + has_images: Boolean (default: false)

 invoice_images collection (mới):
   + invoice_id: ObjectId (ref invoices)
   + url: String
   + uploaded_by: ObjectId (ref users)
   + created_at: Date
```

#### Logic
- Ảnh ≤10MB, jpg/png/webp
- Lưu vào thư mục uploads hoặc GridFS
- Upload xong → set `invoices.has_images = true`
- Script AUTO check dán Cú chỉ cần query: `invoices.find({ has_images: false, date: today })`

#### Frontend
- Ant Design `Upload` với `listType="picture-card"`
- Click ảnh → xem full (Image preview)
- Nút xóa trên mỗi ảnh
- Chỉ Hữu có quyền upload

#### Deploy
Không cần deploy mới — thêm API route + migration + build lại frontend.

---

## B. API CHO P24-PREFECT AUTO FLOWS

4 flow AUTO chạy trên Prefect (Docker) cần gọi API report.creta.vn để lấy dữ liệu:

### Flow #1 — Check SN (T2→T7, 16:45)

**Cần:** API lấy danh sách hóa đơn trong Kho + chi tiết số lượng vs số SN đã quét.

```
GET /api/invoices/kho?date=YYYY-MM-DD

Response:
[
  {
    "id": "...",
    "code": "HD020873",
    "items": [
      { "product": "Camera X", "quantity": 5, "sn_scanned": 3 }
    ]
  }
]
```

Logic: nếu `sn_scanned < quantity` → thiếu → ticket phạt Hữu.

### Flow #2 — Check dán Cú (T2→T7, 16:45)

**Cần:** API check hóa đơn nào chưa có ảnh (phụ thuộc module #2).

```
GET /api/invoices/kho?date=YYYY-MM-DD&check=images

Response:
[
  { "id": "...", "code": "HD020873", "has_images": false }
]
```

Logic: `has_images == false` → ticket phạt Hữu.

### Flow #3 — Check PGV Group Zalo (T2→T7, 16:45)

**Cần:** API lấy danh sách hóa đơn cần giao trong ngày.

```
GET /api/invoices/shipping?date=YYYY-MM-DD

Response:
[
  {
    "id": "...",
    "code": "HD020873",
    "customer": "Nguyễn Văn A",
    "applied_ship": 50000,
    "carrier": "Minh Tuấn"
  }
]
```

Logic: Hermes quét Group PGV Zalo → so sánh → thiếu thì tự đăng bổ sung + ticket phạt Hữu.

### Flow #4b — Check gởi PGV khách (T2→T7, 17:00)

**Cần:** API check trạng thái "đã gởi KH" của từng hóa đơn có PGV.

```
GET /api/invoices/shipping?date=YYYY-MM-DD&check=sent

Response:
[
  { "id": "...", "code": "HD020873", "pgv_sent_to_customer": false }
]
```

Logic: `pgv_sent_to_customer == false` → ticket phạt Huyền.

---

## C. THỨ TỰ ƯU TIÊN

1. **Flow #1 API** (check SN) — không phụ thuộc gì, làm được ngay
2. **Upload ảnh + Flow #2 API** — cần làm cùng lúc
3. **Flow #3 + #4b API** (shipping) — 2 flow dùng chung data shipping

---

## D. GHI CHÚ

- P24-PREFECT base URL: `https://report.creta.vn` (config: `CREATA_API_BASE`)
- Tất cả flow AUTO chạy hàng ngày T2→T7
- OK = im lặng. Lỗi = ticket phạt (Google Sheet CRETA CHECKLIST) + task (task.creta.vn)
- Code P24-PREFECT hiện tại đang ở `~/creta-task-recurring/P24-PREFECT/app/` — toàn stub
- Ticket handler: `create_violation_ticket(task_id, assignee, reason)` ghi Sổ nợ + tạo task
