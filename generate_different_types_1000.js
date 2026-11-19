/**
 * Script sinh bộ 1.000 CÂU HỎI THUỘC CÁC LOẠI CÂU HỎI HOÀN TOÀN MỚI
 * Kiểm thử xem AI có lấy những tri thức đã học để phản hồi nhanh và chính xác hơn không.
 * 
 * 6 DẠNG CÂU HỎI HOÀN TOÀN KHÁC BIỆT:
 * 1. Dạng 1: Xác thực Đúng / Sai (Yes / No) - 200 câu
 * 2. Dạng 2: Nguyên nhân & Tại sao (Causal 'Why') - 200 câu
 * 3. Dạng 3: Lựa chọn & Gợi ý tham quan (Recommendation & Choice) - 150 câu
 * 4. Dạng 4: Chi tiết cơ chế & Hiện vật lịch sử (Technical Inquiries) - 150 câu
 * 5. Dạng 5: Cảm xúc & Ý nghĩa truyền cảm hứng (Reflective Insights) - 150 câu
 * 6. Dạng 6: Bẫy ngoại vi đa dạng mới (Novel Boundary Traps) - 150 câu
 */

const fs = require('fs');
const path = require('path');

const questions = [];
let counter = 1;

// --- DỮ LIỆU CHUẨN LỊCH SỬ 10 CHUYÊN ĐỀ ---
const THEMES = [
  {
    category: "Máy chém (Guillotine)",
    target_poi: "Cỗ Máy Chém khổng lồ",
    expected: ["4m", "50kg", "Nguyễn Thái Học", "Yên Bái", "lưỡi dao", "hành quyết", "Pháp"],
    truth: "Máy chém cao gần 4 mét, lưỡi dao thép vát chéo nặng 50kg rơi từ trên cao xuống. Thực dân Pháp dùng máy chém để khủng bố, hành quyết nhiều chí sĩ yêu nước như Nguyễn Thái Học và 12 chiến sĩ khởi nghĩa Yên Bái (1930), Hoàng Văn Thụ (1944). Máy chém có thể tháo rời để đưa đi hành quyết lưu động khắp Bắc Kỳ."
  },
  {
    category: "Cây bàng lịch sử & Ẩm thực Bàng",
    target_poi: "Cây Bàng cổ thụ sân trại giam",
    expected: ["cây bàng", "lá bàng", "kiết lỵ", "chữa bệnh", "cành bàng", "hạt bàng", "trà bàng", "thạch bàng"],
    truth: "Cây bàng cổ thụ tại sân Hỏa Lò là người bạn tri kỷ của tù nhân. Lá bàng và búp bàng non là phương thuốc thần kỳ cứu chữa bệnh kiết lỵ đường ruột; cành bàng mài nhọn làm quản bút viết tài liệu; nhân hạt bàng giàu dinh dưỡng bồi bổ sức khỏe cho tù chính trị."
  },
  {
    category: "Cống ngầm & Vượt ngục lịch sử",
    target_poi: "Đường cống ngầm thoát hiểm",
    expected: ["cống ngầm", "1951", "vượt ngục", "16", "Thợ Nhuộm", "song sắt", "Noel"],
    truth: "Các cuộc vượt ngục cống ngầm tại Hỏa Lò là biểu tượng của lòng dũng cảm. Tiêu biểu là vụ vượt ngục đêm Noel 24/12/1951 của 16 tù chính trị tử hình qua cống ngầm thoát ra phố Thợ Nhuộm, và vụ vượt ngục giải thoát hơn 100 cán bộ cách mạng năm 1945."
  },
  {
    category: "Xà lim Cachot & Cùm chân xi măng",
    target_poi: "Khu vực biệt giam Cachot",
    expected: ["Cachot", "ngục tối", "biệt giam", "cùm chân", "bệ xi măng", "nghiêng", "máu dồn", "phù nề", "địa ngục"],
    truth: "Cachot là khu ngục tối biệt giam, được mệnh danh là 'địa ngục của địa ngục'. Phòng giam chật hẹp, tối đen không có ánh sáng tự nhiên. Tù nhân bị cùm chân trên bệ xi măng nghiêng dốc khiến chân cao hơn đầu, máu dồn lên não gây phù nề, mù lòa, lở loét."
  },
  {
    category: "Khu trại giam Nữ & Phong trào đấu tranh",
    target_poi: "Khu Trại giam Nữ tù chính trị",
    expected: ["trại nữ", "tuyệt thực", "đấu tranh", "nữ tù", "kiên trung", "Minh Khai"],
    truth: "Khu trại giam Nữ giam giữ các nữ tù nhân chính trị kiên trung cùng con thơ. Dù bị đánh đập dã man và điều kiện khắc nghiệt, các nữ tù vẫn đoàn kết đấu tranh, tuyệt thực dài ngày đòi cải thiện chế độ sinh hoạt và bảo vệ con nhỏ."
  },
  {
    category: "Phi công Mỹ & 'Hanoi Hilton'",
    target_poi: "Khu vực trưng bày phi công Mỹ",
    expected: ["Hanoi Hilton", "phi công Mỹ", "John McCain", "Pete Peterson", "nhân đạo", "1973"],
    truth: "Từ năm 1964 đến 1973, Nhà tù Hỏa Lò là nơi tạm giam các phi công Mỹ bị bắn rơi tại miền Bắc, được họ gọi châm biếm là Hanoi Hilton. Nổi bật có John McCain và Pete Peterson; họ đã được chính phủ Việt Nam đối xử nhân đạo chu đáo trước khi trao trả tự do năm 1973."
  },
  {
    category: "Cổng chính Maison Centrale & Lịch sử hình thành",
    target_poi: "Cổng vòm Maison Centrale",
    expected: ["Maison Centrale", "1896", "Pháp", "cổng chính", "làng Hỏa Lò", "tường bao"],
    truth: "Nhà tù Hỏa Lò do thực dân Pháp xây dựng năm 1896 trên đất làng gốm Hỏa Lò cổ, mang tên tiếng Pháp là Maison Centrale (Ngục Trung tâm). Với cổng chính kiên cố và tường bao đá cao 4m cắm đầy mảnh chai sắc nhọn, đây là nhà ngục kiên cố bậc nhất Bắc Kỳ."
  },
  {
    category: "Hiện vật sinh hoạt & Báo chí bí mật",
    target_poi: "Khu trưng bày Hiện vật Tù đày",
    expected: ["bút cành bàng", "báo chí bí mật", "sinh hoạt", "gạch non", "cách mạng"],
    truth: "Các hiện vật sinh hoạt bí mật tại Hỏa Lò thể hiện ý chí phi thường của người tù cách mạng. Các chiến sĩ đã mài cành bàng làm bút cành bàng, nghiền gạch non làm phấn, và ra các tờ báo chí bí mật viết bằng máu chuyền tay nhau để giữ vững khí tiết sinh hoạt cách mạng."
  },
  {
    category: "Tour đêm 'Đêm thiêng liêng' & Trải nghiệm",
    target_poi: "Không gian trải nghiệm Tour đêm",
    expected: ["tour đêm", "Đêm thiêng liêng", "trà bàng", "thạch bàng", "trải nghiệm"],
    truth: "Tour đêm Đêm thiêng liêng là sản phẩm du lịch trải nghiệm độc đáo, tái hiện chân thực cuộc đấu tranh quả cảm qua nghệ thuật âm thanh, ánh sáng sống động. Du khách còn được thưởng thức các món ăn thức uống đặc trưng từ cây bàng như trà bàng và thạch bàng."
  },
  {
    category: "Quy định, Giá vé & Hướng dẫn tham quan (FAQ)",
    target_poi: "Quầy vé & Cổng đón tiếp",
    expected: ["số 1 phố Hỏa Lò", "8:00", "17:00", "50.000", "25.000", "học sinh", "sinh viên", "miễn phí", "Audioguide", "quy định"],
    truth: "Địa chỉ di tích tại số 1 phố Hỏa Lò, Hoàn Kiếm, Hà Nội. Giờ mở cửa tham quan: 8:00 đến 17:00 tất cả các ngày trong tuần. Giá vé vào cổng ban ngày là 50.000 VNĐ/người lớn; học sinh, sinh viên và người cao tuổi được giảm 50% còn 25.000 VNĐ; miễn phí vé cho trẻ nhỏ dưới 15 tuổi. Hệ thống có sẵn thiết bị Audioguide tự động hỗ trợ du khách tham quan theo đúng quy định."
  }
];

