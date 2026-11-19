"""
Script chuyển đổi bộ dữ liệu 10.000 câu hỏi Hỏa Lò sang file Microsoft Excel (.xlsx) chuẩn
Định dạng bảng biểu chuyên nghiệp, tự động căn chỉnh độ rộng cột, đóng băng dòng tiêu đề (Freeze Panes),
và kẻ viền bảng để người dùng mở lên là thấy ngay bảng tính Excel hoàn hảo.
"""

import json
import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

base_dir = r"C:\Users\Nam\Desktop\tp\kiemthu"
json_path = os.path.join(base_dir, "data", "10000_cau_hoi_hoa_lo.json")
xlsx_path = os.path.join(base_dir, "data", "10000_cau_hoi_hoa_lo.xlsx")
csv_path = os.path.join(base_dir, "data", "10000_cau_hoi_hoa_lo.csv")

print(f"Loading JSON from {json_path}...")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Creating Excel workbook with {len(data)} rows...")
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "10.000 Câu Hỏi Hỏa Lò"

headers = [
    "STT",
    "Mã Câu Hỏi",
    "Phân Khu / Hiện Vật",
    "Điểm Tham Quan POI",
    "Câu Hỏi Của Du Khách",
    "Từ Khóa Lịch Sử Cốt Lõi",
    "Đáp Án Chuẩn Lịch Sử (Ground Truth)"
]

ws.append(headers)

# Styling header
header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid") # Dark Blue Heritage
header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

for col_num in range(1, len(headers) + 1):
    cell = ws.cell(row=1, column=col_num)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment
    cell.border = thin_border

ws.row_dimensions[1].height = 28

# Populate data
body_font = Font(name="Segoe UI", size=10)
body_align_left = Alignment(horizontal="left", vertical="center")
body_align_center = Alignment(horizontal="center", vertical="center")

for idx, item in enumerate(data, start=2):
    kw_str = ", ".join(item.get("expected_keywords", []))
    row_vals = [
        item.get("index", idx - 1),
        item.get("id", f"HL_{idx-1:05d}"),
        item.get("category", ""),
        item.get("target_poi", ""),
        item.get("question", ""),
        kw_str,
        item.get("ground_truth_summary", "")
    ]
    ws.append(row_vals)

    # Style row
    ws.cell(row=idx, column=1).alignment = body_align_center
    ws.cell(row=idx, column=2).alignment = body_align_center
    ws.cell(row=idx, column=3).alignment = body_align_left
    ws.cell(row=idx, column=4).alignment = body_align_left
    ws.cell(row=idx, column=5).alignment = body_align_left
    ws.cell(row=idx, column=6).alignment = body_align_left
    ws.cell(row=idx, column=7).alignment = body_align_left

    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=idx, column=c)
        cell.font = body_font
        cell.border = thin_border

# Đóng băng dòng tiêu đề (Freeze Panes row 1)
ws.freeze_panes = "A2"

# Thiết lập độ rộng cột cố định hợp lý
col_widths = {
    1: 8,   # STT
    2: 14,  # Mã Câu Hỏi
    3: 32,  # Phân Khu / Hiện Vật
    4: 30,  # Điểm Tham Quan POI
    5: 65,  # Câu Hỏi Của Du Khách
    6: 45,  # Từ Khóa
    7: 70   # Đáp Án Chuẩn
}

for col_idx, width in col_widths.items():
    col_letter = get_column_letter(col_idx)
    ws.column_dimensions[col_letter].width = width

# Bật bộ lọc AutoFilter
ws.auto_filter.ref = f"A1:G{len(data)+1}"

print(f"Saving XLSX to {xlsx_path}...")
wb.save(xlsx_path)
print("XLSX saved successfully!")

# Đồng thời sửa lại file CSV: thêm chỉ thị "sep=," ở đầu để Excel nhận diện bảng lập tức khi double-click
print("Re-formatting CSV with sep=, header for Excel compatibility...")
with open(csv_path, "r", encoding="utf-8-sig") as f:
    csv_text = f.read()

# Đảm bảo CSV có BOM và chỉ thị sep=,
if not csv_text.startswith("sep=,"):
    new_csv = "sep=,\n" + csv_text.lstrip('\ufeff')
    with open(csv_path, "w", encoding="utf-8-sig") as f:
        f.write(new_csv)
    print("CSV updated with sep=,!")

print("All Done!")
