/**
 * Script sinh bộ 1.000 CÂU HỎI MỚI ĐỂ THỬ THÁCH MỨC ĐỘ HỌC HỎI & THÍCH ỨNG CỦA AI
 * 
 * PHÂN BỔ THỬ THÁCH:
 * 1. 400 câu rút từ bộ 10.000 mới (chưa từng kiểm thử, góc nhìn đa đối tượng)
 * 2. 250 câu tình huống thực tế & đào sâu chi tiết kỹ thuật/lịch sử (In-depth Situational)
 * 3. 200 câu hỏi liên hệ so sánh & lồng ghép nhiều hiện vật (Comparative Synthesis)
 * 4. 150 câu hỏi bẫy ngoại vi & ranh giới kiến thức (Advanced Out-of-Scope Traps)
 */

const fs = require('fs');
const path = require('path');

const file10k = path.join(__dirname, 'data', '10000_cau_hoi_hoa_lo.json');
let raw10k = [];
if (fs.existsSync(file10k)) {
  raw10k = JSON.parse(fs.readFileSync(file10k, 'utf8'));
}

const questions = [];
let counter = 1;

// 1. NHÓM 1: 400 câu rút từ bộ 10.000 mới (chọn cách quãng đều 25 câu/bước)
console.log('🔹 Tạo Nhóm 1: 400 câu hỏi rút từ bộ 10.000 câu độc nhất...');
const step = Math.floor(raw10k.length / 400) || 25;
for (let i = 0; i < 400 && (i * step) < raw10k.length; i++) {
  const item = raw10k[i * step + (counter % 5)];
  if (item) {
    questions.push({
      id: `LEARN_${counter.toString().padStart(4, '0')}`,
      type: 'DEEP_FACET_10K',
      category: item.category,
      target_poi: item.target_poi,
      question: item.question,
      expected_keywords: item.expected_keywords,
      ground_truth_summary: item.ground_truth_summary
    });
    counter++;
  }
}