// --- 1. DẠNG 1: CÂU HỎI XÁC THỰC ĐÚNG / SAI (YES / NO) - 200 CÂU ---
console.log('🔹 Tạo Dạng 1: 200 câu hỏi xác thực Đúng / Sai (Yes / No)...');
const YES_NO_BASES = [
  { themeIdx: 0, q: "Có đúng là cỗ máy chém cao gần 4m với lưỡi dao thép vát chéo nặng 50kg dùng để hành quyết Nguyễn Thái Học và các nghĩa sĩ Yên Bái không?" },
  { themeIdx: 1, q: "Có phải tù nhân cách mạng đã dùng lá bàng và búp non để chữa bệnh kiết lỵ, dùng cành bàng làm bút và ăn hạt bàng bồi bổ không?" },
  { themeIdx: 2, q: "Có đúng là vào đêm Noel 24/12/1951, 16 tử tù đã cưa song sắt và vượt ngục cống ngầm thành công ra phố Thợ Nhuộm không?" },
  { themeIdx: 3, q: "Có phải xà lim Cachot có thiết kế bệ xi măng nghiêng dốc khiến chân cao hơn đầu làm máu dồn não gây phù nề người tù không?" },
  { themeIdx: 4, q: "Có đúng là tại khu trại nữ, các nữ tù kiên trung như đồng chí Nguyễn Thị Minh Khai đã đoàn kết tuyệt thực đấu tranh không?" },
  { themeIdx: 5, q: "Có phải phi công Mỹ như John McCain được phía Việt Nam đối xử nhân đạo tại nơi họ gọi châm biếm là Hanoi Hilton trước khi trao trả 1973 không?" },
  { themeIdx: 6, q: "Có đúng là Maison Centrale được thực dân Pháp xây dựng từ năm 1896 trên nền đất làng gốm Hỏa Lò với tường bao đá cắm mảnh chai không?" },
  { themeIdx: 7, q: "Có phải tù nhân đã dùng bút cành bàng, phấn gạch non và ra các tờ báo chí bí mật viết bằng máu để giữ vững ngọn lửa cách mạng không?" },
  { themeIdx: 8, q: "Có đúng là tour đêm Đêm thiêng liêng kết hợp hiệu ứng âm thanh ánh sáng sống động và phục vụ trà bàng, thạch bàng cho du khách không?" },
  { themeIdx: 9, q: "Có phải di tích tại số 1 Hỏa Lò mở cửa từ 8:00 đến 17:00, vé người lớn 50.000đ, học sinh sinh viên 25.000đ và có thuê Audioguide không?" }
];

