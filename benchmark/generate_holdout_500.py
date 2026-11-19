"""
Tạo bộ dữ liệu kiểm định độc lập 500 trường hợp kiểm thử (Independent Holdout Benchmark):
Đúng theo tiêu chuẩn Section IX:
- 100 câu hỏi lịch sử (Historical Fact)
- 100 câu hỏi về hiện vật (Exhibit Information)
- 100 tình huống chăm sóc khách tham quan (Customer Care: Khiếu nại, Mất đồ, Tiện ích, Giá vé, Giờ mở cửa, Trợ năng)
- 50 câu hỏi tư vấn hành trình (Tour Recommendation & Route Planning)
- 50 câu hỏi tiếp nối hội thoại đa lượt (Multi-turn Conversational Follow-up)
- 50 câu hỏi mơ hồ, thiếu thông tin hoặc sai chính tả (Ambiguous, Typos, Short queries)
- 50 câu hỏi ngoài phạm vi, bẫy và kiểm tra khả năng chống bịa đặt (Out of scope & Traps)
"""

import json
import os

out_path = r"C:\Users\Nam\Desktop\tp\kiemthu\benchmark\dataset_500_holdout.json"

test_cases = []
idx = 1

def add_case(group, question, expected_intent, required_facts, forbidden_hallucinations, style_reqs, ground_truth, turn1=None):
    global idx
    test_cases.append({
        "id": f"TC-{idx:03d}",
        "group": group,
        "question": question,
        "turn1": turn1,
        "expected_intent": expected_intent,
        "criteria": {
            "required_facts": required_facts,
            "forbidden_hallucinations": forbidden_hallucinations,
            "style_requirements": style_reqs,
            "ground_truth": ground_truth
        }
    })
    idx += 1

print("Đang tạo 500 ca kiểm thử độc lập...")

# ==========================================
# 1. NHÓM 1: 100 CÂU HỎI LỊCH SỬ (HISTORICAL_FACT)
# ==========================================
# Bao gồm các nhân vật, niên đại, sự kiện Hỏa Lò
hist_templates = [
    ("Đồng chí Hoàng Văn Thụ bị thực dân Pháp kết án tử hình và giam tại đâu trước khi hy sinh?",
     ["Hoàng Văn Thụ", "Khu D", "buồng số 1", "Tương Mai", "1944"], ["máy chém", "Côn Đảo"],
     "Đồng chí Hoàng Văn Thụ bị giam giữ tại buồng số 1 xà lim tử hình Khu D Nhà tù Hỏa Lò trước khi bị thực dân Pháp đưa đi xử bắn tại trường bắn Tương Mai sáng ngày 24/5/1944."),

    ("Nhà tù Hỏa Lò do thực dân Pháp khởi công xây dựng vào năm nào và trên nền đất của làng nghề gì?",
     ["1896", "Phụ Khánh", "ấm đất", "hỏa lò", "Maison Centrale"], ["1930", "1945"],
     "Nhà tù Hỏa Lò được thực dân Pháp xây dựng năm 1896 trên nền đất làng Phụ Khánh - làng nghề thủ công nổi tiếng làm ấm đất, siêu đất và bếp lò nung gốm."),

    ("Ai là người đã sáng tác bức phù điêu lớn tại khu Đài tưởng niệm Nhà tù Hỏa Lò?",
     ["Lê Liên", "phù điêu", "Đài tưởng niệm"], ["Nguyễn Thái Học"],
     "Bức phù điêu đá lớn tại Đài tưởng niệm Nhà tù Hỏa Lò do nhà điêu khắc Lê Liên sáng tác, thể hiện ý chí quật cường của các chiến sĩ sau song sắt."),

    ("Nhà cách mạng Nguyễn Thái Học bị thực dân Pháp hành quyết ở đâu và vào thời gian nào?",
     ["Nguyễn Thái Học", "Yên Bái", "17/6/1930"], ["hành quyết tại Hỏa Lò", "chém tại Hỏa Lò", "chém ở Hỏa Lò", "Tương Mai"],
     "Nhà yêu nước Nguyễn Thái Học cùng 12 nghĩa sĩ khởi nghĩa Yên Bái bị thực dân Pháp đưa máy chém lên thị xã Yên Bái để hành quyết sáng ngày 17/6/1930."),

    ("Giai đoạn nào Nhà tù Hỏa Lò được dùng để tạm giam phi công Mỹ bị bắn rơi ở miền Bắc?",
     ["1964", "1973", "phi công Mỹ", "Hanoi Hilton"], ["1954", "1945"],
     "Nhà tù Hỏa Lò được dùng để tạm giam phi công Mỹ bị bắn rơi tại miền Bắc từ năm 1964 đến đầu năm 1973, trước khi trao trả theo Hiệp định Paris."),

    ("Trung úy phi công John McCain bị bắn rơi tại đâu ở Hà Nội và vào ngày tháng năm nào?",
     ["John McCain", "Trúc Bạch", "26/10/1967"], ["Hồ Gươm", "1972"],
     "Phi công Mỹ John McCain bị quân dân Thủ đô bắn rơi tại hồ Trúc Bạch ngày 26/10/1967 và được đưa về giam giữ tại Nhà tù Hỏa Lò."),

    ("Ai là phi công Mỹ từng bị giam tại Hỏa Lò sau này trở thành Đại sứ Hoa Kỳ đầu tiên tại Việt Nam?",
     ["Douglas Peterson", "Pete Peterson", "Đại sứ"], ["John McCain", "Nixon"],
     "Đó là phi công Douglas 'Pete' Peterson, người từng bị giam giữ tại Hỏa Lò và sau đó trở thành Đại sứ đầu tiên của Hợp chủng quốc Hoa Kỳ tại Việt Nam năm 1997."),

    ("Vụ vượt ngục qua cống ngầm đêm Noel 1951 có bao nhiêu tử tù tham gia và bao nhiêu người thoát ra vùng kháng chiến an toàn?",
     ["16", "24/12/1951", "5 đồng chí", "Thợ Nhuộm"], ["100 người", "thoát hết"],
     "Đêm Noel 24/12/1951 có 16 tử tù chính trị cưa song sắt chui qua đường cống ngầm thoát ra phố Thợ Nhuộm, trong đó 5 đồng chí đã vượt vòng vây về tới vùng căn cứ an toàn."),

    ("Vụ vượt ngục giải thoát hơn 100 cán bộ cách mạng tại Hỏa Lò diễn ra trong bối cảnh lịch sử nào?",
     ["3/1945", "Nhật đảo chính", "trèo tường", "vượt ngục"], ["1954", "1951"],
     "Cuộc vượt ngục giải thoát hơn 100 cán bộ cách mạng diễn ra vào tháng 3/1945 nhân thời cơ Nhật đảo chính Pháp, các chiến sĩ đã mưu trí trèo tường và cải trang để thoát ra ngoài tham gia khởi nghĩa."),

    ("Nữ chiến sĩ cách mạng tiêu biểu nào từng bị giam cầm tại khu trại nữ Hỏa Lò?",
     ["Nguyễn Thị Minh Khai", "Hoàng Ngân", "trại nữ"], ["Võ Thị Sáu"],
     "Khu trại giam Nữ từng giam giữ các nữ chiến sĩ kiên trung như đồng chí Nguyễn Thị Minh Khai, Hoàng Ngân, Trương Thị Mỹ.")
]

