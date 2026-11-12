# Bài nộp LAB5 — T3 · Du lịch (Trợ lý đổi chuyến khi chuyến bay bị huỷ) · Nhóm BaChàngLínhNgựLâm

## Danh sách thành viên nhóm

**Lớp:** L3A · **Bàn / zone:** Zone T3 · **Track:** T3 — Du lịch

| Họ và Tên | Mã Học Viên | Việc đã làm |
|---|---|---|
| Nguyễn Trọng Hưởng | 2A202603607 | **Trưởng nhóm:** Chủ trì §1 (Lát cắt & Phạm vi), §4 (Mức tự chủ theo Cost-of-error), hoàn thiện spec & trình bày phần Mức tự chủ trong Demo |
| Phạm Ngọc Minh Quân | 2A202603626 | **Thành viên:** Phụ trách §2 (Xây dựng 8 kịch bản rủi ro phủ 4 lớp, khoanh 2 ca đắt nhất), §3 (Thiết kế UX khi AI sai, thoại nguyên văn, áp dụng HAX/PAIR) & trình bày phần Kịch bản/UX trong Demo |
| Trần Minh Tân | 2A202603688 | **Thành viên:** Phụ trách §5 (Dựng Prototype tương tác ca khó BM 217 vs trẻ 5 tuổi), §6 (3 tiêu chí Pass/Fail), quản lý tài sản hình ảnh & trình bày/thao tác Demo |

---

## §1. Lát cắt & phạm vi

### 1. Lát cắt chuẩn của Track T3 (Du lịch)
> Trong **Đặt chỗ của tôi**, khi **hành khách** vừa nhận tin chuyến bay bị huỷ và nhắn hỏi, **AI đề xuất và giữ chỗ chuyến thay thế, hỏi lại cho rõ, đổi vé, hay chuyển nhân viên**, để khách tới nơi kịp mà không mất vé hay tiền vì một thao tác không đảo lại được.

### 2. Ba việc tính năng KHÔNG làm (Out-of-Scope) & Lý do
1. **Không tự ý đổi tên người bay hoặc chuyển nhượng PNR sang người khác:**
   - *Lý do:* Vi phạm quy định an toàn và an ninh hàng không quốc tế & Việt Nam (định danh thông tin PNR gắn liền với CCCD/Hộ chiếu theo chuẩn ICAO). Đây là nghiệp vụ đặc biệt nhằm phòng chống thị trường đen phe vé/đầu cơ vé trong tình huống bão gây huỷ chuyến hàng loạt. Nghiệp vụ này bắt buộc do nhân viên quầy có thẩm quyền kiểm tra giấy tờ tuỳ thân gốc thực hiện.
2. **Không tự ý cam kết hoặc chi trả bồi thường tiền mặt khi huỷ chuyến do thời tiết:**
   - *Lý do:* Theo Thông tư của Bộ GTVT và chính sách của hãng Bay Mẫu / Vietnam Airlines, thời tiết xấu (bão) là trường hợp bất khả kháng, hãng được miễn trừ nghĩa vụ bồi thường ứng trước không hoàn lại bằng tiền mặt. Nếu AI tùy tiện hứa hẹn tiền mặt, hãng sẽ chịu rủi ro tài chính sai quy định và gây tranh chấp nghiêm trọng khi khách ra quầy làm thủ tục.
3. **Không tự ý tách lẻ trẻ em dưới 12 tuổi (ở đây là bé Nguyễn Gia Bình 5 tuổi) bay một mình:**
   - *Lý do:* Luật hàng không quy định trẻ dưới 12 tuổi bắt buộc phải có người lớn đi kèm cùng hạng vé, hoặc phải đăng ký dịch vụ Trẻ em đi một mình (Unaccompanied Minor - UM) trước 24h và có cam kết của người giám hộ tại sân bay. AI tuyệt đối không bao giờ được tự động chọn chuyến chỉ còn 1 chỗ để tách trẻ em bay riêng.

---

## §2. Kịch bản rủi ro (Chặng 2)
*(Đang thực hiện)*

## §3. Khi AI sai (Chặng 3)
*(Đang thực hiện)*

## §4. Mức tự chủ (Chặng 4)
*(Đang thực hiện)*

## §5. Prototype (Chặng 5)
*(Đang thực hiện)*

## §6. Tốt là gì (Chặng 6)
*(Đang thực hiện)*

## §7. Demo
*(Đang thực hiện)*