const YES_NO_VARIATIONS = [
  (q) => `Xin hỏi, ${q}`,
  (q) => `Tôi nghe nói ${q}, thông tin này chuẩn xác không?`,
  (q) => `Hướng dẫn viên cho tôi xác nhận lại: ${q}`,
  (q) => `Liệu có thật sự là ${q}`,
  (q) => `Cho đoàn hỏi để khẳng định: ${q}`,
  (q) => `Theo tư liệu truyền miệng thì ${q}, có đúng tài liệu di tích không?`,
  (q) => `Tôi cần kiểm chứng lại sự thật lịch sử: ${q}`,
  (q) => `Anh chị xác thực giúp cháu: ${q}`,
  (q) => `Thông tin sau đây đúng hay sai: ${q}`,
  (q) => `Dưới góc độ sự thật khách quan: ${q}`,
  (q) => `Xin làm rõ cho người xem: ${q}`,
  (q) => `Khách tham quan muốn biết chắc chắn: ${q}`,
  (q) => `Có tài liệu nào chứng minh ${q}`,
  (q) => `Tôi đang đọc tài liệu và muốn hỏi: ${q}`,
  (q) => `Xin khẳng định một lần nữa: ${q}`,
  (q) => `Có đúng như lời đồn rằng: ${q}`,
  (q) => `Nhiều bạn trẻ hỏi tôi liệu ${q}`,
  (q) => `Đối với câu hỏi xác thực này: ${q}`,
  (q) => `Xin hướng dẫn viên xác thực rõ: ${q}`,
  (q) => `Đoàn chúng tôi rất tò mò: ${q}`
];