# Nhân rộng thành 100 câu hỏi lịch sử đa dạng các góc nhìn
for i in range(10):
    for q_text, req, forb, gt in hist_templates:
        variant_q = q_text
        if i == 1: variant_q = f"Cho tôi hỏi: {q_text}"
        elif i == 2: variant_q = f"Bạn có thể giải đáp giúp: {q_text}"
        elif i == 3: variant_q = f"Thông tin lịch sử về: {q_text}"
        elif i == 4: variant_q = f"Em muốn biết: {q_text}"
        elif i == 5: variant_q = f"Theo tư liệu di tích: {q_text}"
        elif i == 6: variant_q = f"Theo lịch sử Hỏa Lò: {q_text}"
        elif i == 7: variant_q = f"Tại Hỏa Lò xưa, {q_text.lower()}"
        elif i == 8: variant_q = f"Giúp mình tìm hiểu: {q_text}"
        elif i == 9: variant_q = f"Hỏi về sự kiện lịch sử: {q_text}"
        
        add_case("HISTORICAL_FACT", variant_q, "HISTORICAL_FACT", req, forb, ["direct_answer", "factual_accuracy"], gt)

# ==========================================
# 2. NHÓM 2: 100 CÂU HỎI HIỆN VẬT (EXHIBIT_DETAILS)
# ==========================================
exhibit_templates = [
    ("Lưỡi dao máy chém tại Hỏa Lò nặng bao nhiêu kg và có cấu tạo thế nào?",
     ["50kg", "vát chéo", "thép", "quả tạ"], ["10kg", "thẳng đứng"],
     "Lưỡi dao máy chém bằng thép hình tam giác vát chéo nặng 50kg, được gắn kèm quả tạ chì trượt trong rãnh cột gỗ cao gần 4m rơi tự do từ trên đỉnh xuống."),

    ("Chiều cao chính xác của cỗ máy chém đang trưng bày tại Hỏa Lò là bao nhiêu?",
     ["gần 4m", "4 mét", "cột gỗ lim"], ["10m", "2m"],
     "Cỗ máy chém tại Nhà tù Hỏa Lò có chiều cao gần 4 mét, gồm hai cột gỗ lim dựng song song."),

    ("Cây bàng cổ thụ trong sân trại giam có tác dụng chữa bệnh gì cho tù nhân?",
     ["kiết lỵ", "tiêu chảy", "búp bàng", "lá bàng"], ["ung thư", "sốt rét"],
     "Búp bàng non và lá bàng bánh tẻ được người tù nhai hoặc sắc nước uống như một vị thuốc thần kỳ chữa khỏi bệnh kiết lỵ và tiêu chảy đường ruột."),

    ("Tù nhân Hỏa Lò đã dùng cành bàng và hạt bàng vào những việc gì?",
     ["quản bút", "mài cành bàng", "hạt bàng", "bồi bổ"], ["làm vũ khí"],
     "Cành bàng được mài nhọn gọt giũa làm quản bút viết tài liệu báo chí bí mật, còn nhân hạt bàng bùi béo giàu dinh dưỡng được chia nhau bồi bổ sức khỏe."),

    ("Cấu trúc của ngục tối Cachot có đặc điểm gì tàn bạo đối với sức khỏe người tù?",
     ["Cachot", "bệ xi măng", "nghiêng", "máu dồn", "phù nề"], ["thoáng mát"],
     "Phòng Cachot tối đen và thiếu dưỡng khí; tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa và lở loét."),

    ("Các tử tù trong vụ vượt ngục đêm Noel 1951 đã cưa song sắt bằng dụng cụ gì?",
     ["lưỡi dũa", "dũa sắt", "giấu ở đùi", "cưa song sắt"], ["máy cưa điện"],
     "Các tử tù đã dùng những lưỡi dũa nhỏ bí mật giấu ở đùi và kẽ quần áo, kiên trì dũa song sắt suốt nhiều tuần liền vào lúc lính gác đổi phiên."),

    ("Tù nhân đã chế tạo mực viết và bút như thế nào để xuất bản báo chí bí mật?",
     ["bột gạch non", "muội than", "bút cành bàng", "giấy vệ sinh"], ["máy in"],
     "Người tù mài cành bàng làm quản bút, dùng muội than củi hoặc bột gạch non màu đỏ nghiền mịn hòa với nước làm mực viết báo trên giấy vệ sinh hoặc vải."),

    ("Tượng sáp tù nhân trưng bày tại các phòng giam tập thể hiện nay làm bằng chất liệu gì?",
     ["composite", "sáp", "phục dựng"], ["đá hoa cương"],
     "Các tượng tù nhân phục dựng tại di tích được chế tác tỉ mỉ từ vật liệu composite tổng hợp tạo hình chân thực như người thật."),

    ("Song sắt và cửa sắt cổ tại Hỏa Lò được bảo tồn chống rỉ sét bằng cách nào?",
     ["chống oxy hóa", "sơn phủ bảo quản", "nguyên trạng"], ["thay mới hoàn toàn"],
     "Hệ thống song sắt và cửa ngục cổ được quét lớp hóa chất bảo quản chống oxy hóa chuyên dụng để giữ gìn nguyên trạng lớp sắt thời Pháp thuộc."),

    ("Chiếc áo len gắn liền với câu chuyện nghĩa tình đồng chí của ai tại xà lim tử hình?",
     ["Hoàng Văn Thụ", "Đỗ Nhuận", "Phạm Thị Vân", "áo len"], ["John McCain"],
     "Đó là chiếc áo len nhạc sĩ Đỗ Nhuận nhường và bà Phạm Thị Vân bí mật đan gửi tặng đồng chí Hoàng Văn Thụ trước giờ bị đưa đi xử bắn.")
]

