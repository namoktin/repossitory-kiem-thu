# 📊 BÁO CÁO KIỂM THỬ CHỊU TẢI SERVER (LOAD & STRESS TEST REPORT)

* **Hệ thống kiểm thử:** http://localhost:4001/api/chat/ask
* **Thời gian thực hiện:** 23:46:30 17/11/2026
* **Tổng số Request yêu cầu:** **10000 requests**
* **Số luồng đồng thời (Concurrency):** **40 workers**
* **Tổng thời gian kiểm thử:** **25.53 giây**

---

## ⚡ 1. CHỈ SỐ HIỆU NĂNG TỔNG QUAN

| Chỉ số kiểm thử | Giá trị đo được | Đánh giá |
| :--- | :--- | :--- |
| **Tỷ lệ thành công (Success Rate)** | **100.00%** (10000/10000) | ✅ Rất tốt |
| **Tốc độ xử lý (RPS)** | **391.65 req/s** | Tải trung bình hệ thống đáp ứng được |
| **Bị giới hạn tần suất (HTTP 429)** | **0 requests** | ✅ Không bị chặn |
| **Lỗi hệ thống (5xx / Timeout)** | **0 requests** | ✅ Ổn định tuyệt đối |

---

## ⏱️ 2. PHÂN TÍCH ĐỘ TRỄ PHẢN HỒI (LATENCY)

> Độ trễ tính bằng mili-giây (ms), phản ánh thời gian từ lúc gửi câu hỏi đến khi nhận đủ câu trả lời từ AI.

* **Nhanh nhất (Min):** `1 ms`
* **Trung bình (Average):** `100 ms`
* **Phổ thông (Median P50):** `95 ms` (50% người dùng nhận câu trả lời trong khoảng này)
* **P90 (90% người dùng):** `173 ms`
* **P95 (95% người dùng):** `208 ms`
* **Chậm nhất (Max):** `1473 ms`

---

## 📈 3. PHÂN BỐ MÃ PHẢN HỒI HTTP (HTTP STATUS CODES)

```json
{
  "200": 10000
}
```

---

## 💡 4. NHẬN XÉT & KẾT LUẬN CHO ĐỒ ÁN / ĐỀ TÀI

1. **Khả năng chịu tải đồng thời:** Hệ thống đã hoàn thành đợt kiểm thử với **10000 request** ở mức đồng thời **40 kết nối**.
2. **Nút thắt cổ chai (Bottleneck):** Hệ thống xử lý mượt mà, không gặp lỗi nghẽn cổ chai nghiêm trọng.
3. **Khuyến nghị tối ưu:** Tích hợp bộ đệm phản hồi (AI Response Caching) cho các câu hỏi phổ biến để giảm 70% số lần gọi LLM bên ngoài và tăng tốc độ phản hồi về dưới 50ms.