for (const item of YES_NO_BASES) {
  const theme = THEMES[item.themeIdx];
  for (const fn of YES_NO_VARIATIONS) {
    questions.push({
      id: `DIFF_${counter.toString().padStart(4, '0')}`,
      type: 'VERIFICATION_YES_NO',
      category: theme.category,
      target_poi: theme.target_poi,
      question: fn(item.q),
      expected_keywords: theme.expected,
      ground_truth_summary: theme.truth
    });
    counter++;
  }
}

// --- 2. DẠNG 2: CÂU HỎI NGUYÊN NHÂN & TẠI SAO (CAUSAL 'WHY') - 200 CÂU ---
console.log('🔹 Tạo Dạng 2: 200 câu hỏi nguyên nhân & Tại sao (Why)...');
const WHY_BASES = [
  { themeIdx: 0, q: "tại sao thực dân Pháp lại mang cỗ máy chém cao gần 4m với lưỡi dao 50kg từ Pháp sang và hành quyết các chiến sĩ Yên Bái như Nguyễn Thái Học?" },
  { themeIdx: 1, q: "vì sao cây bàng cổ thụ lại được coi là vị cứu tinh giúp người tù chữa khỏi căn bệnh kiết lỵ hiểm nghèo và làm ngòi bút viết tài liệu?" },
  { themeIdx: 2, q: "tại sao 16 tử tù chính trị lại chọn đúng thời điểm đêm Noel 24/12/1951 để vượt ngục qua đường cống ngầm thoát ra phố Thợ Nhuộm?" },
  { themeIdx: 3, q: "vì lý do gì mà thực dân Pháp lại thiết kế bệ xi măng trong xà lim Cachot nghiêng dốc khiến chân cao hơn đầu làm máu dồn não gây phù nề?" },
  { themeIdx: 4, q: "vì sao các nữ chiến sĩ cách mạng như đồng chí Nguyễn Thị Minh Khai lại kiên quyết tổ chức tuyệt thực tập thể trong trại nữ?" },
  { themeIdx: 5, q: "tại sao phi công Mỹ như John McCain lại được Chính phủ Việt Nam đối xử nhân đạo tại Hanoi Hilton trước khi trao trả năm 1973?" },
  { themeIdx: 6, q: "vì lý do gì thực dân Pháp lại chọn xây dựng nhà tù Maison Centrale năm 1896 trên đất làng Hỏa Lò với tường đá cao 4m cắm mảnh chai?" },
  { themeIdx: 7, q: "vì sao dù bị kiểm soát gắt gao, người tù vẫn mài được bút cành bàng và nghiền gạch non để ra báo chí bí mật cách mạng?" },
  { themeIdx: 8, q: "tại sao tour đêm Đêm thiêng liêng lại mang lại cảm xúc mạnh mẽ qua nghệ thuật âm thanh ánh sáng và ẩm thực trà bàng, thạch bàng?" },
  { themeIdx: 9, q: "vì sao di tích lại áp dụng chính sách giảm 50% giá vé còn 25.000đ cho học sinh sinh viên tại số 1 Hỏa Lò và trang bị thiết bị Audioguide?" }
];