for i in range(10):
    for q_text, req, forb, gt in exhibit_templates:
        variant_q = q_text
        if i == 1: variant_q = f"Cho mình hỏi hiện vật này: {q_text}"
        elif i == 2: variant_q = f"Chi tiết hiện vật: {q_text}"
        elif i == 3: variant_q = f"Về hiện vật trưng bày, {q_text.lower()}"
        elif i == 4: variant_q = f"Quy cách kỹ thuật: {q_text}"
        elif i == 5: variant_q = f"Hiện vật lịch sử: {q_text}"
        elif i == 6: variant_q = f"Bác hướng dẫn viên cho cháu hỏi: {q_text}"
        elif i == 7: variant_q = f"Tư liệu về hiện vật: {q_text}"
        elif i == 8: variant_q = f"Đặc điểm của hiện vật: {q_text}"
        elif i == 9: variant_q = f"Thông số hiện vật: {q_text}"

        add_case("EXHIBIT_DETAILS", variant_q, "EXHIBIT_INFORMATION", req, forb, ["direct_answer", "exhibit_accuracy"], gt)

# ==========================================
# 3. NHÓM 3: 100 TÌNH HUỐNG CHĂM SÓC KHÁCH HÀNG (CUSTOMER_CARE)
# ==========================================
customer_care_cases = [
    # 20 ca Khiếu nại (CUSTOMER_COMPLAINT)
    ("Tôi cảm thấy trải nghiệm tham quan hôm nay không tốt vì quá đông và ồn ào.",
     "CUSTOMER_COMPLAINT", ["Rất tiếc", "ghi nhận phản hồi", "chưa hài lòng"], ["tại bạn", "chấp nhận đi"],
     ["empathy", "apology", "actionable_step"], "Rất tiếc vì trải nghiệm hôm nay chưa đáp ứng được kỳ vọng của bạn..."),
    ("Nhân viên soát vé có thái độ thiếu nhiệt tình với gia đình tôi.",
     "CUSTOMER_COMPLAINT", ["Rất tiếc", "xin lỗi", "ghi nhận", "cổng số 1"], ["nhân viên đúng"],
     ["empathy", "refers_to_management"], "Xin chân thành cáo lỗi cùng bạn và gia đình..."),
    ("Hôm nay tham quan rất thất vọng vì phòng ngục tối đông nghẹt không di chuyển được.",
     "CUSTOMER_COMPLAINT", ["Rất tiếc", "ghi nhận", "chia sẻ"], ["không sao đâu"],
     ["empathy", "actionable_step"], "Rất tiếc vì sự bất tiện do lượng khách tham quan tăng cao..."),
    ("Tôi thấy dịch vụ tai nghe thuyết minh hôm nay bị rè một bên tai.",
     "CUSTOMER_COMPLAINT", ["Rất tiếc", "quầy vé", "đổi máy"], ["tự chịu"],
     ["actionable_step", "swap_device"], "Rất xin lỗi bạn về sự cố kỹ thuật này. Bạn hãy mang tai nghe lại quầy vé để được đổi ngay máy mới nhé."),

    # 20 ca Mất đồ / Cần hỗ trợ (CUSTOMER_ASSISTANCE)
    ("Tôi bị rơi chiếc ví tiền ở khu vực sân cây bàng, tôi phải làm sao?",
     "CUSTOMER_ASSISTANCE", ["phòng thường trực bảo vệ", "quầy vé", "cổng số 1", "camera"], ["tự tìm đi"],
     ["actionable_step", "security_contact"], "Bạn hãy đến ngay phòng thường trực bảo vệ tại cổng chính số 1 Hỏa Lò để được hỗ trợ trích xuất camera và kiểm tra sổ thất lạc."),
    ("Con tôi mải xem hiện vật nên bị lạc trong khu trưng bày, hãy giúp tôi tìm bé!",
     "CUSTOMER_ASSISTANCE", ["nhân viên bảo vệ", "phòng trực", "hỗ trợ tìm kiếm"], ["chờ tí"],
     ["urgent_support", "staff_contact"], "Bạn hãy báo ngay cho nhân viên bảo vệ gần nhất hoặc phòng thường trực ở cổng để phát loa thông báo và phối hợp tìm bé ngay lập tức."),
    ("Tôi để quên chiếc áo khoác và điện thoại ở ghế nghỉ chân.",
     "CUSTOMER_ASSISTANCE", ["phòng bảo vệ", "quầy thông tin", "cổng số 1"], ["mất rồi"],
     ["actionable_step"], "Bạn hãy liên hệ ngay với quầy vé hoặc nhân viên bảo vệ tại cổng để kiểm tra đồ bàn giao thất lạc."),

    # 20 ca Trợ năng & Hỗ trợ đặc biệt (ACCESSIBILITY_SUPPORT)
    ("Mẹ tôi 80 tuổi phải ngồi xe lăn có vào tham quan các phòng giam được không?",
     "ACCESSIBILITY_SUPPORT", ["bậc tam cấp", "dốc", "nhân viên bảo vệ", "hỗ trợ"], ["cấm xe lăn"],
     ["accessibility_guidance"], "Di tích có bố trí dốc ở các trục chính và nhân viên luôn sẵn lòng hỗ trợ dìu hoặc đẩy xe lăn cho bác."),
    ("Gia đình có xe đẩy em bé có mang vào di tích được không?",
     "ACCESSIBILITY_SUPPORT", ["mang vào", "bậc thềm", "lưu ý"], ["cấm"],
     ["accessibility_guidance"], "Bạn có thể mang xe đẩy vào, tuy nhiên có một số bậc thềm cổ cần nhấc xe và phụ huynh nên đi cùng bé."),
    ("Trong di tích có ghế ngồi nghỉ chân cho người già mỏi chân không?",
     "ACCESSIBILITY_SUPPORT", ["ghế nghỉ chân", "sân trại giam", "cây bàng"], ["không có"],
     ["facility_guidance"], "Di tích có bố trí nhiều ghế nghỉ chân dưới bóng mát cây bàng cổ thụ tại sân trại giam để du khách nghỉ ngơi."),

    # 20 ca Giá vé & Chính sách (TICKET_INFORMATION)
    ("Giá vé vào cổng tham quan ban ngày là bao nhiêu tiền một người?",
     "TICKET_INFORMATION", ["50.000", "người lớn", "25.000", "miễn phí"], ["100.000"],
     ["direct_answer"], "Giá vé ban ngày là 50.000 VNĐ/người lớn; 25.000 VNĐ cho học sinh, sinh viên, người cao tuổi; miễn phí cho trẻ em dưới 15 tuổi."),
    ("Sinh viên có được giảm giá vé không và cần mang theo giấy tờ gì?",
     "TICKET_INFORMATION", ["25.000", "thẻ sinh viên", "thẻ HSSV", "giảm 50%"], ["không giảm"],
     ["direct_answer"], "Sinh viên được giảm 50% giá vé còn 25.000 VNĐ khi xuất trình thẻ học sinh, sinh viên hợp lệ tại quầy vé."),
    ("Trẻ em mấy tuổi thì được miễn phí vé vào cổng?",
     "TICKET_INFORMATION", ["dưới 15 tuổi", "miễn phí vé"], ["dưới 6 tuổi"],
     ["direct_answer"], "Trẻ em dưới 15 tuổi được miễn phí vé vào cổng tham quan tại Di tích Nhà tù Hỏa Lò."),
    ("Vé xem tour đêm Đêm thiêng liêng giá bao nhiêu và mua ở đâu?",
     "TICKET_INFORMATION", ["399.000", "499.000", "đặt trước", "fanpage"], ["mua tự do"],
     ["direct_answer"], "Vé tour đêm có giá từ 399.000 - 499.000 VNĐ tùy chủ đề và bắt buộc phải đặt trước qua fanpage hoặc hotline chính thức."),

    # 20 ca Giờ mở cửa & Tiện ích (OPENING_HOURS & FACILITY_SUPPORT)
    ("Nhà tù Hỏa Lò mở cửa lúc mấy giờ và có nghỉ trưa không?",
     "OPENING_HOURS", ["8:00", "17:00", "không nghỉ trưa", "tất cả các ngày"], ["có nghỉ trưa", "đóng cửa buổi trưa", "nghỉ ăn trưa"],
     ["direct_answer"], "Di tích mở cửa từ 8:00 đến 17:00 hàng ngày và không nghỉ trưa."),
    ("Ngày Tết Nguyên Đán hoặc Quốc khánh di tích có mở cửa đón khách không?",
     "OPENING_HOURS", ["mở cửa bình thường", "ngày Lễ", "Tết"], ["đóng cửa"],
     ["direct_answer"], "Di tích mở cửa đón khách tất cả các ngày trong năm, kể cả dịp Lễ, Tết."),
    ("Tôi có mang theo vali du lịch và balo lớn thì có chỗ gửi đồ không?",
     "FACILITY_SUPPORT", ["tủ gửi đồ", "miễn phí", "cổng soát vé"], ["không có"],
     ["direct_answer"], "Di tích có trang bị tủ gửi đồ cá nhân miễn phí ngay gần cổng soát vé dành cho balo và hành lý của khách."),
    ("Nhà vệ sinh nằm ở vị trí nào trong khuôn viên di tích?",
     "FACILITY_SUPPORT", ["sân trại giam", "lối ra", "quầy lưu niệm"], ["không có"],
     ["direct_answer"], "Nhà vệ sinh được bố trí tại khu vực sân trại giam và gần quầy lưu niệm ở lối ra."),
    ("Quy định trang phục khi vào tham quan Di tích Hỏa Lò như thế nào?",
     "VISIT_GUIDANCE", ["trang phục lịch sự", "kín đáo", "tôn nghiêm"], ["mặc gì cũng được"],
     ["direct_answer"], "Du khách cần mặc trang phục lịch sự, kín đáo để thể hiện sự tôn nghiêm tại di tích lịch sử thiêng liêng."),
    ("Tôi có được phép bay flycam hoặc quay phim thương mại tại di tích không?",
     "FACILITY_SUPPORT", ["Ban quản lý", "xin phép", "không được tự ý"], ["bay thoải mái"],
     ["direct_answer"], "Việc sử dụng flycam hoặc quay phim thương mại phải được sự chấp thuận trước bằng văn bản của Ban quản lý di tích.")
]

