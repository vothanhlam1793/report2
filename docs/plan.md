# Development Plan — report2

> Lưu ý: file này tập trung vào roadmap sản phẩm và code.
> Runtime/dev server hiện tại xem ở `docs/dev-runtime.md`.

## Phase 1 — Sync & Merge (Ưu tiên cao) ← ĐANG LÀM

| # | Task | Status |
|---|---|---|
| 1.1 | Pull source từ container REPORT (image :38) ra local | ✅ Done |
| 1.2 | Lấy `detail.ejs` từ container (WS đúng `svr3.creta.vn`) làm base | ✅ Done |
| 1.3 | Merge route `/barcode/:invoice/:product` vào | ✅ Done |
| 1.4 | Merge `barcode.ejs` + `barcodeApp2.js` (camera phone) vào | ✅ Done |
| 1.5 | Tạo thư mục `docs/` + tài liệu kiến trúc | ✅ Done |
| 1.6 | Commit + push + tag `v1.1.0` | ✅ Done |

---

## Phase 2 — Dọn dẹp dead code (Ưu tiên cao)

| # | Task | File | Status |
|---|---|---|---|
| 2.1 | Xoá upload GridFS (`node.creta.work:30042` chết) | `routes/upload.js` | ⬜ |
| 2.2 | Xoá SMS code hoàn toàn | `adapter/sms.js`, `detailInvoice.js`, `detailInvoice2.js` | ⬜ |
| 2.3 | Xoá `hubot.js`, `test.js` adapter | `routes/adapter/` | ⬜ |
| 2.4 | Xoá `barcodeApp.js` (v1 cũ) | `public/js/barcodeApp.js` | ⬜ |
| 2.5 | Dọn code commented-out trong `detail.ejs` | `views/invoices/detail.ejs` | ⬜ |
| 2.6 | Xoá `detailInvoice.js` nếu không còn dùng | `public/js/detailInvoice.js` | ⬜ |

---

## Phase 3 — Ổn định hoá (Ưu tiên trung bình)

| # | Task | Status |
|---|---|---|
| 3.1 | Làm rõ và chuẩn hóa quy trình restart/runtime trên `10.7.0.2` | ✅ |
| 3.2 | Chỉ giữ CI/CD hoặc Docker nếu còn dùng thật sau phase dev | ⬜ |
| 3.3 | Kiểm tra WebSocket barcode end-to-end trên production | ⬜ |
| 3.4 | Kiểm tra camera phone barcode trên production | ⬜ |

---

## Phase 4 — Vận hành mới (Đang active)

| # | Task | Status |
|---|---|---|
| 4.1 | Dựng `/finance` cho chi phí phát sinh quy trình | ✅ |
| 4.2 | Thêm directory `/customers` đọc từ Odoo | ✅ |
| 4.3 | Thêm directory `/suppliers` đọc từ KiotViet | ✅ |
| 4.4 | Chuẩn hóa `Quick Receipt` xác nhận bằng ảnh | ✅ |
| 4.5 | Thêm supplier vào `Quick Purchase` | ✅ |
| 4.6 | Hiển thị đề xuất NCC trong `WHC` từ `orderTemplate` và `purchaseorders` | ✅ |
| 4.7 | Tool `sync-history` để build `#NCC-1/#NCC-2` ở mode preview | ✅ |
| 4.8 | Bật mode `write` an toàn cho tool sync `orderTemplate` | ⬜ |
| 4.9 | Chuyển supplier hints sang Odoo field `x_supplier_hints` | ⬜ |

### Phase 4.9 — Chuyển supplier hints sang Odoo

Mục tiêu:

- không dùng `orderTemplate` KiotViet làm nguồn chính cho gợi ý NCC nữa
- chuyển metadata NCC đề xuất sang Odoo để `report2` đọc ổn định hơn
- giữ format machine-readable để UI chỉ cần hiển thị cho staff/admin tự chọn NCC

Field Odoo dự kiến:

- model: `product.product`
- field: `x_supplier_hints`
- type: `Text`

Format nội dung dự kiến:

```text
#NCC-1: CODE | NAME
#NCC-2: CODE | NAME
```

Checklist triển khai:

| # | Task | Status |
|---|---|---|
| 4.9.1 | Bên Odoo thêm field `x_supplier_hints` (`Text`) trên `product.product` | ⬜ |
| 4.9.2 | Dự án sync KiotViet -> Odoo build `#NCC-1/#NCC-2` từ `purchaseorders` | ⬜ |
| 4.9.3 | Dự án sync ghi dữ liệu vào `x_supplier_hints` | ⬜ |
| 4.9.4 | `report2` mở rộng adapter Odoo để đọc `x_supplier_hints` | ⬜ |
| 4.9.5 | `report2` đổi `supplierSuggestion` sang ưu tiên Odoo, fallback KiotViet | ⬜ |
| 4.9.6 | Ngừng coi `orderTemplate` KiotViet là nguồn chính cho supplier hints | ⬜ |

Nguyên tắc sau chuyển đổi:

- `report2` chỉ đọc và hiển thị supplier hints
- việc build/sync `x_supplier_hints` thuộc dự án sync KiotViet -> Odoo
- UI `WHC` / `Quick Purchase` tiếp tục chỉ hiển thị đề xuất, không auto-pick NCC

---

## Phase 5 — Authentication (Ưu tiên trung bình)

App hiện tại **public hoàn toàn** — ai có URL đều vào được.

| # | Task | Status |
|---|---|---|
| 4.1 | Thêm `express-session` + login page | ⬜ |
| 4.2 | Middleware check session toàn bộ routes | ⬜ |
| 4.3 | User/pass lưu trong `.env` (đơn giản, nội bộ) | ⬜ |

---

## Phase 6 — Nâng cấp dài hạn (Ưu tiên thấp)

| # | Task | Status |
|---|---|---|
| 5.1 | Dọn Backbone.js — thống nhất Vue 2 toàn bộ frontend | ⬜ |
| 5.2 | Nâng Express `4.16` → `4.19+` | ⬜ |
| 5.3 | Nâng Mongoose `^6` → `^8` | ⬜ |
| 5.4 | Xem xét KiotViet webhook thay polling | ⬜ |
| 5.5 | Tách frontend ra SPA riêng nếu cần | ⬜ |

---

## Ghi chú kỹ thuật

### 2 nhánh phát triển song song (đã merge ở v1.1.0)

```
Container REPORT (image :38)         Local repo (report2 GitHub)
─────────────────────────────        ──────────────────────────────
ws://svr3.creta.vn ✅                ws://node.creta.work ❌
KHÔNG có camera phone                CÓ camera phone (barcode.ejs)
KHÔNG có route /barcode/...          CÓ route /barcode/:inv/:prod
```

### WebSocket barcode flow
Xem chi tiết: `docs/architecture.md`

## Ghi chú phase dev hiện tại

- App đang được dev trực tiếp trên máy `10.7.0.2`
- Runtime active: `/home/black/report2` + `node ./bin/www` + port `38655`
- Public domain đi qua proxy `svr12.creta.vn`
- Không nên lấy tài liệu Docker cũ làm giả định mặc định khi tiếp tục phát triển
- Gợi ý NCC trong `WHC` hiện ưu tiên đọc `orderTemplate` từ KiotViet
- `purchaseorders` là nguồn lịch sử nhập dùng để đề xuất phụ và để sync block `#NCC-1/#NCC-2`
- Tool `sync-history` đang ở `preview` mode, chờ chốt flow `write`
