/**
 * 2Guide Multi-Feature Intent Classifier
 * Phân loại chính xác 14+ ý định của khách tham quan dựa trên phân tích đa chiều:
 * Cấu trúc ngữ pháp, từ khóa thực thể, cảm xúc/phàn nàn, và ngữ cảnh hội thoại.
 */

const nlp = require('./nlp_processor');

const INTENTS = {
  HISTORICAL_FACT: 'HISTORICAL_FACT',
  EXHIBIT_INFORMATION: 'EXHIBIT_INFORMATION',
  HISTORICAL_EXPLANATION: 'HISTORICAL_EXPLANATION',
  VISIT_GUIDANCE: 'VISIT_GUIDANCE',
  TOUR_RECOMMENDATION: 'TOUR_RECOMMENDATION',
  TICKET_INFORMATION: 'TICKET_INFORMATION',
  OPENING_HOURS: 'OPENING_HOURS',
  FACILITY_SUPPORT: 'FACILITY_SUPPORT',
  ACCESSIBILITY_SUPPORT: 'ACCESSIBILITY_SUPPORT',
  CUSTOMER_COMPLAINT: 'CUSTOMER_COMPLAINT',
  CUSTOMER_ASSISTANCE: 'CUSTOMER_ASSISTANCE',
  GREETING: 'GREETING',
  FOLLOW_UP: 'FOLLOW_UP',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE',
  AMBIGUOUS_QUERY: 'AMBIGUOUS_QUERY'
};

class IntentClassifier {
  constructor() {
    this.outOfScopeEntities = [
      'thoi tiet', 'gia vang', 'chung khoan', 'vn index', 'gia co phieu', 'bitcoin', 'crypto',
      'fibonacci', 'code python', 'pytago', 'dijkstra', 'quicksort', 'phuong trinh', 'toan hoc',
      'chatgpt', 'gemini', 'bong da', 'world cup', 'ngoai hang anh',
      'dinh doc lap', 'dia dao cu chi', 'ben nha rong', 'chua bai dinh', 'trang an',
      'phong nha', 'ke bang', 'vinh ha long', 'fansipan', 'sapa', 'chua keo', 'chua huong',
      'thanh co quang tri', 'nga ba dong loc', 'cau vang da nang', 'ba na hills'
    ];

    this.hoaLoWhitelist = [
      'hoa lo', 'maison centrale', 'xa lim', 'cum chan', 'may chem', 'cay bang',
      'cong ngam', 'tu nhan', 'tu binh', 'phi cong', 'mccain', 'peterson', 'b 52', 'b52',
      'phan boi chau', 'luong van can', 'hoang van thu', 'nguyen thai hoc',
      'thung ve sinh', 'lap la', 'bat sat', 'que dan', 'so dang ky', 'ton do',
      'cat toc', 'nguyen thi minh khai', 'quang thai', 'pham thi van', 'le lien',
      'tuong niem', 'phu dieu', 'choi gac', 'vong gac', 'trai nu', 'trai nam',
      'cachot', 'dem thieng lieng', 'tra bang', 'thach bang', 'phu khanh',
      'lang hoa lo', 'lang phu khanh', 'khoa co chan', 'cong tay', 'xieng xich',
      'dong kinh nghia thuc'
    ];
  }