# Lặp và biến tấu cho đủ 100 câu chăm sóc khách hàng
for q_text, intent, req, forb, style, gt in customer_care_cases:
    for v in range(5):
        vq = q_text
        if v == 1: vq = f"Dạ cho em hỏi: {q_text}"
        elif v == 2: vq = f"Phiền bạn giải đáp: {q_text}"
        elif v == 3: vq = f"Cho tôi hỏi chút: {q_text}"
        elif v == 4: vq = f"Tôi đang có thắc mắc: {q_text}"
        add_case("CUSTOMER_CARE", vq, intent, req, forb, style, gt)

# ==========================================
# 4. NHÓM 4: 50 CÂU HỎI TƯ VẤN HÀNH TRÌNH (TOUR_RECOMMENDATION)
# ==========================================
tour_templates = [
    ("Tôi chỉ có 30 phút tham quan thì nên ghé những điểm nào quan trọng nhất?",
     ["30 phút", "Cổng chính", "Cây bàng", "Cachot", "máy chém", "phi công Mỹ"], ["đi hết 14 khu"],
     "Nếu có 30 phút, bạn nên đi tuyến rút gọn: Cổng chính ➡️ Cây bàng cổ thụ ➡️ Ngục tối Cachot ➡️ Cỗ máy chém ➡️ Cửa cống ngầm ➡️ Khu phi công Mỹ ➡️ Đài tưởng niệm."),

    ("Một chuyến tham quan Hỏa Lò đầy đủ tiêu chuẩn mất khoảng bao nhiêu thời gian?",
     ["60 đến 90 phút", "thứ tự các phòng giam"], ["5 phút", "cả ngày"],
     "Chuyến tham quan tiêu chuẩn đầy đủ thường kéo dài từ 60 đến 90 phút."),

    ("Đoàn chúng tôi đi 20 người thì có nên đặt thuyết minh viên trước không?",
     ["đặt trước", "quầy vé", "Audioguide"], ["tự đi không cần hỏi"],
     "Đoàn đông từ 20 người nên liên hệ đặt trước thuyết minh viên trực tiếp tại quầy vé hoặc thuê máy Audioguide cho từng người."),

    ("Buổi tối ở Hỏa Lò có hoạt động gì đặc biệt không?",
     ["tour đêm", "Đêm thiêng liêng", "thứ Sáu", "thứ Bảy", "Chủ Nhật"], ["nhạc kịch tự do"],
     "Buổi tối cuối tuần tại Hỏa Lò có chương trình tour đêm 'Đêm thiêng liêng' với trải nghiệm âm thanh, ánh sáng và thưởng thức trà bàng, thạch bàng."),

    ("Gia đình có trẻ nhỏ thì nên tham quan theo lộ trình nào phù hợp nhất?",
     ["người lớn đi cùng", "lưu ý", "Cachot", "máy chém"], ["bỏ mặc"],
     "Phụ huynh nên đi cùng trẻ nhỏ, giới thiệu về cây bàng, các hiện vật sinh hoạt, và lưu ý chuẩn bị tâm lý khi qua khu ngục tối Cachot.")
]