// 2. NHÓM 2: 250 câu tình huống thực tế & đào sâu chi tiết
console.log('🔹 Tạo Nhóm 2: 250 câu hỏi tình huống thực tế & đào sâu chi tiết...');
const IN_DEPTH_TEMPLATES = [
  {
    category: "Máy chém (Guillotine)",
    target_poi: "Cỗ Máy Chém khổng lồ",
    expected: ["4m", "50kg", "Nguyễn Thái Học", "Yên Bái", "lưỡi dao", "hành quyết", "Pháp"],
    truth: "Máy chém cao gần 4 mét, lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng máy chém để khủng bố, hành quyết nhiều chí sĩ yêu nước như Nguyễn Thái Học và 12 chiến sĩ khởi nghĩa Yên Bái (1930), Hoàng Văn Thụ (1944). Máy chém có thể tháo rời để đưa đi hành quyết lưu động khắp Bắc Kỳ.",
    variants: [
      "Nếu đứng trước cỗ máy chém, xin giải thích cơ chế quả tạ 50kg và lưỡi dao rơi từ độ cao 4m tác động thế nào khi thực dân Pháp hành quyết Nguyễn Thái Học?",
      "Cỗ máy chém lưu động này tại sao có thể tháo rời và vận chuyển đi hành quyết ở các tỉnh khác như Yên Bái?",
      "Lưỡi dao vát chéo nặng 50kg được gia công bằng thép gì và có kết cấu đặc biệt thế nào?",
      "Tại sao thực dân Pháp lại đưa cỗ máy chém 4m từ Pháp sang Việt Nam để đàn áp cuộc khởi nghĩa Yên Bái?",
      "Ý nghĩa câu nói bất hủ của đồng chí Hoàng Văn Thụ và nhà yêu nước Nguyễn Thái Học trước máy chém?"
    ]
  },
  {
    category: "Cây bàng lịch sử & Ẩm thực Bàng",
    target_poi: "Cây Bàng cổ thụ sân trại giam",
    expected: ["cây bàng", "lá bàng", "kiết lỵ", "chữa bệnh", "cành bàng", "hạt bàng", "trà bàng", "thạch bàng"],
    truth: "Cây bàng cổ thụ tại sân Hỏa Lò là người bạn tri kỷ của tù nhân. Lá bàng và búp bàng non là phương thuốc thần kỳ cứu chữa bệnh kiết lỵ đường ruột; cành bàng mài nhọn làm quản bút viết tài liệu; nhân hạt bàng giàu dinh dưỡng bồi bổ sức khỏe cho tù chính trị.",
    variants: [
      "Trong điều kiện thiếu thuốc men, tù nhân cách mạng đã dùng lá bàng và búp non để chữa bệnh kiết lỵ đường ruột như thế nào?",
      "Làm sao người tù có thể mài cành bàng khô thành ngòi bút để viết tài liệu bí mật?",
      "Tại sao hạt bàng lại được coi là nguồn dinh dưỡng bồi bổ quý giá nhất cho các chiến sĩ bị ốm kiệt sức?",
      "Vỏ thân cây bàng cổ thụ có tác dụng gì trong việc sát trùng các vết thương do đòn tra tấn?",
      "Hốc cây bàng được các chiến sĩ sử dụng làm hộp thư liên lạc bí mật như thế nào?"
    ]
  },
  {
    category: "Cống ngầm & Vượt ngục lịch sử",
    target_poi: "Đường cống ngầm thoát hiểm",
    expected: ["cống ngầm", "1951", "vượt ngục", "16", "Thợ Nhuộm", "song sắt", "Noel", "1945"],
    truth: "Các cuộc vượt ngục cống ngầm tại Hỏa Lò là biểu tượng của lòng dũng cảm. Tiêu biểu là vụ vượt ngục đêm Noel 24/12/1951 của 16 tù chính trị tử hình qua cống ngầm thoát ra phố Thợ Nhuộm, và vụ vượt ngục giải thoát hơn 100 cán bộ cách mạng năm 1945.",
    variants: [
      "Trong đêm Noel 24/12/1951, 16 tử tù chính trị đã dùng mẹo gì để cưa đứt song sắt cống ngầm mà không bị lính gác phát hiện?",
      "Điều kiện bùn lầy, khí ngạt và bóng tối trong lòng cống ngầm chật hẹp thử thách ý chí người tù ra sao khi bò ra phố Thợ Nhuộm?",
      "Vụ vượt ngục tập thể hơn 100 cán bộ cách mạng năm 1945 nhân sự kiện Nhật đảo chính Pháp diễn ra thế nào?",
      "Lưỡi cưa sắt được các gia đình cơ sở bí mật tuồn vào cống ngầm nhà tù bằng cách nào?",
      "Sau vụ 16 tử tù trốn thoát qua đường cống ngầm đêm Noel 1951, thực dân Pháp đã phản ứng và gia cố nhà tù ra sao?"
    ]
  },
  {
    category: "Xà lim Cachot & Cùm chân xi măng",
    target_poi: "Khu vực biệt giam Cachot",
    expected: ["Cachot", "ngục tối", "biệt giam", "cùm chân", "bệ xi măng", "nghiêng", "máu dồn", "phù nề", "địa ngục"],
    truth: "Cachot là khu ngục tối biệt giam, được mệnh danh là 'địa ngục của địa ngục'. Phòng giam chật hẹp, tối đen không có ánh sáng tự nhiên. Tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa, lở loét.",
    variants: [
      "Thiết kế sàn xi măng dốc ngược trong Cachot khiến chân cao hơn đầu gây tác hại ghê gớm gì cho sức khỏe tù nhân?",
      "Tại sao phòng biệt giam Cachot lại được coi là 'địa ngục của địa ngục' tàn khốc nhất Hỏa Lò?",
      "Người tù bị nhốt trong bóng tối đen đặc Cachot nhiều tháng liền làm thế nào để giữ vững thị lực và tinh thần cách mạng?",
      "Khẩu phần ăn nửa bát cơm hẩm muối hạt và chế độ bỏ đói trong Cachot nhằm bẻ gãy ý chí người tù như thế nào?",
      "Những ai thường bị thực dân Pháp tống vào phòng biệt giam Cachot và họ bị cùm chân bằng then sắt ra sao?"
    ]
  },
  {
    category: "Phi công Mỹ & 'Hanoi Hilton'",
    target_poi: "Khu vực trưng bày phi công Mỹ",
    expected: ["Hanoi Hilton", "phi công Mỹ", "John McCain", "Pete Peterson", "nhân đạo", "bắn rơi", "1973"],
    truth: "Từ năm 1964 đến 1973, Nhà tù Hỏa Lò là nơi tạm giam các phi công Mỹ bị bắn rơi tại miền Bắc, được họ gọi châm biếm là Hanoi Hilton. Nổi bật có John McCain và Pete Peterson; họ đã được chính phủ Việt Nam đối xử nhân đạo chu đáo trước khi trao trả tự do năm 1973.",
    variants: [
      "Tại sao các phi công Mỹ lại đặt tên châm biếm cho Hỏa Lò là khách sạn Hanoi Hilton?",
      "Sự kiện phi công John McCain bị bắn rơi tại hồ Trúc Bạch năm 1967 và được nhân dân cứu vớt diễn ra thế nào?",
      "Chính sách đối xử nhân đạo khoan hồng của Chính phủ Việt Nam đối với tù binh phi công Mỹ thể hiện qua những sinh hoạt gì?",
      "Đại sứ Pete Peterson - cựu phi công bị giam tại Hỏa Lò - đã đóng vai trò gì trong việc bình thường hóa quan hệ Việt - Mỹ?",
      "Ngày 27/1/1973 sau khi ký Hiệp định Paris, các phi công Mỹ được trao trả tự do tại đâu và trong không khí thế nào?"
    ]
  }
];