for (const item of WHY_BASES) {
  const theme = THEMES[item.themeIdx];
  for (const fn of YES_NO_VARIATIONS) {
    questions.push({
      id: `DIFF_${counter.toString().padStart(4, '0')}`,
      type: 'CAUSAL_WHY',
      category: theme.category,
      target_poi: theme.target_poi,
      question: fn(item.q),
      expected_keywords: theme.expected,
      ground_truth_summary: theme.truth
    });
    counter++;
  }
}

// --- 3. DẠNG 3: CÂU HỎI LỰA CHỌN & GỢI Ý THAM QUAN (RECOMMENDATION) - 150 CÂU ---
console.log('🔹 Tạo Dạng 3: 150 câu hỏi gợi ý & lựa chọn tham quan...');
const REC_BASES = [
  { themeIdx: 0, q: "Nếu tôi quan tâm đến lòng yêu nước của nghĩa sĩ Yên Bái và Nguyễn Thái Học thì nên dành bao nhiêu thời gian tìm hiểu cỗ máy chém 4m nặng 50kg?" },
  { themeIdx: 1, q: "Khách tham quan muốn hiểu về đời sống sinh tồn của tù nhân thì nên nghe thuyết minh về cây bàng cổ thụ và công dụng chữa kiết lỵ thế nào?" },
  { themeIdx: 2, q: "Để cảm nhận rõ nhất tinh thần quả cảm mưu trí, tôi nên quan sát kỹ đoạn cống ngầm vượt ngục đêm Noel 1951 ra phố Thợ Nhuộm như thế nào?" },
  { themeIdx: 3, q: "Người có tiền sử sợ bóng tối có nên bước sâu vào trải nghiệm buồng biệt giam Cachot với cùm chân xi măng nghiêng dốc không?" },
  { themeIdx: 5, q: "Du khách nước ngoài muốn tìm hiểu về quan hệ Việt - Mỹ thì hiện vật phi công Mỹ và câu chuyện Hanoi Hilton có gì đáng lưu ý nhất?" },
  { themeIdx: 8, q: "Nên đặt vé tham quan ban ngày hay đăng ký tour đêm Đêm thiêng liêng để thưởng thức trà bàng, thạch bàng và nghe âm thanh ánh sáng?" },
  { themeIdx: 9, q: "Đoàn học sinh sinh viên đến số 1 Hỏa Lò nên chuẩn bị giấy tờ gì để nhận giá vé ưu đãi 25.000đ và thuê tai nghe Audioguide?" }
];

const REC_PREFIXES = [
  "Xin tư vấn lịch trình: ",
  "Gợi ý cho du khách: ",
  "Theo lời khuyên của hướng dẫn viên: ",
  "Tôi đang phân vân: ",
  "Để có trải nghiệm ý nghĩa nhất: ",
  "Khách đi theo nhóm nhỏ cần lưu ý: ",
  "Nên ưu tiên khu vực nào: ",
  "Cho tôi lời khuyên hữu ích: ",
  "Dành cho người tham quan lần đầu: ",
  "Theo chỉ dẫn chuyên môn: ",
  "Kinh nghiệm từ các đoàn trước: ",
  "Có nên chú ý điểm này không: ",
  "Để hiểu sâu sắc nhất: ",
  "Về mặt lộ trình di chuyển: ",
  "Gợi ý góc nhìn cho đoàn: ",
  "Tôi muốn nghe hướng dẫn chi tiết: ",
  "Điểm nhấn không thể bỏ lỡ: ",
  "Xin chỉ dẫn cụ thể: ",
  "Tư vấn cho sinh viên: ",
  "Lời khuyên về thời gian và hiện vật: ",
  "Đâu là trải nghiệm tiêu biểu: "
];

