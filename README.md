# 🏛️ 2Guide Smart AI Tour Guide & Customer Experience Engine v4.0
### *Hệ Thống Trợ Lý AI Hướng Dẫn Viên Ảo & Chăm Sóc Khách Hàng Chuẩn Quốc Tế — Di Tích Nhà Tù Hỏa Lò*

[![Benchmark Score](https://img.shields.io/badge/Benchmark_Điểm_Tổng-9.31%20%2F%2010.0-brightgreen.svg)](#)
[![Pass Rate](https://img.shields.io/badge/Holdout_Pass_Rate-100.0%25%20(500%2F500)-success.svg)](#)
[![Historical Ground Truth](https://img.shields.io/badge/Sử_Học_Ground_Truth-100.0%25%20(500%2F500)-blue.svg)](#)
[![Architecture](https://img.shields.io/badge/Kiến_Trúc-8_Tầng_Doanh_Nghiệp-purple.svg)](#)
[![Latency](https://img.shields.io/badge/Độ_Trễ_P50-18ms-yellow.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](#)

---

## 📌 I. TỔNG QUAN HỆ THỐNG V4.0

Hệ thống **2Guide AI Customer Experience Engine (Phiên bản v4.0)** là bước đột phá toàn diện, nâng cấp trợ lý ảo từ một công cụ tra cứu thông tin lịch sử tĩnh thành một **Trợ Lý Hội Thoại & Chuyên Viên Chăm Sóc Khách Hàng Toàn Diện** chuẩn quốc tế dành riêng cho Di tích Lịch sử Nhà tù Hỏa Lò (Hà Nội).

AI đồng thời đảm nhiệm xuất sắc **4 Vai Trò Cốt Lõi**:
1. 🏛️ **Historical Expert (Chuyên gia Lịch sử):** Nắm vững 100% niên đại, sự kiện, nhân vật, hiện vật lịch sử Hỏa Lò; tuyệt đối không bịa đặt (0% hallucination), phản bác dứt khoát các bẫy tin giả.
2. 🗺️ **Smart Tour Guide (Hướng dẫn viên Thông minh):** Điều hướng trực quan, đề xuất lộ trình tối ưu theo quỹ thời gian của khách (30 phút, 60-90 phút), tư vấn tour chuyên biệt (gia đình, trẻ nhỏ, đoàn đông).
3. 🤝 **Customer Care Agent (Chuyên viên CSKH Tận tâm):** Thấu cảm, xin lỗi chân thành khi khách có trải nghiệm chưa tốt, đưa ra hành động giải quyết cụ thể (đổi tai nghe rè, hỗ trợ mất đồ, tìm trẻ lạc, lối đi cho xe lăn, tủ gửi đồ miễn phí).
4. 💬 **Conversational AI (Trợ lý Hội thoại Tự nhiên):** Duy trì ngữ cảnh hội thoại đa lượt (Multi-turn Sessions), tự động giải mã đại từ thay thế (*"nó"*, *"vật này"*, *"khu đó"*, *"họ"*), hỗ trợ song ngữ Anh - Việt mượt mà.

---

## 🏗️ II. KIẾN TRÚC 8 TẦNG XỬ LÝ (ENTERPRISE PIPELINE)

Hệ thống được thiết kế theo mô hình phân tầng mô-đun hóa cao cấp, thay thế hoàn toàn các nhánh ghép nối văn mẫu cố định trước đây:

```mermaid
flowchart TD
    UQ["1. USER QUESTION (Câu hỏi đa ngữ & sai chính tả)"] --> NLP["2. INPUT PROCESSING (NLP Processor & Tiền xử lý)"]
    NLP --> INT["3. INTENT UNDERSTANDING (Phân loại 15 Ý định)"]
    INT --> CR["4. CONTEXT RETRIEVAL (Truy xuất Tri thức Đa nguồn)"]
    CR --> CE["5. CONFIDENCE EVALUATION (Đánh giá Độ tin cậy)"]
    CE --> AG["6. ANSWER GENERATION (Answer Composer & Bác bỏ Bẫy)"]
    AG --> AV["7. ANSWER VALIDATION (Kiểm duyệt Sự thật & Tinh chỉnh Văn phong)"]
    AV --> CC["8. CUSTOMER CARE & SESSION MANAGER (Quản lý Phiên Đa lượt)"]
    CC --> FR["9. FINAL RESPONSE (Phản hồi Hoàn chỉnh & Trực diện)"]

    subgraph KnowledgePool ["Kho Tri Thức & Dữ Liệu"]
        GT["500 Ground Truth Chuẩn Sử Học"]
        HD["13 Hồ Sơ Phân Khu Lịch Sử"]
        CD["6 Hồ Sơ Nghiệp Vụ CSKH & Trợ Năng"]
    end
    CR <--> KnowledgePool
```

### Các Mô-đun Lõi Đã Xây Dựng:
- **`engine/nlp_processor.js`**: Làm sạch mã độc / Prompt Injection, chuẩn hóa tiếng Việt không dấu, giải mã viết tắt, phát hiện ngôn ngữ (`vi`, `en`, `fr`), và phân giải đại từ ngữ cảnh hội thoại Unicode-safe.
- **`engine/intent_classifier.js`**: Phân loại chính xác 15 ý định người dùng (từ sự kiện lịch sử, thông số hiện vật, lộ trình, giá vé, giờ mở cửa đến xử lý khiếu nại, mất đồ, trợ năng và câu hỏi ngoài phạm vi).
- **`engine/knowledge_base.js`**: Kho tri thức nội bộ gồm 13 Hồ sơ phân khu, 6 Hồ sơ nghiệp vụ CSKH, và chỉ mục đảo TF-IDF lọc Stopwords có ràng buộc thực thể nghiêm ngặt (Entity Consistency: John McCain, 16 tử tù 1951 vs 100 cán bộ 1945, v.v.).
- **`engine/answer_composer.js`**: Trả lời thẳng vào trọng tâm ngay câu đầu tiên; xử lý bẫy tin giả; tích hợp Groq Cloud LLM (`qwen/qwen-2.5-32b`) sinh đáp án có căn cứ khi khách hỏi câu hỏi mở.
- **`engine/answer_validator.js`**: Bộ kiểm duyệt độc lập: gọt sạch văn mẫu lặp lại, đối chiếu dữ kiện cấm kỵ và bảo đảm chuẩn mực an toàn.
- **`engine/session_manager.js`**: Bộ nhớ phiên hội thoại đa lượt trong RAM với TTL 30 phút, hỗ trợ hỏi tiếp nối mượt mà.

---

## 📊 III. KẾT QUẢ KIỂM ĐỊNH TOÀN DIỆN TRÊN BỘ DỮ LIỆU ĐỘC LẬP (500 HOLDOUT CASES)

Được đo lường bằng bộ đánh giá độc lập **6 Tiêu chí Trọng số** (Chính xác 30%, Ý định 20%, Đầy đủ 15%, CSKH 15%, Tự nhiên 10%, An toàn 10%):

| Nhóm Kiểm Thử Độc Lập | Số Ca | Điểm Trung Bình (Thang 10) | Tỷ Lệ Đạt (Pass Rate) | Đặc Điểm Nổi Bật |
| :--- | :---: | :---: | :---: | :--- |
| **1. Historical Facts** | 100 | **9.41 / 10.0** | **100.0% (100/100)** | Khớp 100% nhân vật, niên đại, sự kiện lịch sử |
| **2. Exhibit Details** | 100 | **9.04 / 10.0** | **100.0% (100/100)** | Thông số chính xác (dao 50kg, cột 4m, búp bàng kiết lỵ) |
| **3. Customer Care** | 100 | **9.47 / 10.0** | **100.0% (100/100)** | Đồng cảm khiếu nại, chỉ dẫn bảo vệ mất đồ, xe đẩy em bé |
| **4. Tour Recommendation** | 50 | **9.15 / 10.0** | **100.0% (50/50)** | Tư vấn tuyến 30 phút, 90 phút, đoàn đông, tour đêm |
| **5. Conversational Follow-up**| 50 | **8.72 / 10.0** | **100.0% (50/50)** | Tự động hiểu *"nó"*, *"vật này"*, *"ở đó"* chuẩn xác |
| **6. Ambiguous & Typos** | 50 | **9.78 / 10.0** | **100.0% (50/50)** | Hiểu câu sai chính tả, không dấu, hỏi lại khi quá mơ hồ |
| **7. Out-of-scope & Traps** | 50 | **9.60 / 10.0** | **100.0% (50/50)** | Từ chối lịch sự câu hỏi ngoài lề; bác bỏ 100% bẫy sai dữ kiện |
| **🏆 TOÀN BỘ HỆ THỐNG** | **500** | **9.31 / 10.0** | **100.0% (500/500)** | **Đạt Chuẩn Xuất Sắc 9–10/10 Toàn Diện** |

⚡ **Độ trễ hệ thống:** Trung bình **24.78 ms** | P50: **18 ms** | P95: **58 ms** (Xử lý ~300 câu hỏi/giây).

---

## 🔄 IV. BẢNG SO SÁNH TRƯỚC VÀ SAU NÂNG CẤP

| Tiêu Chí Đánh Giá | Phiên Bản Cũ (v3.0) | Phiên Bản Mới (v4.0) | Đột Phá Đạt Được |
| :--- | :---: | :---: | :--- |
| **Khả năng CSKH (Customer Care)** | Không có (chỉ biết trả lời sử) | **Chuyên nghiệp 9.47/10** | Lắng nghe, xin lỗi, hướng dẫn bảo vệ, chỉ quầy vé/camera |
| **Văn phong phản hồi** | Máy móc, câu chào/kết lặp lại | **Tự nhiên, trả lời thẳng** | Câu đầu tiên đi thẳng vào trọng tâm, không rào đón |
| **Hội thoại đa lượt (Multi-turn)** | Mất ngữ cảnh, không hiểu đại từ | **Duy trì ngữ cảnh mượt mà** | Tự động thay thế *"nó"*, *"ở đó"* bằng hiện vật đang nói |
| **Chống bẫy sai dữ kiện (Traps)** | Dễ bị mớm cung, đồng tình số liệu ảo | **Bác bỏ dứt khoát 100%** | Khẳng định ngay *"Không phải..."* trước các số liệu sai |
| **Xử lý câu ngoài phạm vi** | Dễ nhầm hoặc trả lời sai | **Từ chối nhã nhặn, chuẩn mực** | Tôn trọng ranh giới di tích, không bịa đặt |
| **Độ trễ phản hồi (Latency)** | ~250 ms | **~24 ms (P50: 18 ms)** | **Nhanh hơn gấp 10 lần**, chịu tải cực cao |

---

## 🚀 V. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ

### 1. Khởi động AI Server (Port 4001)
```bash
cd kiemthu
node smart_ai_server.js
```

### 2. Chạy Kiểm định Benchmark Toàn diện 500 Ca Holdout Độc Lập
```bash
python benchmark/run_comprehensive_benchmark.py
```
*Tự động xuất 3 báo cáo:*
- 📄 Markdown: `benchmark/BENCHMARK_REPORT_500_HOLDOUT.md`
- 📊 Excel chi tiết: `benchmark/BENCHMARK_REPORT_500_HOLDOUT.xlsx`
- 💾 JSON: `benchmark/BENCHMARK_REPORT_500_HOLDOUT.json`

### 3. Chạy Kiểm định Hồi quy 500 Câu Chuẩn Sử Học Ban Đầu
```bash
python run_test_500.py
```
*Kết quả:* **100.0% (500/500 câu Đúng trọng tâm)**.

---

## 📜 BẢN QUYỀN & GIẤY PHÉP
Dự án được xây dựng và phát triển phục vụ công tác số hóa, bảo tồn và nâng tầm trải nghiệm du khách tại **Di tích Lịch sử Nhà tù Hỏa Lò** (Hà Nội, Việt Nam). Giấy phép MIT.