// Sinh 250 câu hỏi tình huống đào sâu (5 chủ đề x 5 biến thể x 10 dạng mở rộng = 250 câu)
const SITUATION_PREFIXES = [
  "Dưới góc nhìn nghiên cứu bảo tàng học: ",
  "Đối với đoàn du khách trẻ lần đầu đến Hỏa Lò: ",
  "Trong bài thuyết minh chuyên sâu cho sinh viên lịch sử: ",
  "Theo các ghi chép hồi ký của cựu tù nhân: ",
  "Để hiểu rõ bản chất tàn bạo của chế độ thực dân: ",
  "Nếu đứng trực tiếp quan sát hiện vật: ",
  "Xin hỏi hướng dẫn viên giải thích rõ: ",
  "Qua các tài liệu lưu trữ chính thức: ",
  "Dưới góc độ tâm lý và sức chịu đựng của con người: ",
  "Khi nhìn lại những chứng tích lịch sử này: "
];

for (const tmpl of IN_DEPTH_TEMPLATES) {
  for (const variant of tmpl.variants) {
    for (const prefix of SITUATION_PREFIXES) {
      if (counter > 650) break;
      questions.push({
        id: `LEARN_${counter.toString().padStart(4, '0')}`,
        type: 'SITUATIONAL_IN_DEPTH',
        category: tmpl.category,
        target_poi: tmpl.target_poi,
        question: `${prefix}${variant}`,
        expected_keywords: tmpl.expected,
        ground_truth_summary: tmpl.truth
      });
      counter++;
    }
  }
}

