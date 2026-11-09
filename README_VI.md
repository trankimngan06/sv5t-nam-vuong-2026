# Website bình chọn Nam Vương Sinh viên 5 Tốt UHL 2026

Bộ mã nguồn gồm:
- Trang chủ pastel hồng – xanh mint – kem.
- `/vote/1` và `/vote/2`: hai đường dẫn bình chọn độc lập, dùng tạo hai QR riêng.
- `/admin`: đăng nhập Admin bằng magic link gửi tới email quản trị; khán giả không cần đăng nhập.
- Chống trùng email theo từng vòng bằng unique constraint ở PostgreSQL.
- Mở/đóng từng vòng; xuất Excel riêng từng vòng và file tổng hợp.

## 1. Chuẩn bị tài khoản
Cần:
1. Một project Supabase: https://supabase.com
2. Một tài khoản GitHub để lưu mã nguồn (không bắt buộc nếu deploy bằng CLI).
3. Một nền tảng hosting Next.js, ví dụ Vercel hoặc hosting tương đương. Kiểm tra điều khoản gói hosting phù hợp với hoạt động CLB.

## 2. Tạo database
1. Tạo project mới trong Supabase.
2. Mở **SQL Editor**.
3. Mở file `supabase/schema.sql`, copy toàn bộ và chạy.
4. Trong Supabase **Project Settings → API**, lấy Project URL và anon/public key.
5. Không đưa `service_role` key vào trình duyệt hoặc file `.env` có tiền tố `NEXT_PUBLIC_`.

## 3. Cấu hình email đăng nhập Admin
Khán giả không dùng OTP. Chỉ Admin dùng magic link:
1. Supabase → Authentication → URL Configuration.
2. Thêm URL local `http://localhost:3000/admin` và URL website thật `https://TEN-MIEN-CUA-CLB/admin` vào Redirect URLs.
3. Cấu hình SMTP riêng trong Authentication → SMTP Settings để email Admin được gửi ổn định.
4. Email Admin được khóa trong SQL và mặc định là `trankimngan20006@gmail.com`.
5. Nếu đổi email Admin, sửa email trong `lib/supabase.ts` và hàm `is_uhl_admin()` trong `supabase/schema.sql`, sau đó chạy lại phần hàm/policy tương ứng.

## 4. Chạy trên máy tính
Cài Node.js LTS, giải nén project, mở Terminal tại thư mục dự án:

```bash
cp .env.example .env.local
```

Điền:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_ADMIN_EMAIL=trankimngan20006@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Sau đó:
```bash
npm install
npm run dev
```
Mở http://localhost:3000

## 5. Đưa website lên Internet
1. Đẩy thư mục dự án lên GitHub.
2. Import repository vào Vercel hoặc nền tảng hosting Next.js phù hợp.
3. Thêm đủ 4 biến môi trường ở trên trong phần Environment Variables.
4. Deploy.
5. Lấy domain được cấp, ví dụ `https://uhl-nam-vuong-2026.example`, rồi cập nhật `NEXT_PUBLIC_SITE_URL`.
6. Thêm domain `/admin` vào Supabase Redirect URLs và deploy lại nếu thay đổi biến môi trường.

## 6. Tạo hai QR
Sau khi deploy:
- QR vòng 1 trỏ tới `https://TEN-MIEN-CUA-CLB/vote/1`
- QR vòng 2 trỏ tới `https://TEN-MIEN-CUA-CLB/vote/2`

Trang Admin cũng hiển thị QR tự động. Có thể dùng điện thoại quét thử trước khi đưa vào slide.

## 7. Quy trình ngày diễn ra sự kiện
1. Admin mở `/admin`, đăng nhập bằng magic link.
2. Bấm **Mở vòng bình chọn** ở vòng 1.
3. MC chiếu QR vòng 1.
4. Admin đóng vòng 1, xuất `UHL_Binh_chon_vong_1.xlsx`.
5. Admin mở vòng 2, MC chiếu QR vòng 2.
6. Admin đóng vòng 2, xuất `UHL_Binh_chon_vong_2.xlsx`.
7. Có thể tải thêm `UHL_Tong_hop_2_vong.xlsx`.

## 8. Kiểm thử bắt buộc
- Cùng email, gửi hai lần ở vòng 1: lần hai phải bị từ chối.
- Cùng email, gửi một lần vòng 1 và một lần vòng 2: cả hai được chấp nhận.
- Đóng vòng: phiếu mới không được ghi nhận.
- Đăng nhập Admin bằng email khác: không được xem dữ liệu hoặc điều khiển vòng.
- Thử xuất Excel và mở file trên máy khác.
- Kiểm tra kết nối Internet và email Admin trước sự kiện.

## Lưu ý về giới hạn chống gian lận
Không xác minh email nghĩa là hệ thống không xác nhận người gửi sở hữu địa chỉ email đã nhập. Người cố tình có nhiều địa chỉ email vẫn có thể gửi nhiều phiếu bằng các địa chỉ khác nhau. Hệ thống chỉ bảo đảm **mỗi chuỗi email chuẩn hóa chỉ có một phiếu trong mỗi vòng**. Không nên công khai file chứa email người tham gia.

## Lưu ý dữ liệu cá nhân
Chỉ thu thập tên và email cần thiết cho việc chống vote trùng; giới hạn người được xem và tải dữ liệu; xóa dữ liệu sau thời hạn CLB đã thông báo và thống nhất.
