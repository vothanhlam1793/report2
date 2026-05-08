# Runtime And Deployment Notes

File này thay thế tài liệu Docker deploy cũ.

## Current Runtime

Runtime chính của phase dev hiện tại xem tại:

- `docs/dev-runtime.md`

Tóm tắt:

- App chạy trực tiếp trên `10.7.0.2`
- Workspace: `/home/black/report2`
- Process: `node ./bin/www`
- Port: `38655`
- Public domain: `report2.camerangochoang.com`
- Reverse proxy: `svr12.creta.vn`

## Important

- Không mặc định giả định Docker là đường chạy chính.
- Không mặc định giả định CI/CD đang là cách deploy thực tế của môi trường này.
- Nếu runtime thật và docs cũ mâu thuẫn, tin runtime thật.

## Legacy Note

Trước đây repo từng có tài liệu Docker/CI-CD cho môi trường khác.
Ở phase dev hiện tại, các ghi chú đó không còn là hướng dẫn chính và đã được loại khỏi luồng đọc đầu phiên để tránh gây nhiễu.