// 3. NHÓM 3: 200 câu hỏi liên hệ so sánh & lồng ghép đa chiều
console.log('🔹 Tạo Nhóm 3: 200 câu hỏi liên hệ so sánh & lồng ghép...');
const COMPARATIVE_DATA = [
  {
    category: "Cống ngầm & Vượt ngục lịch sử",
    target_poi: "Đường cống ngầm thoát hiểm",
    expected: ["cống ngầm", "1951", "vượt ngục", "16", "Thợ Nhuộm", "song sắt"],
    truth: "Các cuộc vượt ngục cống ngầm tại Hỏa Lò là biểu tượng của lòng dũng cảm. Tiêu biểu là vụ vượt ngục đêm Noel 24/12/1951 của 16 tù chính trị tử hình qua cống ngầm thoát ra phố Thợ Nhuộm, và vụ vượt ngục giải thoát hơn 100 cán bộ cách mạng năm 1945.",
    baseQ: "Hãy so sánh quy mô và tính chất giữa vụ vượt ngục cống ngầm đêm Noel 24/12/1951 của 16 tử tù và vụ vượt ngục năm 1945?"
  },
  {
    category: "Cây bàng lịch sử & Ẩm thực Bàng",
    target_poi: "Cây Bàng cổ thụ sân trại giam",
    expected: ["cây bàng", "lá bàng", "kiết lỵ", "chữa bệnh", "cành bàng", "hạt bàng", "trà bàng", "thạch bàng"],
    truth: "Cây bàng cổ thụ tại sân Hỏa Lò là người bạn tri kỷ của tù nhân. Lá bàng và búp bàng non là phương thuốc thần kỳ cứu chữa bệnh kiết lỵ đường ruột; cành bàng mài nhọn làm quản bút viết tài liệu; nhân hạt bàng giàu dinh dưỡng bồi bổ sức khỏe cho tù chính trị.",
    baseQ: "Cây bàng vừa cung cấp thuốc chữa kiết lỵ vừa làm quản bút và hạt bồi bổ, nay lại được làm trà bàng và thạch bàng trong tour đêm đúng không?"
  },
  {
    category: "Máy chém (Guillotine)",
    target_poi: "Cỗ Máy Chém khổng lồ",
    expected: ["4m", "50kg", "Nguyễn Thái Học", "Yên Bái", "lưỡi dao", "hành quyết", "Pháp"],
    truth: "Máy chém cao gần 4 mét, lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng máy chém để khủng bố, hành quyết nhiều chí sĩ yêu nước như Nguyễn Thái Học và 12 chiến sĩ khởi nghĩa Yên Bái (1930), Hoàng Văn Thụ (1944). Máy chém có thể tháo rời để đưa đi hành quyết lưu động khắp Bắc Kỳ.",
    baseQ: "So với cỗ máy chém lưu động cao 4m nặng 50kg thì tinh thần bất khuất của các nghĩa sĩ khởi nghĩa Yên Bái và Nguyễn Thái Học có ý nghĩa như thế nào?"
  },
  {
    category: "Phi công Mỹ & 'Hanoi Hilton'",
    target_poi: "Khu vực trưng bày phi công Mỹ",
    expected: ["Hanoi Hilton", "phi công Mỹ", "John McCain", "Pete Peterson", "nhân đạo"],
    truth: "Từ năm 1964 đến 1973, Nhà tù Hỏa Lò là nơi tạm giam các phi công Mỹ bị bắn rơi tại miền Bắc, được họ gọi châm biếm là Hanoi Hilton. Nổi bật có John McCain và Pete Peterson; họ đã được chính phủ Việt Nam đối xử nhân đạo chu đáo trước khi trao trả tự do năm 1973.",
    baseQ: "Sự đối xử nhân đạo với phi công Mỹ như John McCain tại Hanoi Hilton khác biệt hoàn toàn với chế độ ngục tù dã man của thực dân Pháp trước kia ra sao?"
  },
  {
    category: "Quy định, Giá vé & Hướng dẫn tham quan (FAQ)",
    target_poi: "Quầy vé & Cổng đón tiếp",
    expected: ["số 1 phố Hỏa Lò", "8:00", "17:00", "50.000", "25.000", "học sinh", "sinh viên", "miễn phí", "Audioguide", "quy định"],
    truth: "Địa chỉ di tích tại số 1 phố Hỏa Lò, Hoàn Kiếm, Hà Nội. Giờ mở cửa tham quan: 8:00 đến 17:00 tất cả các ngày trong tuần. Giá vé vào cổng ban ngày là 50.000 VNĐ/người lớn; học sinh, sinh viên và người cao tuổi được giảm 50% còn 25.000 VNĐ; miễn phí vé cho trẻ nhỏ dưới 15 tuổi. Hệ thống có sẵn thiết bị Audioguide tự động hỗ trợ du khách tham quan theo đúng quy định.",
    baseQ: "Một đoàn khách gồm người lớn vé 50.000đ và học sinh sinh viên vé 25.000đ đến số 1 Hỏa Lò từ 8:00 đến 17:00 có thể thuê thiết bị thuyết minh Audioguide như thế nào?"
  }
];

