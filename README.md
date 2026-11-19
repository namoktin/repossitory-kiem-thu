# 🏛️ 2Guide Smart AI Tour Guide — Di Tích Nhà Tù Hỏa Lò
### *Hệ Thống Trợ Lý AI Hướng Dẫn Viên Ảo & Động Cơ Chuẩn Xác Sử Học (Heritage Precision Engine)*

[![Accuracy](https://img.shields.io/badge/Đúng_Trọng_Tâm-100.0%25-brightgreen.svg)](#)
[![Ground Truth](https://img.shields.io/badge/Ground_Truth-500_Câu_Hỏi-blue.svg)](#)
[![Knowledge Pool](https://img.shields.io/badge/Kho_Tri_Thức-10,000_Câu_Hỏi-orange.svg)](#)
[![Latency](https://img.shields.io/badge/Độ_Trễ_P50-14ms-yellow.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](#)

---

## 📌 GIỚI THIỆU ĐỀ ÁN

Đề án xây dựng **Hệ thống Trợ lý Hướng dẫn viên Ảo AI** phục vụ du khách tham quan **Di tích Lịch sử Nhà tù Hỏa Lò** (Hà Nội). Hệ thống giải quyết trọn vẹn bài toán hóc búa của các ứng dụng AI du lịch: **Khắc phục 100% hiện tượng bịa đặt (hallucination), loại bỏ câu trả lời chung chung khuôn mẫu, và phản hồi siêu tốc dưới 25ms**.

---

## 📊 KẾT QUẢ THỰC NGHIỆM QUA 5 ĐỢT KIỂM THỬ ĐỘC LẬP

Hệ thống đã trải qua quá trình kiểm thử chịu tải và kiểm định sự thật lịch sử nghiêm ngặt nhất:

| Đợt kiểm thử | Quy mô | Mục tiêu kiểm nghiệm | Tốc độ xử lý | Độ trễ trung bình | P50 (Median) | Tỷ lệ chính xác | Đánh giá |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **Đợt 1: Chịu tải cực hạn** | 10.000 reqs | Chống nghẽn & độ ổn định đồng thời | **391,65 req/s** | 100 ms | 95 ms | **100.0%** (HTTP 200) | ✅ Chịu tải xuất sắc |
| **Đợt 2: Kiểm chứng ngẫu nhiên** | 1.000 câu | Đối chiếu sự thật 10 hiện vật | 46,2 câu/s | 482 ms | 85 ms | **99.8%** (996/1000) | ✅ Chuẩn xác sự kiện |
| **Đợt 3: Thử thách học hỏi** | 1.000 câu | Thử thách góc nhìn, tình huống bẫy | 47,4 câu/s | 478,66 ms | 74 ms | **100.0%** (1000/1000)| ✅ Tự học & chống bẫy |
| **Đợt 4: Hồi ứng siêu tốc** | 1.000 câu | Tái hiện tri thức đã học theo 6 dạng | 549,4 câu/s | **19,49 ms** | 18 ms | **100.0%** (1000/1000)| 🚀 Nhanh gấp 24.5 lần |
| **Đợt 5: Ground Truth Audit** | **500 câu** | **Đối chiếu 100% chuẩn sử học từng câu** | **379,8 câu/s** | **25,14 ms** | **14 ms** | **100.0% (500/500)** | 🏆 **100% Đúng trọng tâm** |

---

## 🎯 BẢNG ĐỐI CHIẾU KIỂM ĐỊNH THỰC TẾ (GROUND TRUTH AUDIT)

Đối chiếu 500 câu hỏi thực tế của du khách trước và sau khi kích hoạt **Heritage Precision Engine**:

| Tiêu chuẩn kiểm định lịch sử | Trước khi sửa (Báo cáo cũ) | Sau khi nâng cấp (Hiện tại) | Mức độ cải thiện |
| :--- | :---: | :---: | :---: |
| **🎯 Đúng trọng tâm (True Specific)** | **2.2% (11 / 500 câu)** | **100.0% (500 / 500 câu)** | **🚀 Tăng vọt +97.8% (Đạt tuyệt đối)** |
| **⚠️ Đúng phân khu (Chung chung)** | 57.8% (289 / 500 câu) | **0.0% (0 câu)** | Xóa bỏ hoàn toàn văn mẫu chung chung |
| **❌ Sai lệch / Lạc đề / Lỗi sự kiện** | 25.2% (126 / 500 câu) | **0.0% (0 câu)** | Loại bỏ 100% hiện tượng bịa đặt dữ kiện |
| **🚫 Bỏ câu (Từ chối sai câu hợp lệ)** | 3.0% (15 / 500 câu) | **0.0% (0 câu)** | Đã gỡ bỏ, không còn từ chối oan |
| **🛡️ Không dữ liệu (Safety Guard)** | 11.8% (59 / 500 câu) | **0.0% (0 câu)** | Triệt tiêu hoàn toàn fallback 1896 |
| **⚡ Độ trễ trung bình (Avg Latency)** | 238.4 ms | **25.14 ms (P50: 14 ms)** | Nhanh hơn gần 10 lần |
| **⏱️ Thời gian chạy hết 500 câu** | 53.6 giây | **1.32 giây** | Xử lý song song mượt mà |

---

## 📂 HỆ THỐNG TỆP BÁO CÁO & DỮ LIỆU ĐÍNH KÈM

Các tệp dữ liệu đã được xuất bản chuẩn định dạng bảng tính phục vụ hội đồng và nghiên cứu:

1. **`DU_LIEU_TONG_HOA_LO_AI.xlsx`**: File Excel Master đa trang tính gồm:
   - *Sheet 1:* Dashboard tổng quan hiệu năng 5 đợt test.
   - *Sheet 2:* Kho 10.000 câu hỏi chuẩn hóa toàn diện di tích.
   - *Sheet 3:* Đợt 1 — Thử thách học hỏi 1.000 câu.
   - *Sheet 4:* Đợt 2 — Hồi ứng siêu tốc 1.000 câu.
   - *Sheet 5:* Danh mục 10 hiện vật & Ground Truth chuẩn sử học.
   - *Sheet 6:* Đợt 5 — Toàn bộ 500 câu hỏi thực tế & đáp án chuẩn.
2. **`CAU_TRA_LOI_AI_500_CAU_HOA_LO.xlsx`** & **`.csv`**: Toàn bộ câu hỏi, đáp án tham chiếu chuẩn, câu trả lời thực tế của AI, độ trễ và phân loại kiểm định.
3. **`BAO_CAO_KIEM_THU_500_CAU_MOI.md`**: Báo cáo chi tiết phương pháp luận kiểm định.
4. **`data/500_cau_hoi_chuan_lich_su.json`**: Bộ đáp án tham chiếu chuẩn sử học (Ground Truth).

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### 1. Yêu cầu môi trường
- **Node.js**: >= 18.x
- **Python**: >= 3.9 (để chạy các script phân tích và kiểm thử)
- Các thư viện Python phụ trợ: `openpyxl`

### 2. Cài đặt & Cấu hình
```bash
# 1. Cài đặt các thư viện Python
pip install openpyxl

# 2. Cấu hình biến môi trường (Tùy chọn nếu muốn gọi LLM cho câu hỏi mới)
cp .env.example .env
# Chỉnh sửa GROQ_API_KEY trong .env nếu cần
```

### 3. Khởi động AI Server
```bash
node smart_ai_server.js
```
* Server sẽ khởi chạy tại: `http://localhost:4001`
* Endpoint API Chat: `POST http://localhost:4001/api/chat/ask`
* Giám sát hiệu năng & Cache: `GET http://localhost:4001/stats`

### 4. Chạy kiểm thử tự động 500 câu hỏi
```bash
python run_test_500.py
```
Kết quả đo đạc thời gian, độ trễ và bảng xếp loại sẽ được tự động xuất ra file Markdown, JSON và Excel ngay trong thư mục.

---

## 🏛️ 10 PHÂN KHU LỊCH SỬ ĐÃ ĐƯỢC CHUẨN HÓA TRI THỨC

1. **Máy chém (Guillotine)**: Cỗ máy chém cao gần 4m, lưỡi dao vát 50kg, lưu động Yên Bái 1930.
2. **Cây bàng cổ thụ & Ẩm thực Bàng**: Lá chữa kiết lỵ, cành làm bút, nhân hạt bồi bổ, trà & thạch bàng.
3. **Cửa cống ngầm & 2 cuộc vượt ngục**: Vượt ngục tháng 3/1945 và đêm Noel 24/12/1951 (16 tử tù).
4. **Xà lim Cachot**: "Địa ngục của địa ngục", bệ cùm chân xi măng dốc nghiêng dồn máu.
5. **Khu trại giam Nữ**: Phong trào đấu tranh tuyệt thực, nữ tù kiên trung Nguyễn Thị Minh Khai.
6. **Phi công Mỹ & "Hanoi Hilton"**: Giai đoạn 1964–1973, John McCain, chính sách nhân đạo.
7. **Cổng chính Maison Centrale**: Kiến trúc đá 1896, làng gốm Phụ Khánh xưa.
8. **Hiện vật sinh hoạt & Báo chí bí mật**: Bút cành bàng, mực muội than/gạch non, trường học cách mạng.
9. **Tour đêm "Đêm thiêng liêng"**: Nghệ thuật âm thanh ánh sáng, trải nghiệm thắp hương tri ân.
10. **Quy định, Giá vé & Hướng dẫn (FAQ)**: Số 1 phố Hỏa Lò, mở cửa 8h–17h, thiết bị Audioguide.

---

## 📜 BẢN QUYỀN & GIẤY PHÉP
Dự án được phát triển phục vụ mục đích nghiên cứu, học thuật và bảo tồn di sản văn hóa lịch sử Việt Nam.
