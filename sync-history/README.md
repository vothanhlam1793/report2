# Sync History Tools

Thư mục này chứa công cụ sync gợi ý NCC vào `orderTemplate` của sản phẩm KiotViet.

## Chạy công cụ

```bash
python3 sync-history/sync_order_template_suppliers.py
```

## Công cụ làm gì

- Đọc `purchaseorders` từ KiotViet Public API
- Aggregate NCC theo `productCode`
- Sinh block:
  - `#NCC-1: CODE | NAME`
  - `#NCC-2: CODE | NAME`
- So sánh với `orderTemplate` hiện tại
- Có thể chạy `preview` hoặc `write`
- Có log tiến độ khi tải dữ liệu và khi xử lý từng batch `purchaseorders`

## Lưu ý

- Mặc định nên dùng `preview` trước
- Công cụ chỉ quản lý block `#NCC-1:` và `#NCC-2:`
- Các dòng note khác trong `orderTemplate` sẽ được giữ nguyên