for (let i = 0; i < REC_BASES.length && counter <= 550; i++) {
  const item = REC_BASES[i];
  const theme = THEMES[item.themeIdx];
  for (const pref of REC_PREFIXES) {
    if (counter > 550) break;
    questions.push({
      id: `DIFF_${counter.toString().padStart(4, '0')}`,
      type: 'RECOMMENDATION_CHOICE',
      category: theme.category,
      target_poi: theme.target_poi,
      question: `${pref}${item.q}`,
      expected_keywords: theme.expected,
      ground_truth_summary: theme.truth
    });
    counter++;
  }
}

// Bổ sung đến đủ 550
while (counter <= 550) {
  const theme = THEMES[counter % 10];
  questions.push({
    id: `DIFF_${counter.toString().padStart(4, '0')}`,
    type: 'RECOMMENDATION_CHOICE',
    category: theme.category,
    target_poi: theme.target_poi,
    question: `Xin gợi ý cho du khách cách tìm hiểu sâu sắc về ${theme.category} và điểm nhấn ${theme.target_poi}?`,
    expected_keywords: theme.expected,
    ground_truth_summary: theme.truth
  });
  counter++;
}

// --- 4. DẠNG 4: CÂU HỎI CHI TIẾT CƠ CHẾ & HIỆN VẬT LỊCH SỬ (TECHNICAL) - 150 CÂU ---
console.log('🔹 Tạo Dạng 4: 150 câu hỏi chi tiết cơ chế & hiện vật (Technical)...');
const TECH_BASES = [
  { themeIdx: 0, q: "Cơ chế ròng rọc kéo quả tạ sắt 50kg và chốt hãm rơi tự do của cỗ máy chém cao 4m hoạt động như thế nào?" },
  { themeIdx: 1, q: "Cách chế biến lá bàng làm thuốc chữa kiết lỵ và kỹ thuật đẽo gọt cành bàng thành quản bút viết chữ của tù nhân?" },
  { themeIdx: 2, q: "Quy cách kỹ thuật lòng cống ngầm chật hẹp và mẹo bôi xà phòng giảm tiếng ồn cưa song sắt đêm Noel 1951 ra phố Thợ Nhuộm?" },
  { themeIdx: 3, q: "Độ nghiêng dốc của bệ xi măng và cấu tạo then cùm sắt khóa chân trong xà lim Cachot ảnh hưởng ra sao đến tuần hoàn máu?" },
  { themeIdx: 6, q: "Cấu trúc xây dựng tường bao đá cao 4m cắm mảnh chai thủy tinh và dây thép gai của Maison Centrale năm 1896?" },
  { themeIdx: 7, q: "Phương thức giã gạch non làm phấn và mực tự chế viết báo chí bí mật chuyền tay qua các kẽ tường đá?" },
  { themeIdx: 9, q: "Thông số vận hành thiết bị Audioguide tự động nhận diện vị trí và quy trình đối soát vé 50.000đ - 25.000đ tại số 1 Hỏa Lò?" }
];

for (let i = 0; i < TECH_BASES.length && counter <= 700; i++) {
  const item = TECH_BASES[i];
  const theme = THEMES[item.themeIdx];
  for (const pref of REC_PREFIXES) {
    if (counter > 700) break;
    questions.push({
      id: `DIFF_${counter.toString().padStart(4, '0')}`,
      type: 'TECHNICAL_INQUIRY',
      category: theme.category,
      target_poi: theme.target_poi,
      question: `Chi tiết kỹ thuật: ${pref}${item.q}`,
      expected_keywords: theme.expected,
      ground_truth_summary: theme.truth
    });
    counter++;
  }
}

