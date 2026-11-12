# Hướng dẫn chạy và giải thích Prototype — Nhóm Ba Chàng Lính Ngự Lâm

## 1. Cách chạy Prototype
- Mở file [`index.html`](index.html) trực tiếp bằng bất kỳ trình duyệt web hiện đại nào (Google Chrome, Microsoft Edge, Safari, Firefox).
- Không yêu cầu cài đặt web server (Apache/Nginx/NodeJS) hay cài đặt npm packages.

## 2. Ca khó được nhóm giải quyết trên Prototype
- **Khách nhắn:** *"Chuyến bị huỷ rồi à? Tôi đang gấp lắm, đổi ngay cho tôi chuyến tối nay lúc 21h (BM 217) đi!"*
- **Ràng buộc dữ liệu & An toàn:**
  - PNR `TRV-7Q2K` có **2 hành khách**: Nguyễn Minh An (34 tuổi) & bé Nguyễn Gia Bình (5 tuổi).
  - Chuyến bay tối nay BM 217 (21:00) **chỉ còn đúng 1 chỗ duy nhất**.
  - Theo Điều 6 Quy định an toàn hàng không: Trẻ em dưới 12 tuổi không được bay một mình.
- **Cách Prototype xử lý:**
  - AI không mù quáng đổi vé, mà hiển thị nhãn cảnh báo thiếu chỗ an toàn cho bé 5 tuổi.
  - Tự động kích hoạt `giu_cho_chuyen_moi` 2 chỗ chuyến sáng mai BM 201 (07:00) trong 20 phút (đồng hồ đếm ngược chạy thật).
  - Cung cấp nút duyệt 1-chạm đổi sang chuyến sáng mai hoặc nút chuyển nhân viên sân bay kèm ngữ cảnh đầy đủ.
  - Cung cấp Modal xác nhận 2 bước có ma sát (Two-step Friction Modal) nếu khách muốn huỷ vé hoàn tiền.

## 3. Bản đồ 6 điểm đánh số HAX / Google PAIR trên Prototype

```
┌──────────────────────────────────────────────────────────┐
│  [1] THẺ TRẠNG THÁI: Nhãn cảnh báo chưa thể đổi (G2, G10)│
├──────────────────────────────────────────────────────────┤
│  [2] DÒNG BẰNG CHỨNG: Trích xuất PNR & Luật Bay (G11)    │
├──────────────────────────────────────────────────────────┤
│  [3] HỘP GIỮ CHỖ TỰ ĐỘNG: Đếm ngược 20:00 (Auto-Hold)    │
├──────────────────────────────────────────────────────────┤
│  [4] THẺ DUYỆT 1-CHẠM: Nút bấm xác nhận đổi (Level 2)    │
├──────────────────────────────────────────────────────────┤
│  [5] NÚT THOÁT HIỂM: Nối máy nhân viên hỗ trợ (Fallback) │
├──────────────────────────────────────────────────────────┤
│  [6] MODAL HOÀN VÉ 2 BƯỚC: Checkbox ma sát an toàn (G8)  │
└──────────────────────────────────────────────────────────┘
```

1. **[1] HAX G2 (Làm rõ năng lực) & HAX G10 (Thu hẹp phạm vi khi nghi ngờ):**
   - Nhãn màu vàng cam: `Chưa thể đổi sang BM 217: Thiếu chỗ cho bé 5 tuổi đi cùng`.
   - Giúp khách hàng hiểu ngay tại sao AI không thực hiện yêu cầu mà không phải đoán.
2. **[2] HAX G11 (Giải thích tại sao) & PAIR Explainability:**
   - Dòng trích dẫn căn cứ dữ liệu thực tế: `Dựa vào: Đặt chỗ TRV-7Q2K (2 khách, có trẻ 5 tuổi) · Kho vé lúc 15:00 · Quy định Bay Mẫu Điều 6`.
3. **[3] PAIR Feedback & Control (Auto-Hold đảo ngược 100%):**
   - Hộp màu xanh lá cây đếm ngược thời gian giữ chỗ thực tế `[20:00]`. Hết 20 phút tự nhả chỗ, hoàn toàn không gây mất phí hay mất vé gốc.
4. **[4] Level 2 Autonomy Confirmation Card (HAX G8 / G9):**
   - Thẻ xác nhận đổi vé với thông tin chi tiết: Chuyến mới, giờ bay, số khách, phí 0đ và nút bấm `[Xác nhận đổi sang BM 201]`.
5. **[5] PAIR Errors & Graceful Failure (Lối thoát sang nhân viên):**
   - Nút `[Tôi cần đi tối nay → Gặp nhân viên]` kèm thẻ thông báo chuyển giao hồ sơ đầy đủ, khách không phải trình bày lại từ đầu.
6. **[6] Two-Step Friction Modal (Bảo vệ thao tác không thể đảo ngược):**
   - Modal bật lên khi khách chọn hoàn tiền, liệt kê 4 cảnh báo pháp lý và bắt buộc tick vào checkbox cam kết thì nút Đỏ `[Gửi yêu cầu hoàn vé]` mới kích hoạt.
