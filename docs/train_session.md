## Bài tập trắc nghiệm

- Thiết kế theo hướng Gamification
- game này có 3 tầng, mức độ khó tăng dần, mỗi tầng sẽ có nhiều câu, vừa vô cho 3 mạng, sai 1 câu - 1 mạng, qua được tầng sẽ bonus +2 mạng, trả lời đúng và nhanh sẽ thưởng vàng.
- Tính điểm mỗi bài luyện tập và có bảng xếp hạng.
- vàng có thể dùng:
    - **Kính hiển vi (Che 1/2 đáp án):** Loại bỏ 2 phương án sai (Cơ chế 50/50 truyền thống).
    - **Bùa nhân phẩm (x2 điểm số):** Phải kích hoạt *trước* khi bấm chọn đáp án. Đúng thì ăn cả, sai thì mất tiền oan.
    - **Khiên hộ mệnh (Bảo toàn mạng):** Khi chọn sai, khiên sẽ vỡ và người chơi không bị trừ mạng. Chỉ được mua tối đa 1 cái mỗi tầng.
    - đóng băng thời gian
    - …
- **Cân bằng cơ chế "Hồi mạng":** Qua tầng +2 mạng là hợp lý, nhưng nên đặt giới hạn tối đa (Cap) là **5 mạng** để người chơi không tích lũy quá nhiều mạng ở tầng dễ, làm mất đi tính thử thách ở tầng khó.
- Bảng xếp hạng
    
    Thuật toán Sắp xếp 3 Tầng Ưu tiên: 
    
    - Ưu tiên 1: Điểm số ( điểm của các câu làm được * hệ số giảm). Làm lần 1: hệ số = 1, lần 2 = 0.8, lần 3 = 0.5, lần 4 trở đi = 0 (hoặc mỗi lần giảm 0.2)
    - Ưu tiên 2: Số vàng còn lại sau mỗi trận (ưu tiên nhiều nhất)
    - Ưu tiên 3: Thời gian làm bài (ưu tiên ít nhất)
    - Ưu tiên 4: Số lược chơi (ưu tiên ít nhất)
- Đấu boss:
    - Ở mỗi tầng sẽ có 2 boss, ở giữa giai đoạn và cuối giai đoạn, thời gian ít hơn, nếu thua sẽ mất 2 máu, vàng khi mua vật phẩm sẽ tăng lên x2, bù lại điểm sẽ tăng lên x2.

### UI:

- **Component Thanh Máu (HP Bar / Heart Icons):** Đặt ở góc trên bên trái. Thay vì hiện số `3`, hãy dùng **3 icon Trái tim đỏ** hoặc **3 cái Khiên**. Khi trả lời sai, trái tim đó sẽ có hiệu ứng vỡ vụn (Broken) hoặc mờ đi.
- **Component Két Vàng Trận Đấu (Gold Counter Widget):** Hiển thị số vàng hiện tại của trận đó. Khi trả lời đúng và nhanh, số vàng này sẽ nhảy số liên tục kèm hiệu ứng đồng xu vàng bay từ câu hỏi vào két.
- **Component Thanh Thời Gian Co Rút (Dynamic Timer Bar):** Một thanh ngang dài chạy mờ dần từ phải sang trái. Thanh này nên đổi màu theo thời gian thực: *Xanh lá (Tốc độ cao) $\rightarrow$ Vàng (Bình thường) $\rightarrow$ Đỏ (Sắp hết giờ)*.
- **Component Thanh Tiến Trình Ải (Stage Progress Dot):** Một chuỗi 10 chấm tròn nhỏ. Câu nào đúng hiện chấm xanh lá, câu nào sai hiện chấm đỏ, câu hiện tại là icon thanh kiếm hoặc mũi tên. Học sinh nhìn vào sẽ biết mình đang ở câu số mấy.
- **Component Quầy Vật Phẩm Nhanh (Item Hotbar):** Nằm cố định ở cạnh dưới màn hình (giống thanh chọn vũ khí trong game). Gồm các ô chứa kỹ năng trợ giúp (50/50, Đóng băng, x2 Điểm).
    - Dưới mỗi ô hiển thị giá vàng (Ví dụ: 💰100).
    - Nếu két vàng của học sinh không đủ, ô vật phẩm đó sẽ tự động **tối màu (Greyscale/Disabled)** để các em biết mình chưa mua nổi.
- **Component Cảnh Báo Quái Vật (Boss Alert Pop-up):** Khi học sinh làm đến nửa giai đoạn hoặc cuối giai đoạn, hệ thống sẽ chặn màn hình 1.5 giây, nhấp nháy đèn đỏ và hiện chữ **"WARNING: BOSS BATTLE!"** kèm hiệu ứng âm thanh dồn dập. Toàn bộ thanh Hotbar vật phẩm lúc này sẽ bị khóa xích lại (không cho dùng).
- **Component Thẻ Kết Quả Hoành Tráng (Result Card):**
    - Nếu thắng (vượt tháp): Hiện chữ **"VICTORY"** rực rỡ, kèm hiệu ứng pháo hoa.
    - Nếu thua (hết mạng): Hiện chữ **"DEFEAT"** tối màu, thanh kiếm gãy.
- **Component Bảng Thống Kê Chỉ Số (End-game Statistics):** Hiển thị dạng các thẻ nhỏ cuộn lên lần lượt:
    - 🏆 *Điểm số cao nhất đạt được*
    - 💰 *Vàng còn lại được cộng vào BXH Vàng*
    - 🔥 *Chuỗi trả lời đúng dài nhất (Max Combo)*
- **Component Nút Hành Động (Action Buttons):** Thiết kế nút to, nổi bật. Gồm nút **"Tái Đấu" (Retry)** màu rực rỡ và nút **"Về Sảnh" (Lobby)**.