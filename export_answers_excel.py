"""
Xuất toàn bộ câu trả lời của AI cho 500 câu hỏi ra file Excel (.xlsx) và CSV chuẩn bảng tính.
Phiên bản v3.2 - Bổ sung cột Đáp án tham chiếu chuẩn sử học (Ground Truth) và Kết quả kiểm định chi tiết.
"""

import json
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

base_dir = r"C:\Users\Nam\Desktop\tp\kiemthu"
json_path = os.path.join(base_dir, "BAO_CAO_KIEM_THU_500_CAU_MOI.json")
xlsx_out = os.path.join(base_dir, "CAU_TRA_LOI_AI_500_CAU_HOA_LO.xlsx")
csv_out = os.path.join(base_dir, "CAU_TRA_LOI_AI_500_CAU_HOA_LO.csv")

print(f"Loading results from {json_path}...")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

results = data.get("results", [])
print(f"Loaded {len(results)} items.")

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "500 Câu Trả Lời Chuẩn AI"
ws.views.sheetView[0].showGridLines = True

headers = [
    "STT",
    "Mã Câu Hỏi",
    "Phân Khu / Điểm Tham Quan",
    "Hiện Vật / Di Tích Liên Quan",
    "Loại Câu Hỏi",
    "Câu Hỏi Của Du Khách",
    "ĐÁP ÁN THAM CHIẾU CHUẨN SỬ HỌC (GROUND TRUTH)",
    "CÂU TRẢ LỜI CỦA AI (2GUIDE HERITAGE ENGINE)",
    "Thời Gian Phản Hồi (ms)",
    "Động Cơ Xử Lý (Provider)",
    "Đánh Giá Kiểm Định Thực Tế",
    "Ghi Chú Đánh Giá"
]

ws.append(headers)

# Styling header
header_font = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid") # Dark Blue
header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

ws.row_dimensions[1].height = 28
for c_idx in range(1, len(headers) + 1):
    cell = ws.cell(row=1, column=c_idx)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_align
    cell.border = thin_border

# Populate rows
body_font = Font(name="Segoe UI", size=9.5)
align_center = Alignment(horizontal="center", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_left_wrap = Alignment(horizontal="left", vertical="center", wrap_text=True)

fill_correct = PatternFill(start_color="E8F5E9", end_color="E8F5E9", fill_type="solid") # Light Green
fill_general = PatternFill(start_color="FFF9C4", end_color="FFF9C4", fill_type="solid") # Light Yellow
fill_incorrect = PatternFill(start_color="FFEBEE", end_color="FFEBEE", fill_type="solid") # Light Red

for idx, r in enumerate(results, start=2):
    cat = r.get("audit_category", "Đúng trọng tâm (True Specific)")
    row_vals = [
        r.get("stt", idx - 1),
        r.get("id", f"HL-{idx-1:03d}"),
        r.get("area", ""),
        r.get("artifact", ""),
        r.get("q_type", ""),
        r.get("question", ""),
        r.get("ref_answer", ""),
        r.get("reply", ""),
        r.get("latency_ms", 0),
        r.get("provider", ""),
        cat,
        r.get("reason", "")
    ]
    ws.append(row_vals)
    ws.row_dimensions[idx].height = 45

    ws.cell(row=idx, column=1).alignment = align_center
    ws.cell(row=idx, column=2).alignment = align_center
    ws.cell(row=idx, column=3).alignment = align_left_wrap
    ws.cell(row=idx, column=4).alignment = align_left_wrap
    ws.cell(row=idx, column=5).alignment = align_center
    ws.cell(row=idx, column=6).alignment = align_left_wrap
    ws.cell(row=idx, column=7).alignment = align_left_wrap
    ws.cell(row=idx, column=8).alignment = align_left_wrap
    ws.cell(row=idx, column=9).alignment = align_right
    ws.cell(row=idx, column=10).alignment = align_center
    ws.cell(row=idx, column=11).alignment = align_center
    ws.cell(row=idx, column=12).alignment = align_left_wrap

    if "Đúng trọng tâm" in cat:
        ws.cell(row=idx, column=11).fill = fill_correct
    elif "Đúng phân khu" in cat:
        ws.cell(row=idx, column=11).fill = fill_general
    else:
        ws.cell(row=idx, column=11).fill = fill_incorrect

    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=idx, column=c)
        cell.font = body_font
        cell.border = thin_border

ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:L{len(results)+1}"

widths = {
    1: 8,   # STT
    2: 12,  # Mã
    3: 26,  # Phân khu
    4: 26,  # Hiện vật
    5: 20,  # Loại câu hỏi
    6: 50,  # Câu hỏi
    7: 60,  # Ground Truth
    8: 60,  # Trả lời AI
    9: 12,  # ms
    10: 25, # Động cơ
    11: 22, # Đánh giá
    12: 35  # Ghi chú
}

for c_idx, w in widths.items():
    ws.column_dimensions[get_column_letter(c_idx)].width = w

print(f"Saving XLSX to {xlsx_out}...")
wb.save(xlsx_out)
print("XLSX saved successfully!")

# Đồng thời xuất thêm bản CSV với sep=,
print(f"Saving CSV to {csv_out}...")
with open(csv_out, "w", encoding="utf-8-sig") as f:
    f.write("sep=,\n")
    f.write('"' + '","'.join(headers) + '"\n')
    for r in results:
        q_clean = str(r.get("question", "")).replace('"', '""')
        ref_clean = str(r.get("ref_answer", "")).replace('"', '""')
        rep_clean = str(r.get("reply", "")).replace('"', '""')
        reason_clean = str(r.get("reason", "")).replace('"', '""')
        row_str = f'"{r.get("stt")}","{r.get("id")}","{r.get("area")}","{r.get("artifact")}","{r.get("q_type")}","{q_clean}","{ref_clean}","{rep_clean}","{r.get("latency_ms")}","{r.get("provider")}","{r.get("audit_category")}","{reason_clean}"\n'
        f.write(row_str)

print("CSV saved successfully!")
print("ALL DONE!")
