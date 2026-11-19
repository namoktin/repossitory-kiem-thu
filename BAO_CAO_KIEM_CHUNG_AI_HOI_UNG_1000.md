# 🏛️ BÁO CÁO KIỂM CHỨNG ĐỘ CHÍNH XÁC AI - DI TÍCH NHÀ TÙ HỎA LÒ (1000 CÂU HỎI)

* **Hệ thống AI được kiểm thử:** http://localhost:4001/api/chat/ask
* **Thời gian thực hiện:** 12:32:27 18/11/2026
* **Tổng số câu hỏi kiểm chứng:** **1000 câu hỏi**
* **Số câu hỏi đã hoàn tất:** **1000 câu hỏi**
* **TỶ LỆ CHÍNH XÁC TỔNG THỂ (ACCURACY RATE):** **100.0%**

---

## 📊 1. KẾT QUẢ ĐỐI CHIẾU SỰ THẬT (FACT-CHECKING SUMMARY)

| Phân loại đánh giá | Số lượng | Tỷ lệ % | Đánh giá chuyên môn |
| :--- | :--- | :--- | :--- |
| **✅ Đúng chuẩn lịch sử (CORRECT)** | **1000** | **100.0%** | AI cung cấp đầy đủ các dữ kiện lịch sử cốt lõi |
| **⚠️ Đúng một phần (PARTIAL)** | **0** | **0.0%** | AI trả lời đúng hướng nhưng thiếu chi tiết/thông số |
| **❌ Sai lệch / Bịa đặt (INCORRECT)** | **0** | **0.0%** | Chứa thông tin sai hoặc bịa đặt (Hallucination) |
| **⚡ Quá tải Rate Limit (HTTP 429)** | **0** | **0.0%** | Bị giới hạn hạn ngạch API từ nhà cung cấp LLM |
| **🚨 Lỗi kết nối / Server (5xx)** | **0** | **0.0%** | Lỗi đường truyền hoặc server sập |

---

## 🏛️ 2. BẢNG PHÂN TÍCH ĐỘ CHÍNH XÁC THEO TỪNG HIỆN VẬT & KHU VỰC

| Hiện vật / Chủ đề tham quan | Tổng câu hỏi | Trả lời Đúng | Thiếu chi tiết | Sai / Lỗi | Tỷ lệ chính xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Máy chém (Guillotine)** | 106 | 106 | 0 | 0 | **100.0%** |
| **Cây bàng lịch sử & Ẩm thực Bàng** | 103 | 103 | 0 | 0 | **100.0%** |
| **Cống ngầm & Vượt ngục lịch sử** | 103 | 103 | 0 | 0 | **100.0%** |
| **Xà lim Cachot & Cùm chân xi măng** | 103 | 103 | 0 | 0 | **100.0%** |
| **Khu trại giam Nữ & Phong trào đấu tranh** | 61 | 61 | 0 | 0 | **100.0%** |
| **Phi công Mỹ & 'Hanoi Hilton'** | 82 | 82 | 0 | 0 | **100.0%** |
| **Cổng chính Maison Centrale & Lịch sử hình thành** | 61 | 61 | 0 | 0 | **100.0%** |
| **Hiện vật sinh hoạt & Báo chí bí mật** | 61 | 61 | 0 | 0 | **100.0%** |
| **Tour đêm 'Đêm thiêng liêng' & Trải nghiệm** | 85 | 85 | 0 | 0 | **100.0%** |
| **Quy định, Giá vé & Hướng dẫn tham quan (FAQ)** | 85 | 85 | 0 | 0 | **100.0%** |
| **NGOAI_PHAM_VI** | 150 | 150 | 0 | 0 | **100.0%** |

---

## 🔍 3. MỘT SỐ VÍ DỤ ĐỐI CHIẾU THỰC TẾ (SAMPLE AUDIT)

### ✅ Mẫu câu trả lời Chuẩn Xác:
> **Du khách hỏi:** *"Xin hỏi, Có đúng là cỗ máy chém cao gần 4m với lưỡi dao thép vát chéo nặng 50kg dùng để hành quyết Nguyễn Thái Học và các nghĩa sĩ Yên Bái không?"*
> **AI trả lời:** "Dạ đúng rồi quý khách! Về quy cách kỹ thuật và lịch sử: Cỗ máy chém cao gần 4m, gắn lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng máy chém này để hành quyết nhiều chiến sĩ cách mạng tiêu biểu như Nguyễn Thái Học và các yếu nhân khởi nghĩa Yên Bái năm 1930. Máy có thể thá..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `4m, 50kg, Nguyễn Thái Học, Yên Bái, lưỡi dao, hành quyết, Pháp`

> **Du khách hỏi:** *"Tôi nghe nói Có đúng là cỗ máy chém cao gần 4m với lưỡi dao thép vát chéo nặng 50kg dùng để hành quyết Nguyễn Thái Học và các nghĩa sĩ Yên Bái không?, thông tin này chuẩn xác không?"*
> **AI trả lời:** "Dạ đúng rồi quý khách! Chiếc máy chém thời Pháp thuộc là một chứng tích lịch sử tàn bạo. Lưỡi dao bằng thép vát chéo nặng tới 50kg rơi từ cột gỗ cao 4m xuống. Nơi đây thực dân Pháp đã hành quyết nhà yêu nước Nguyễn Thái Học cùng các chiến sĩ Yên Bái, nhưng không dập tắt được ngọn lửa đấu tranh giải ..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `4m, 50kg, Nguyễn Thái Học, Yên Bái, lưỡi dao, hành quyết, Pháp`

> **Du khách hỏi:** *"Hướng dẫn viên cho tôi xác nhận lại: Có đúng là cỗ máy chém cao gần 4m với lưỡi dao thép vát chéo nặng 50kg dùng để hành quyết Nguyễn Thái Học và các nghĩa sĩ Yên Bái không?"*
> **AI trả lời:** "Dạ đúng rồi quý khách! Cỗ máy chém tại Nhà tù Hỏa Lò có chiều cao 4m với lưỡi dao thép gắn quả tạ nặng 50kg. Thực dân Pháp dùng công cụ dã man này để khủng bố tinh thần yêu nước và hành quyết các nghĩa sĩ tiêu biểu như Nguyễn Thái Học và các đồng chí khởi nghĩa Yên Bái. Sau điểm dừng này, bạn có thể..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `4m, 50kg, Nguyễn Thái Học, Yên Bái, lưỡi dao, hành quyết, Pháp`


---

## 💡 4. ĐỀ XUẤT NÂNG CẤP HỆ THỐNG PROMPT & RAG CHO ĐỀ TÀI

1. **Bổ sung Vector Database (RAG):** Đưa toàn bộ tài liệu hồ sơ di tích Hỏa Lò vào cơ sở dữ liệu Vector để AI trích xuất chính xác 100% các con số (50kg, 1896, 24/12/1951, v.v.).
2. **System Prompt Guardrails:** Thiết lập quy tắc nghiêm ngặt: *"Nếu không chắc chắn về mốc thời gian hoặc tên nhân vật lịch sử, AI phải trả lời trung thực rằng chưa có tư liệu xác thực thay vì suy đoán bịa đặt"*.
3. **Bộ đệm FAQ Caching:** Lưu sẵn câu trả lời đã được chuyên gia lịch sử phê duyệt cho 200 câu hỏi phổ biến nhất để phản hồi ngay lập tức trong 10ms.
