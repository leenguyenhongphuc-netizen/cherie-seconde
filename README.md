# CHÉRIE Seconde

Website 2hand.cherie.io.vn: bán lại đầm CHÉRIE hết vòng thuê và nhận ký gửi đồ hiệu.

- `index.html`: cửa hàng cho khách (kệ hàng, giỏ, đặt giữ 24 giờ, trang ký gửi, tra cứu đồ ký gửi).
- `quanly/`: quản trị cho nhân viên, đăng nhập bằng mã PIN (hôm nay, nhận đồ, kho, đơn, chủ đồ).
- `app.js`: giao diện và quy tắc giá dùng chung. `api.js`: cầu nối máy chủ. `seconde.css`: giao diện.
- `server/Code.gs`: máy chủ Google Apps Script, ghi vào Sheet "CHÉRIE Seconde · Quản lý".
- `server/Loader.gs`: đoạn ngắn dán vào Apps Script; tự tải `server/Code.gs` từ GitHub (đệm 10 phút).
- `config.js`: link triển khai Apps Script (đuôi /exec).

Dữ liệu và đăng nhập tách riêng với cherie.io.vn, Office và Care.