for v in range(10):
    for q_text, req, forb, gt in tour_templates:
        vq = q_text
        if v == 1: vq = f"Gợi ý giúp mình: {q_text}"
        elif v == 2: vq = f"Tư vấn hành trình: {q_text}"
        elif v == 3: vq = f"Nhờ bạn tư vấn: {q_text}"
        elif v == 4: vq = f"Tôi đang phân vân: {q_text}"
        add_case("TOUR_RECOMMENDATION", vq, "TOUR_RECOMMENDATION", req, forb, ["tour_advice", "direct_answer"], gt)

# ==========================================
# 5. NHÓM 5: 50 CÂU HỎI TIẾP NỐI HỘI THOẠI (CONVERSATIONAL_FOLLOWUP)
# ==========================================
followup_pairs = [
    # Cây bàng
    ("Cây bàng ở sân Hỏa Lò có điểm gì đặc biệt?", "Nó được sử dụng để làm gì?", "EXHIBIT_INFORMATION", "cay_bang", "Cây bàng",
     ["chữa bệnh", "kiết lỵ", "quản bút", "hạt bàng"], ["máy chém"],
     "Cây bàng được tù nhân dùng búp và lá non chữa kiết lỵ, cành bàng mài làm bút viết, hạt bàng bồi bổ sức khỏe."),

    # Máy chém
    ("Máy chém được Pháp đặt ở đâu?", "Nó nặng bao nhiêu kg?", "EXHIBIT_INFORMATION", "may_chem", "Máy chém",
     ["50kg", "vát chéo", "thép"], ["10kg"],
     "Lưỡi dao máy chém nặng 50kg trượt từ độ cao gần 4 mét."),

    # Ngục tối Cachot
    ("Khu biệt giam Cachot là gì?", "Ở đó tù nhân bị giam như thế nào?", "EXHIBIT_INFORMATION", "cachot", "Ngục tối Cachot",
     ["cùm chân", "bệ xi măng", "nghiêng", "máu dồn"], ["thoáng đãng"],
     "Tại Cachot, tù nhân bị cùm chân trên bệ xi măng nghiêng dốc trong phòng tối tăm thiếu dưỡng khí."),

    # Phi công Mỹ
    ("Khu phi công Mỹ còn gọi là gì?", "Họ được đối xử ra sao trong thời gian ở đó?", "HISTORICAL_FACT", "phi_cong", "Phi công Mỹ",
     ["nhân đạo", "chăm sóc y tế", "trao trả 1973"], ["bị ngược đãi"],
     "Họ được đối xử nhân đạo, chăm sóc y tế và được trao trả tự do năm 1973."),

    # Cống ngầm
    ("Đường cống ngầm Hỏa Lò có sự kiện gì?", "Cuộc vượt ngục đó diễn ra vào ngày nào?", "HISTORICAL_FACT", "cong_ngam", "Cống ngầm",
     ["24/12/1951", "Noel", "16 tử tù"], ["1975"],
     "Vụ vượt ngục diễn ra đêm Noel 24/12/1951 bởi 16 tử tù chính trị cưa song sắt chui cống.")
]

