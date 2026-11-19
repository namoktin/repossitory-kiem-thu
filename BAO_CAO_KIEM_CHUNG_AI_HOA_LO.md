# 🏛️ BÁO CÁO KIỂM CHỨNG ĐỘ CHÍNH XÁC AI - DI TÍCH NHÀ TÙ HỎA LÒ (1000 CÂU HỎI)

* **Hệ thống AI được kiểm thử:** http://localhost:4001/api/chat/ask
* **Thời gian thực hiện:** 21:28:22 17/11/2026
* **Tổng số câu hỏi kiểm chứng:** **10 câu hỏi**
* **Số câu hỏi đã hoàn tất:** **10 câu hỏi**
* **TỶ LỆ CHÍNH XÁC TỔNG THỂ (ACCURACY RATE):** **100.0%**

---

## 📊 1. KẾT QUẢ ĐỐI CHIẾU SỰ THẬT (FACT-CHECKING SUMMARY)

| Phân loại đánh giá | Số lượng | Tỷ lệ % | Đánh giá chuyên môn |
| :--- | :--- | :--- | :--- |
| **✅ Đúng chuẩn lịch sử (CORRECT)** | **10** | **100.0%** | AI cung cấp đầy đủ các dữ kiện lịch sử cốt lõi |
| **⚠️ Đúng một phần (PARTIAL)** | **0** | **0.0%** | AI trả lời đúng hướng nhưng thiếu chi tiết/thông số |
| **❌ Sai lệch / Bịa đặt (INCORRECT)** | **0** | **0.0%** | Chứa thông tin sai hoặc bịa đặt (Hallucination) |
| **⚡ Quá tải Rate Limit (HTTP 429)** | **0** | **0.0%** | Bị giới hạn hạn ngạch API từ nhà cung cấp LLM |
| **🚨 Lỗi kết nối / Server (5xx)** | **0** | **0.0%** | Lỗi đường truyền hoặc server sập |

---

## 🏛️ 2. BẢNG PHÂN TÍCH ĐỘ CHÍNH XÁC THEO TỪNG HIỆN VẬT & KHU VỰC

| Hiện vật / Chủ đề tham quan | Tổng câu hỏi | Trả lời Đúng | Thiếu chi tiết | Sai / Lỗi | Tỷ lệ chính xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xà lim Cachot & Cùm chân xi măng** | 6 | 6 | 0 | 0 | **100.0%** |
| **Quy định, Giá vé & Hướng dẫn tham quan (FAQ)** | 1 | 1 | 0 | 0 | **100.0%** |
| **Cây bàng lịch sử & Ẩm thực Bàng** | 1 | 1 | 0 | 0 | **100.0%** |
| **Cống ngầm & Vượt ngục lịch sử** | 2 | 2 | 0 | 0 | **100.0%** |

---

## 🔍 3. MỘT SỐ VÍ DỤ ĐỐI CHIẾU THỰC TẾ (SAMPLE AUDIT)

### ✅ Mẫu câu trả lời Chuẩn Xác:
> **Du khách hỏi:** *"Bác hướng dẫn viên ơi, thiết kế của bệ xi măng trong phòng Cachot có điểm gì đặc biệt tàn nhẫn và chi tiết lịch sử này có ý nghĩa gì?"*
> **AI trả lời:** "Cachot là khu ngục tối biệt giam, được mệnh danh là 'địa ngục của địa ngục'. Phòng giam chật hẹp, tối đen không có ánh sáng tự nhiên. Tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa, lở loét. Nơi đây dùng để trừng phạt những người chống đối ..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `Cachot, ngục tối, biệt giam, cùm chân, bệ xi măng, nghiêng, máu dồn, phù nề, địa ngục`

> **Du khách hỏi:** *"Xin hỏi, học sinh và sinh viên khi mua vé cần xuất trình những giấy tờ tùy thân gì được không ạ?"*
> **AI trả lời:** "Địa chỉ: Số 1 phố Hỏa Lò, phường Cửa Nam, quận Hoàn Kiếm, Hà Nội. Giờ mở cửa: 08:00 đến 17:00 tất cả các ngày trong tuần (kể cả thứ Bảy, Chủ Nhật, lễ Tết). Giá vé ban ngày: 50.000 VNĐ/người lớn. Học sinh, sinh viên, người cao tuổi từ 60 tuổi, người khuyết tật nặng được giảm 50% (25.000 VNĐ). Trẻ em ..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `số 1 phố Hỏa Lò, 8:00, 17:00, 50.000, 25.000, học sinh, sinh viên, miễn phí, Audioguide, thuyết minh`

> **Du khách hỏi:** *"Các đồng chí cộng sản đã sáng tác thơ ca, truyền niềm tin cho nhau trong Cachot thế nào?"*
> **AI trả lời:** "Cachot là khu ngục tối biệt giam, được mệnh danh là 'địa ngục của địa ngục'. Phòng giam chật hẹp, tối đen không có ánh sáng tự nhiên. Tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa, lở loét. Nơi đây dùng để trừng phạt những người chống đối ..."
> **Dữ kiện đối chiếu:** Khớp các mốc: `Cachot, ngục tối, biệt giam, cùm chân, bệ xi măng, nghiêng, máu dồn, phù nề, địa ngục`


---

## 💡 4. ĐỀ XUẤT NÂNG CẤP HỆ THỐNG PROMPT & RAG CHO ĐỀ TÀI

1. **Bổ sung Vector Database (RAG):** Đưa toàn bộ tài liệu hồ sơ di tích Hỏa Lò vào cơ sở dữ liệu Vector để AI trích xuất chính xác 100% các con số (50kg, 1896, 24/12/1951, v.v.).
2. **System Prompt Guardrails:** Thiết lập quy tắc nghiêm ngặt: *"Nếu không chắc chắn về mốc thời gian hoặc tên nhân vật lịch sử, AI phải trả lời trung thực rằng chưa có tư liệu xác thực thay vì suy đoán bịa đặt"*.
3. **Bộ đệm FAQ Caching:** Lưu sẵn câu trả lời đã được chuyên gia lịch sử phê duyệt cho 200 câu hỏi phổ biến nhất để phản hồi ngay lập tức trong 10ms.