const COMP_EXPANDERS = [
  " - Xin hướng dẫn viên phân tích chi tiết.",
  " - Du khách muốn được làm rõ luận điểm này.",
  " - Xin cho biết quan điểm chính thống của ban quản lý di tích.",
  " - Đây là thắc mắc chung của rất nhiều khách tham quan.",
  " - Để bài học lịch sử thêm phần sâu sắc.",
  " - Vui lòng nêu rõ các mốc thời gian và con số lịch sử.",
  " - Dưới góc nhìn đối chiếu giữa hai giai đoạn lịch sử.",
  " - Giúp chúng tôi có cái nhìn toàn diện và khách quan.",
  " - Cần chú ý những chứng tích hiện vật nào tại hiện trường?",
  " - Rất mong nhận được lời giải đáp thấu đáo từ trợ lý ảo AI."
];

for (let r = 0; r < 4; r++) {
  for (const comp of COMPARATIVE_DATA) {
    for (const exp of COMP_EXPANDERS) {
      if (counter > 850) break;
      questions.push({
        id: `LEARN_${counter.toString().padStart(4, '0')}`,
        type: 'COMPARATIVE_SYNTHESIS',
        category: comp.category,
        target_poi: comp.target_poi,
        question: `(Lần hỏi ${r+1}) ${comp.baseQ}${exp}`,
        expected_keywords: comp.expected,
        ground_truth_summary: comp.truth
      });
      counter++;
    }
  }
}