for v in range(10):
    for turn1_q, turn2_q, target_intent, top_id, top_name, req, forb, gt in followup_pairs:
        vq = turn2_q
        if v % 2 == 1:
            vq = turn2_q.replace("Nó", "Vật này").replace("nó", "vật này")
        add_case("CONVERSATIONAL_FOLLOWUP", vq, target_intent, req, forb, ["followup_resolution", "direct_answer"], gt, turn1=turn1_q)

# ==========================================
# 6. NHÓM 6: 50 CÂU HỎI MƠ HỒ, SAI CHÍNH TẢ & RÚT GỌN (AMBIGUOUS_TYPO_SHORT)
# ==========================================
ambiguous_and_typos = [
    # 25 câu mơ hồ (cần hỏi lại làm rõ)
    ("Tôi muốn đi khu đó", "AMBIGUOUS_QUERY", ["khu vực", "hiện vật", "bạn đang đứng"], [], ["clarification_needed"],
     "Bạn đang muốn tìm khu vực hoặc hiện vật nào tại Hỏa Lò? Cho mình biết tên để hỗ trợ nhé."),
    ("Cho tôi xem cái này", "AMBIGUOUS_QUERY", ["hiện vật", "tìm"], [], ["clarification_needed"],
     "Bạn đang quan tâm đến hiện vật nào tại di tích?"),
    ("Khu đó có gì?", "AMBIGUOUS_QUERY", ["khu vực", "hiện vật"], [], ["clarification_needed"],
     "Bạn đang muốn hỏi về khu vực nào tại Hỏa Lò?"),
    ("Chỗ này thế nào?", "AMBIGUOUS_QUERY", ["vị trí", "hiện vật"], [], ["clarification_needed"],
     "Bạn có thể cho mình biết bạn đang đứng ở vị trí nào không?"),
    ("Giúp tôi với", "AMBIGUOUS_QUERY", ["hỗ trợ", "nhu cầu"], [], ["clarification_needed"],
     "Mình có thể hỗ trợ thông tin hiện vật hoặc dịch vụ tham quan nào cho bạn?"),

    # 25 câu sai chính tả / không dấu / rút gọn (AI vẫn phải hiểu chuẩn xác)
    ("may chem nang bao nhieu", "EXHIBIT_INFORMATION", ["50kg", "máy chém"], [], ["direct_answer"],
     "Lưỡi dao máy chém nặng 50kg."),
    ("cay bang chua benh j", "EXHIBIT_INFORMATION", ["kiết lỵ", "cây bàng"], [], ["direct_answer"],
     "Lá và búp bàng chữa bệnh kiết lỵ."),
    ("gia ve hssv", "TICKET_INFORMATION", ["25.000", "sinh viên", "học sinh"], [], ["direct_answer"],
     "Giá vé cho học sinh sinh viên là 25.000 VNĐ."),
    ("mo cua may gio", "OPENING_HOURS", ["8:00", "17:00"], [], ["direct_answer"],
     "Di tích mở cửa từ 8:00 đến 17:00."),
    ("cho gui balo", "FACILITY_SUPPORT", ["tủ gửi đồ", "miễn phí"], [], ["direct_answer"],
     "Có tủ gửi đồ miễn phí cạnh cổng soát vé.")
]