while (counter <= 700) {
  const theme = THEMES[counter % 10];
  questions.push({
    id: `DIFF_${counter.toString().padStart(4, '0')}`,
    type: 'TECHNICAL_INQUIRY',
    category: theme.category,
    target_poi: theme.target_poi,
    question: `Dữ liệu kỹ thuật và thông số chính xác của ${theme.category} tại di tích Hỏa Lò gồm những gì?`,
    expected_keywords: theme.expected,
    ground_truth_summary: theme.truth
  });
  counter++;
}

// --- 5. DẠNG 5: CẢM XÚC & Ý NGHĨA TRUYỀN CẢM HỨNG (REFLECTIVE) - 150 CÂU ---
console.log('🔹 Tạo Dạng 5: 150 câu hỏi cảm xúc & ý nghĩa truyền cảm hứng...');
const REFLECT_BASES = [
  { themeIdx: 0, q: "Khí phách hiên ngang trước cỗ máy chém 4m và câu nói 'Không thành công cũng thành nhân' của Nguyễn Thái Học để lại bài học gì?" },
  { themeIdx: 1, q: "Tình đồng chí sẻ chia từng mẩu hạt bàng và thìa nước lá bàng chữa kiết lỵ mang lại xúc cảm gì cho người xem?" },
  { themeIdx: 2, q: "Khát vọng tự do cháy bỏng của 16 tử tù trườn qua bùn lầy cống ngầm đêm Noel 1951 ra phố Thợ Nhuộm truyền cảm hứng gì?" },
  { themeIdx: 3, q: "Ý chí gang thép của người tù trước sự tàn bạo của ngục tối Cachot và bệ cùm chân xi măng nghiêng dốc chứng minh điều gì?" },
  { themeIdx: 4, q: "Sự hy sinh kiên trung của các nữ chiến sĩ cách mạng như đồng chí Nguyễn Thị Minh Khai trong trại nữ để lại niềm tự hào ra sao?" },
  { themeIdx: 5, q: "Thông điệp hòa giải nhân đạo và khép lại quá khứ của Việt Nam khi đối xử khoan hồng với phi công Mỹ tại Hanoi Hilton?" },
  { themeIdx: 8, q: "Ý nghĩa thiêng liêng và lòng tri ân sâu sắc khi tham gia lễ dâng hương và thưởng thức trà bàng trong tour đêm Đêm thiêng liêng?" }
];

for (let i = 0; i < REFLECT_BASES.length && counter <= 850; i++) {
  const item = REFLECT_BASES[i];
  const theme = THEMES[item.themeIdx];
  for (const pref of REC_PREFIXES) {
    if (counter > 850) break;
    questions.push({
      id: `DIFF_${counter.toString().padStart(4, '0')}`,
      type: 'REFLECTIVE_INSIGHT',
      category: theme.category,
      target_poi: theme.target_poi,
      question: `Cảm xúc và ý nghĩa lịch sử: ${pref}${item.q}`,
      expected_keywords: theme.expected,
      ground_truth_summary: theme.truth
    });
    counter++;
  }
}

while (counter <= 850) {
  const theme = THEMES[counter % 10];
  questions.push({
    id: `DIFF_${counter.toString().padStart(4, '0')}`,
    type: 'REFLECTIVE_INSIGHT',
    category: theme.category,
    target_poi: theme.target_poi,
    question: `Ý nghĩa nhân văn và bài học lịch sử sâu sắc rút ra từ ${theme.category} là gì?`,
    expected_keywords: theme.expected,
    ground_truth_summary: theme.truth
  });
  counter++;
}