  classify(rawQuestion, context = null) {
    const raw = nlp.cleanRawText(rawQuestion);
    const norm = ' ' + nlp.normalize(raw) + ' ';
    const lower = raw.toLowerCase();

    // 1. Kiểm tra câu hỏi quá ngắn hoặc mơ hồ
    const tokens = norm.trim().split(' ').filter(Boolean);
    const isVague = (
      tokens.length <= 2 &&
      !norm.includes('xin chao') &&
      !norm.includes('cam on') &&
      !norm.includes('gia ve') &&
      !norm.includes('gio mo')
    ) || (
      (norm.includes('toi muon di khu do') || norm.includes('cho toi xem cai nay') || norm.includes('khu do co gi') || norm.includes('cho nay the nao') || (tokens.length <= 4 && norm.includes('giup toi'))) &&
      !context?.lastTopic &&
      !norm.includes('mat do') && !norm.includes('that lac') && !norm.includes('roi vi') && !norm.includes('roi do')
    );

    if (isVague) {
      return {
        intent: INTENTS.AMBIGUOUS_QUERY,
        confidence: 0.9,
        reason: 'Câu hỏi thiếu thông tin cụ thể để xác định hiện vật hoặc nhu cầu'
      };
    }

    // 2. Chào hỏi và xã giao (Greeting)
    const isGreeting = (
      /^(xin\s*chào|chào\s*(bạn|ai|ad|admin|em)|hello|hi|hey|good\s*morning|chào\s*buổi\s*sáng)\b/i.test(lower) ||
      /^(cảm\s*ơn|thank\s*you|thanks|tạm\s*biệt|bye)\b/i.test(lower)
    ) && tokens.length <= 5;
    if (isGreeting) {
      return {
        intent: INTENTS.GREETING,
        confidence: 0.95,
        reason: 'Lời chào hỏi hoặc cảm ơn thông thường'
      };
    }

    // 3. Ngoài phạm vi di tích (Out Of Scope) - KIỂM TRA SỚM ĐỂ TRÁNH NHẬN DIỆN NHẦM VÀO GIỜ MỞ CỬA / VÉ
    const hasHoaLoWhitelist = this.hoaLoWhitelist.some(w => norm.includes(' ' + w + ' ') || norm.includes(w));
    if (!hasHoaLoWhitelist) {
      const isOutOfScope = this.outOfScopeEntities.some(e => norm.includes(' ' + e + ' ') || norm.includes(e));
      if (isOutOfScope) {
        return {
          intent: INTENTS.OUT_OF_SCOPE,
          confidence: 0.95,
          reason: 'Câu hỏi hoàn toàn nằm ngoài phạm vi Di tích Nhà tù Hỏa Lò'
        };
      }
    }

    // 4. Khiếu nại, phản ánh không hài lòng (Customer Complaint)
    const complaintSignals = [
      'khong hai long', 'khong tot', 'trai nghiem te', 'dich vu te', 'that vong',
      'buc minh', 'kho chiu', 'thai do nhan vien', 'thieu nhiet tinh', 'thai do khong tot',
      'thai do kem', 'phuc vu kem', 'qua dong', 'chen chuc', 'on ao', 'khieu nai',
      'gop y phan anh', 'mat tien oan', 'rat te', 'khong dang tien',
      'bi re', 're mot ben', 're tai', 're tieng', 'hong tai nghe', 'tai nghe bi', 'khong nghe duoc', 'tai nghe hong', 'loi tai nghe',
      'dissatisfied', 'bad experience', 'terrible', 'awful', 'complaint', 'rude staff',
      'poor service', 'not satisfied', 'unhappy', 'noisy', 'crowded', 'broken headphone', 'audio crackling'
    ];
    if (complaintSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.CUSTOMER_COMPLAINT,
        confidence: 0.92,
        reason: 'Khách hàng bày tỏ sự không hài lòng hoặc khiếu nại dịch vụ'
      };
    }