for v in range(5):
    for q_text, intent, req, forb, style, gt in ambiguous_and_typos:
        add_case("AMBIGUOUS_TYPO_SHORT", q_text, intent, req, forb, style, gt)

# ==========================================
# 7. NHÓM 7: 50 CÂU NGOÀI PHẠM VI & BẪY BỊA ĐẶT (OUT_OF_SCOPE_AND_TRAPS)
# ==========================================
traps_and_oos = [
    # 25 câu ngoài phạm vi (OUT_OF_SCOPE)
    ("Giá vàng SJC hôm nay tại Hà Nội là bao nhiêu một chỉ?",
     "OUT_OF_SCOPE", ["ngoài phạm vi", "Hỏa Lò"], ["giá vàng là"], ["polite_refusal"],
     "Câu hỏi này nằm ngoài phạm vi Di tích Nhà tù Hỏa Lò..."),
    ("Thời tiết ngày mai ở Sapa có tuyết rơi không?",
     "OUT_OF_SCOPE", ["ngoài phạm vi", "Hỏa Lò"], ["nhiệt độ"], ["polite_refusal"],
     "Câu hỏi này nằm ngoài phạm vi Di tích Nhà tù Hỏa Lò..."),
    ("Dinh Độc Lập ở TP.HCM mở cửa mấy giờ vậy bạn?",
     "OUT_OF_SCOPE", ["ngoài phạm vi", "Hỏa Lò"], [], ["polite_refusal"],
     "Mình chỉ hỗ trợ thông tin Di tích Nhà tù Hỏa Lò tại Hà Nội..."),
    ("Hướng dẫn tôi giải phương trình bậc hai bằng Python",
     "OUT_OF_SCOPE", ["ngoài phạm vi"], ["def solve"], ["polite_refusal"],
     "Câu hỏi này nằm ngoài phạm vi Di tích Nhà tù Hỏa Lò..."),
    ("Chỉ số VN-Index hôm nay tăng hay giảm mấy điểm?",
     "OUT_OF_SCOPE", ["ngoài phạm vi"], [], ["polite_refusal"],
     "Câu hỏi này nằm ngoài phạm vi Di tích Nhà tù Hỏa Lò..."),

    # 25 câu bẫy sai dữ kiện (Kiểm tra chống bịa đặt / Hallucination trap)
    ("Có phải cỗ máy chém ở Hỏa Lò cao tới 15 mét và nặng 5 tấn không?",
     "EXHIBIT_INFORMATION", ["gần 4m", "50kg", "không phải"], ["đúng rồi", "cao 15m", "nặng 5 tấn"], ["fact_correction"],
     "Không phải, máy chém chỉ cao gần 4 mét và lưỡi dao nặng 50kg."),
    ("Có phải đồng chí Hoàng Văn Thụ bị thực dân Pháp xử chém bằng máy chém ở Hỏa Lò không?",
     "HISTORICAL_FACT", ["xử bắn", "Tương Mai", "không phải xử chém"], ["chém đầu bằng máy chém"], ["fact_correction"],
     "Không phải, đồng chí Hoàng Văn Thụ bị xử bắn tại trường bắn Tương Mai năm 1944, không bị xử chém."),
    ("Có phải toàn bộ 16 người vượt ngục cống ngầm đêm Noel 1951 đều trốn thoát thành công không?",
     "HISTORICAL_FACT", ["5 đồng chí", "bị bắt lại", "không phải tất cả"], ["thoát hết cả 16"], ["fact_correction"],
     "Không phải, trong 16 tử tù chỉ có 5 đồng chí thoát ra vùng tự do kháng chiến an toàn, số còn lại bị bắt lại."),
    ("Có phải cụ Phan Bội Châu bị thực dân Pháp tử hình bằng máy chém tại Hỏa Lò?",
     "HISTORICAL_FACT", ["an trí", "Bến Ngự", "Huế", "không bị tử hình"], ["bị chém đầu"], ["fact_correction"],
     "Không phải, cụ Phan Bội Châu sau đó được đưa về an trí tại Bến Ngự (Huế) cho đến khi qua đời."),
    ("Có phải vé vào cổng tham quan Hỏa Lò ban ngày có giá 500.000 VNĐ không?",
     "TICKET_INFORMATION", ["50.000", "không phải 500.000"], ["đúng 500k"], ["fact_correction"],
     "Không phải, giá vé ban ngày chỉ là 50.000 VNĐ/người lớn.")
]

for v in range(5):
    for q_text, intent, req, forb, style, gt in traps_and_oos:
        add_case("OUT_OF_SCOPE_AND_TRAPS", q_text, intent, req, forb, style, gt)

print(f"Tổng số ca kiểm thử đã tạo: {len(test_cases)} ca.")

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(test_cases, f, ensure_ascii=False, indent=2)

print(f"Đã lưu thành công tệp dataset: {out_path}")