// --- 6. DẠNG 6: BẪY NGOẠI VI ĐA DẠNG MỚI (NOVEL BOUNDARY TRAPS) - 150 CÂU ---
console.log('🔹 Tạo Dạng 6: 150 câu hỏi bẫy ngoại vi đa dạng mới...');
const NOVEL_OUT_OF_SCOPE_TRAPS = [
  "Cột Cờ Hà Nội cao bao nhiêu mét và có bao nhiêu bậc thang?",
  "Chùa Trấn Quốc nằm trên đường Thanh Niên ven Hồ Tây được xây dựng từ thế kỷ thứ mấy?",
  "Bảo tàng Hồ Chí Minh tại số 19 Ngọc Hà trưng bày những hiện vật tiêu biểu nào?",
  "Nhà tù Sơn La với cây đào Tô Hiệu có điểm gì khác với các nhà ngục khác?",
  "Hệ thống địa đạo Vịnh Mốc tại Quảng Trị được đào sâu bao nhiêu tầng?",
  "Hầm chỉ huy tướng Đờ Cát tại thung lũng Điện Biên Phủ dài bao nhiêu mét?",
  "Cố đô Huế có bao nhiêu cửa thành và lăng tẩm các vua triều Nguyễn?",
  "Chùa Keo tại Thái Bình nổi tiếng với kiến trúc tháp chuông bằng gỗ nào?",
  "Khu danh thắng Tràng An Ninh Bình được xếp hạng di sản kép vào năm nào?",
  "Động Phong Nha Kẻ Bàng tại Quảng Bình dài bao nhiêu kilomet?",
  "Dự báo thời tiết Hà Nội hôm nay độ ẩm bao nhiêu phần trăm và có nắng không?",
  "Công thức tính diện tích hình tròn có bán kính R bằng gì?",
  "Thuật toán sắp xếp QuickSort có độ phức tạp thời gian trung bình là bao nhiêu?",
  "Giá xăng dầu RON 95 trong kỳ điều hành mới nhất tăng hay giảm bao nhiêu đồng?",
  "Chỉ số chứng khoán Dow Jones của Mỹ phiên hôm qua chốt ở bao nhiêu điểm?"
];

while (counter <= 1000) {
  const trapIdx = (counter - 851) % NOVEL_OUT_OF_SCOPE_TRAPS.length;
  const trapQ = NOVEL_OUT_OF_SCOPE_TRAPS[trapIdx];
  const iter = Math.floor((counter - 851) / NOVEL_OUT_OF_SCOPE_TRAPS.length) + 1;
  questions.push({
    id: `DIFF_${counter.toString().padStart(4, '0')}`,
    type: 'NOVEL_BOUNDARY_TRAP',
    category: 'NGOAI_PHAM_VI',
    target_poi: 'Ngoài phạm vi Hỏa Lò',
    question: `(Bẫy ngoại vi thế hệ mới #${iter}) ${trapQ}`,
    expected_keywords: ["Hỏa Lò", "chuyên biệt", "từ chối", "ngoài phạm vi"],
    ground_truth_summary: "Xin lỗi quý khách, tôi từ chối trả lời vì câu hỏi này nằm ngoài phạm vi Di tích Lịch sử Nhà tù Hỏa Lò. Tôi là hướng dẫn viên chuyên biệt của Di tích Lịch sử Nhà tù Hỏa Lò. Quý khách vui lòng hỏi về các hiện vật lịch sử tại Hỏa Lò như Cỗ máy chém, Cây bàng, Cống ngầm vượt ngục hoặc Tour đêm Đêm thiêng liêng nhé!"
  });
  counter++;
}

// Lưu ra file JSON
const outJsonPath = path.join(__dirname, 'data', '1000_cau_hoi_khac_loai_test.json');
fs.writeFileSync(outJsonPath, JSON.stringify(questions, null, 2), 'utf8');

console.log(`✅ Đã sinh thành công ${questions.length} câu hỏi thuộc 6 dạng hoàn toàn mới!`);
console.log(`📁 Tệp lưu: ${outJsonPath}`);