// 4. NHÓM 4: 150 câu hỏi bẫy ngoại vi & ranh giới kiến thức (Out-of-Scope Traps)
console.log('🔹 Tạo Nhóm 4: 150 câu hỏi bẫy ngoại vi & ranh giới kiến thức...');
const OUT_OF_SCOPE_TRAP_LIST = [
  // Di tích khác
  "Chuồng cọp Nhà tù Côn Đảo được xây dựng kiên cố năm nào và có bao nhiêu phòng?",
  "Hệ thống địa đạo Củ Chi dài bao nhiêu kilomet dưới lòng đất?",
  "Cột cờ Hà Nội nằm trong khuôn viên Hoàng Thành Thăng Long cao bao nhiêu mét?",
  "Khuê Văn Các tại Văn Miếu Quốc Tử Giám được khởi công xây dựng vào năm nào?",
  "Xe tăng số hiệu 390 húc đổ cổng chính Dinh Độc Lập vào giờ phút nào?",
  "Bến Nhà Rồng nơi Bác Hồ ra đi tìm đường cứu nước hiện nay trưng bày những gì?",
  "Mười cô gái thanh niên xung phong tại Ngã ba Đồng Lộc hy sinh vào năm nào?",
  "Thành cổ Quảng Trị đã trải qua 81 ngày đêm rực lửa năm bao nhiêu?",
  "Cầu Long Biên do kiến trúc sư người Pháp nào thiết kế và xây dựng năm nào?",
  "Bảo tàng Chứng tích Chiến tranh tại TP Hồ Chí Minh mở cửa đón khách giờ nào?",
  "Chùa Một Cột ở Hà Nội có kiến trúc hình hoa sen được xây dựng từ thời vua nào?",
  "Đền Ngọc Sơn và Cầu Thê Húc giữa lòng Hồ Gươm có nguồn gốc lịch sử ra sao?",
  "Chùa Bái Đính ở Ninh Bình có bức tượng Phật bằng đồng nặng bao nhiêu tấn?",
  "Vịnh Hạ Long được UNESCO công nhận là Di sản Thiên nhiên Thế giới năm nào?",
  "Đỉnh núi Fansipan tại Sapa cao chính xác bao nhiêu mét so với mực nước biển?",
  
  // Kiến thức thường thức, thời tiết, kinh tế, công nghệ
  "Thời tiết Hà Nội hôm nay trời có mưa không và nhiệt độ cao nhất bao nhiêu độ?",
  "Giá vàng miếng SJC hôm nay trên thị trường tự do là bao nhiêu tiền một lượng?",
  "Chỉ số chứng khoán VN-Index phiên giao dịch hôm nay tăng hay giảm bao nhiêu điểm?",
  "Tỷ giá đồng Đô la Mỹ USD so với Việt Nam Đồng hôm nay tại Vietcombank là bao nhiêu?",
  "Đội tuyển bóng đá Việt Nam sẽ thi đấu trận tiếp theo vào ngày nào?",
  "Viết cho tôi đoạn mã code Python tính số Fibonacci bằng đệ quy có nhớ?",
  "Giải thích định lý Pytago và cách áp dụng trong tính toán tam giác vuông?",
  "Thuật toán Dijkstra tìm đường đi ngắn nhất hoạt động theo nguyên lý gì?",
  "Giải phương trình bậc hai ax2 + bx + c = 0 trong trường hợp delta âm?",
  "Mô hình ngôn ngữ lớn ChatGPT và Gemini hoạt động dựa trên kiến trúc Transformer ra sao?"
];

while (counter <= 1000) {
  const trapIdx = (counter - 851) % OUT_OF_SCOPE_TRAP_LIST.length;
  const trapQ = OUT_OF_SCOPE_TRAP_LIST[trapIdx];
  const iter = Math.floor((counter - 851) / OUT_OF_SCOPE_TRAP_LIST.length) + 1;
  questions.push({
    id: `LEARN_${counter.toString().padStart(4, '0')}`,
    type: 'BOUNDARY_TRAP',
    category: 'NGOAI_PHAM_VI',
    target_poi: 'Ngoài phạm vi Hỏa Lò',
    question: `(Kiểm tra bẫy ngoại vi #${iter}) ${trapQ}`,
    expected_keywords: ["Hỏa Lò", "chuyên biệt", "từ chối", "ngoài phạm vi"],
    ground_truth_summary: "Xin lỗi quý khách, tôi từ chối trả lời vì câu hỏi này nằm ngoài phạm vi Di tích Lịch sử Nhà tù Hỏa Lò. Tôi là hướng dẫn viên chuyên biệt của Di tích Lịch sử Nhà tù Hỏa Lò. Quý khách vui lòng hỏi về các hiện vật lịch sử tại Hỏa Lò như Cỗ máy chém, Cây bàng, Cống ngầm vượt ngục hoặc Tour đêm Đêm thiêng liêng nhé!"
  });
  counter++;
}

// Lưu ra file JSON
const outJsonPath = path.join(__dirname, 'data', '1000_cau_hoi_hoc_hoi_test.json');
fs.writeFileSync(outJsonPath, JSON.stringify(questions, null, 2), 'utf8');

console.log(`✅ Đã sinh thành công ${questions.length} câu hỏi thử thách độ học hỏi của AI!`);
console.log(`📁 Tệp lưu: ${outJsonPath}`);
