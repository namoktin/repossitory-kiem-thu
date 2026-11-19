@echo off
title 2Guide AI Verification & Stress Test Lab
color 0b
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   TRẠM KIỂM THỬ TẢI & KIỂM CHỨNG AI - NHÀ TÙ HỎA LÒ
echo ========================================================
echo.
echo [1] Chạy Giao diện Web Dashboard Trực quan (Khuyên dùng)
echo     (Có cả Tab Chịu Tải 1000 reqs & Tab Kiểm Chứng 1000 câu hỏi Hỏa Lò)
echo.
echo [2] Chạy Ngay 1000 Requests Kiểm Thử Chịu Tải (Terminal)
echo     (Bắn tải đo RPS, độ trễ P95, chịu tải máy chủ)
echo.
echo [3] Chạy Ngay Kiểm Chứng Độ Chính Xác 1000 Câu Hỏi Hỏa Lò (Terminal)
echo     (Fact-Checking: Đối chiếu AI nói đúng hay sai/bịa đặt)
echo.
echo [4] Chạy Thử Nhanh 20 Câu Hỏi Hỏa Lò (Test nhanh độ đúng của AI)
echo.
echo [5] Thoát
echo --------------------------------------------------------
set /p opt="Lựa chọn của bạn (1/2/3/4/5): "

if "%opt%"=="1" goto web
if "%opt%"=="2" goto stress1000
if "%opt%"=="3" goto verify1000
if "%opt%"=="4" goto verify20
if "%opt%"=="5" exit

:web
cls
echo Đang mở Web Dashboard trên http://localhost:5050 ...
start "" "http://localhost:5050"
node server.js
pause
exit

:stress1000
cls
echo ========================================================
echo   BẮT ĐẦU BẮN 1000 REQUESTS KIỂM THỬ CHỊU TẢI
echo ========================================================
echo Mục tiêu: http://localhost:4000/api/chat/ask
echo Số luồng: 20 workers đồng thời
echo.
node stress_test.js --url http://localhost:4000/api/chat/ask --total 1000 --concurrency 20
echo.
pause
exit

:verify1000
cls
echo ========================================================
echo   BẮT ĐẦU ĐỐI CHIẾU 1000 CÂU HỎI LỊCH SỬ HỎA LÒ
echo ========================================================
echo Mục tiêu: http://localhost:4000/api/chat/ask
echo Kiểm tra: 10 chủ đề hiện vật & sự thật lịch sử
echo.
node ai_verifier.js --url http://localhost:4000/api/chat/ask --limit 1000 --concurrency 10
echo.
pause
exit

:verify20
cls
echo ========================================================
echo   CHẠY THỬ NHANH 20 CÂU HỎI HỎA LÒ
echo ========================================================
node ai_verifier.js --url http://localhost:4000/api/chat/ask --limit 20 --concurrency 5
echo.
pause
exit