    // 5. Hỗ trợ khẩn cấp / Mất đồ / Tìm người (Customer Assistance)
    const isLostItem = (
      !norm.includes('ban roi') && !norm.includes('may bay') && !norm.includes('phi cong') &&
      (norm.includes('mat') || norm.includes('that lac') || norm.includes('quen') || norm.includes('roi') || norm.includes('lost')) &&
      (norm.includes(' vi ') || norm.includes(' do ') || norm.includes('dien thoai') || norm.includes('giay to') || norm.includes('tui') || norm.includes('balo') || norm.includes('tai san') || norm.includes('wallet') || norm.includes('phone') || norm.includes('item') || norm.includes('bag'))
    );
    const assistanceSignals = [
      'mat do', 'that lac', 'quen do', 'roi do', 'roi vi', 'mat dien thoai',
      'lac nguoi', 'lac tre em', 'can giup do khan cap', 'lien he ban quan ly',
      'gap nhan vien', 'gap bao ve', 'so cap cuu', ' y te ', 'phong y te',
      'bi lac', 'lac con', 'tim be', 'tim con', 'lac chau', 'lac be', 'tim chau',
      'lost item', 'lost my', 'lost phone', 'lost wallet', 'emergency', 'lost and found', 'first aid', ' medical ', 'lost child'
    ];
    if (isLostItem || assistanceSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.CUSTOMER_ASSISTANCE,
        confidence: 0.95,
        reason: 'Khách hàng cần hỗ trợ đặc biệt (mất đồ, tìm người, y tế)'
      };
    }

    // 5. Tư vấn hành trình & Lộ trình (Tour Recommendation) - Đặt trước Trợ năng để bắt câu hỏi về lộ trình
    const recommendationSignals = [
      'nen tham quan gi truoc', 'it thoi gian', 'co 30 phut', 'co 45 phut', 'co 1 tieng',
      'goi y lo trinh', 'tham quan theo nhom', 'di cung gia dinh', 'co nen di tour dem',
      'tour dem co gi', 'lo trinh nao tot nhat', 'tu van giup toi', 'bao nhieu thoi gian',
      'mat bao lau', 'thoi gian tham quan', 'mat bao nhieu phut', 'may tieng',
      'buoi toi o hoa lo co hoat dong gi', 'buoi toi co hoat dong gi', 'buoi toi',
      'di 20 nguoi', 'di theo doan', 'doan dong', 'dat thuyet minh vien',
      'lo trinh phu hop nhat', 'lo trinh tham quan', 'lo trinh nao', 'lo trinh',
      'what to see', 'recommendation', 'itinerary', 'limited time', '30 minutes', '45 minutes', 'must see', 'highlights', 'group tour'
    ];
    if (recommendationSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.TOUR_RECOMMENDATION,
        confidence: 0.90,
        reason: 'Khách cần gợi ý lộ trình hoặc phân bổ thời gian hợp lý'
      };
    }

    // 6. Hỗ trợ người cao tuổi, trẻ em, xe lăn (Accessibility Support)
    const accessibilitySignals = [
      'xe lan', 'khuyet tat', 'nguoi tan tat', 'nguoi cao tuoi', 'nguoi gia',
      'ong ba gia', 'tre nho', 'tre so sinh', 'xe day tre em', 'xe day em be', 'xe day', 'em be', 'bac thang',
      'loi di rieng', 'co cho ngoi nghi khong', 'ghe ngoi nghi',
      'wheelchair', 'disabled', 'handicapped', 'elderly', 'senior', 'baby stroller', 'children', 'kids', 'ramp'
    ];
    if (accessibilitySignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.ACCESSIBILITY_SUPPORT,
        confidence: 0.92,
        reason: 'Khách hàng hỏi về khả năng tiếp cận và hỗ trợ đối tượng đặc thù'
      };
    }

    // 7. Thông tin vé (Ticket Information)
    const ticketSignals = [
      'gia ve', 've vao cong', 'mua ve', 'tien ve', 've tham quan', 've tour dem', 've xem', 'mua o dau', 'gia bao nhieu',
      'hoc sinh', 'sinh vien', 'hssv', 'giam gia ve', 'mien phi ve', 'dat ve truoc', 'dat ve',
      'doi ve', 'tra ve', 'hoan tien ve',
      'ticket', 'admission', 'entry fee', 'ticket price', 'how much', 'student discount', 'free admission', 'book ticket', 'buy ticket'
    ];
    if (ticketSignals.some(s => norm.includes(s)) && !norm.includes('thoi tiet') && !norm.includes('may bay')) {
      return {
        intent: INTENTS.TICKET_INFORMATION,
        confidence: 0.95,
        reason: 'Hỏi về biểu phí, vé vào cổng và chính sách miễn giảm'
      };
    }

    // 8. Giờ mở cửa & Lịch hoạt động (Opening Hours)
    const hoursSignals = [
      'gio mo cua', 'mo cua luc may gio', 'mo cua may gio', 'may gio mo cua', 'dong cua', 'may gio dong cua',
      'co nghi trua khong', 'ngay le co mo khong', 'tet co mo khong', 'ngay le', 'tet nguyen dan', 'quoc khanh',
      'thu hai co mo khong', 'gio tham quan', 'lich hoat dong', 'mo cua don khach',
      'opening hours', 'opening time', 'open today', 'when does it open', 'closing time', 'what time does it close', 'schedule'
    ];
    if (hoursSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.OPENING_HOURS,
        confidence: 0.95,
        reason: 'Hỏi về khung giờ và ngày mở cửa đón khách'
      };
    }

    // 9. Cơ sở vật chất & Tiện ích (Facility Support)
    const facilitySignals = [
      'nha ve sinh', 'toilet', 'wc', 'gui do', 'cho gui do', 'tu gui do',
      'gui balo', 'gui hanh ly', 'nuoc uong', 'mua nuoc', 'quay luu niem',
      'mua qua', 'chup anh', 'quay phim', 'co duoc chup anh khong', 'wifi',
      'flycam', 'may quay',
      'restroom', 'bathroom', 'locker', 'luggage storage', 'bag storage', 'souvenir', 'gift shop', 'take photo', 'photography', 'drinking water'
    ];
    if (facilitySignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.FACILITY_SUPPORT,
        confidence: 0.92,
        reason: 'Hỏi về vị trí và quy định các tiện ích phục vụ khách'
      };
    }

    // 10. Hướng dẫn tham quan (Visit Guidance)
    const guidanceSignals = [
      'di nhu the nao', 'loi di', 'huong di', 'tim khu vuc', 'cach quan sat',
      'audioguide su dung the nao', 'thuyet minh tu dong', 'quy dinh tham quan',
      'trang phuc tham quan', 'trang phuc', 'mac do gi',
      'how to get', 'direction', 'dress code', 'rules', 'audio guide'
    ];
    if (guidanceSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.VISIT_GUIDANCE,
        confidence: 0.88,
        reason: 'Hướng dẫn tham quan, nội quy hoặc cách di chuyển'
      };
    }


    // 12. Giải thích nguyên nhân & Bối cảnh (Historical Explanation)
    const explanationSignals = [
      'tai sao', 'vi sao', 'nguyen nhan', 'nguon goc', 'vi ly do gi',
      'y nghia la gi', 'muc dich', 'vi sao lai goi la', 'tai sao co ten'
    ];
    if (explanationSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.HISTORICAL_EXPLANATION,
        confidence: 0.88,
        reason: 'Khách hỏi lý do, nguồn gốc hoặc ý nghĩa của sự kiện/tên gọi'
      };
    }

    // 13. Thông tin hiện vật cụ thể (Exhibit Information)
    const exhibitSignals = [
      'may chem', 'cay bang', 'cong ngam', 'cachot', 'cum chan', 'song sat',
      'thung ve sinh', 'but canh bang', 'gach non', 'to bao', 'ao len',
      'nang bao nhieu', 'cao bao nhieu', 'lam bang gi', 'chat lieu',
      'cau tao', 'hoat dong nhu the nao'
    ];
    if (exhibitSignals.some(s => norm.includes(s))) {
      return {
        intent: INTENTS.EXHIBIT_INFORMATION,
        confidence: 0.90,
        reason: 'Khách hỏi về quy cách, chất liệu, tính năng của hiện vật'
      };
    }

    // 14. Sự kiện & Nhân vật lịch sử (Historical Fact)
    return {
      intent: INTENTS.HISTORICAL_FACT,
      confidence: 0.85,
      reason: 'Câu hỏi tra cứu nhân vật, niên đại hoặc sự kiện lịch sử'
    };
  }
}

module.exports = {
  INTENTS,
  classifier: new IntentClassifier()
};
