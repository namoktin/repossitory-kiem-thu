/**
 * 2Guide Answer Validator Engine
 * Kiểm duyệt và chuẩn hóa chất lượng câu trả lời trước khi gửi đến du khách:
 * 1. Chống bịa đặt (Anti-hallucination): Kiểm tra các số liệu, nhân vật, địa danh cốt lõi.
 * 2. Lọc bỏ văn mẫu máy móc (Anti-boilerplate): Xóa bỏ các câu mở đầu/kết thúc lặp lại.
 * 3. Kiểm tra tính chuẩn mực dịch vụ khách hàng (Customer Care standards).
 */

class AnswerValidator {
  constructor() {
    this.forbiddenOpenings = [
      /^xin\s*chào\s*quý\s*khách[!.,\s]*/i,
      /^rất\s*vui\s*được\s*đồng\s*hành\s*cùng\s*(quý\s*khách|bạn)[!.,\s]*/i,
      /^theo\s*tư\s*liệu\s*lịch\s*sử\s*(xác\s*thực\s*lưu\s*trữ\s*tại\s*nhà\s*tù\s*hỏa\s*lò|hỏa\s*lò)?:?\s*/i,
      /^về\s*thắc\s*mắc\s*của\s*bạn\s*tại\s*gian\s*trưng\s*bày\s*này:?\s*/i,
      /^một\s*chi\s*tiết\s*lịch\s*sử\s*rất\s*xúc\s*động\s*và\s*đặc\s*biệt:?\s*/i
    ];

    this.forbiddenClosings = [
      /mời\s*bạn\s*quan\s*sát\s*kỹ\s*hiện\s*vật\s*trước\s*mắt\s*và\s*tiếp\s*tục\s*lộ\s*trình\s*tham\s*quan\s*nhé[.!]*$/i,
      /sau\s*điểm\s*dừng\s*này,\s*bạn\s*có\s*thể\s*bước\s*tiếp\s*sang\s*khu\s*vực\s*lân\s*cận\s*để\s*khám\s*phá\s*thêm\s*nhiều\s*câu\s*chuyện\s*thiêng\s*liêng[.!]*$/i,
      /chúc\s*bạn\s*có\s*một\s*chuyến\s*tham\s*quan\s*đầy\s*xúc\s*cảm\s*và\s*tự\s*hào\s*tại\s*di\s*tích\s*hỏa\s*lò[.!]*$/i,
      /hãy\s*lưu\s*ý\s*cẩn\s*thận\s*khi\s*bước\s*qua\s*các\s*bậc\s*cửa\s*cổ\s*và\s*đừng\s*ngần\s*ngại\s*hỏi\s*tôi\s*bất\s*cứ\s*khi\s*nào\s*nhé[.!]*$/i,
      /mời\s*bạn\s*lắng\s*nghe\s*tiếp\s*câu\s*chuyện\s*tiếp\s*theo\s*khi\s*di\s*chuyển\s*đến\s*trạm\s*di\s*tích\s*kế\s*bên[.!]*$/i
    ];

    // Các sai lệch lịch sử nghiêm trọng cần ngăn chặn
    this.criticalFactChecks = [
      {
        check: (text) => text.includes('Nguyễn Thái Học') && text.includes('Hành quyết tại Hỏa Lò'),
        fix: 'Nguyễn Thái Học bị thực dân Pháp đưa máy chém lên thị xã Yên Bái để hành quyết sáng ngày 17/6/1930 (không phải hành quyết tại Hỏa Lò).'
      },
      {
        check: (text) => text.includes('Hoàng Văn Thụ') && text.includes('máy chém'),
        fix: 'Đồng chí Hoàng Văn Thụ bị xử bắn tại trường bắn Tương Mai ngày 24/5/1944, không bị xử chém.'
      },
      {
        check: (text) => (text.includes('16 người vượt ngục') || text.includes('16 tử tù')) && text.includes('tất cả đều thoát'),
        fix: 'Trong 16 tử tù cưa song sắt chui cống ngầm đêm 24/12/1951, có 5 đồng chí thoát ra vùng tự do kháng chiến an toàn, số còn lại bị địch bắt lại.'
      }
    ];
  }

  /**
   * Làm sạch các câu mở đầu/kết thúc khuôn mẫu để đảm bảo trả lời trực tiếp
   */
  stripBoilerplate(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text.trim();

    // Xóa mở đầu khuôn mẫu nếu có
    for (const pattern of this.forbiddenOpenings) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    // Xóa kết thúc khuôn mẫu nếu có
    for (const pattern of this.forbiddenClosings) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    // Viết hoa chữ cái đầu tiên sau khi xóa mở đầu
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Kiểm định dữ kiện sự thật lịch sử
   */
  validateFacts(replyText, groundTruthContext = null) {
    let validated = replyText;
    let modified = false;

    // Kiểm tra các lỗi phổ biến
    for (const rule of this.criticalFactChecks) {
      if (rule.check(validated)) {
        validated = validated + ` (Lưu ý lịch sử chính xác: ${rule.fix})`;
        modified = true;
      }
    }

    return {
      text: validated,
      isModified: modified
    };
  }

  /**
   * Quy trình thẩm định hoàn chỉnh
   */
  validateAndRefine(replyText, intent, groundTruthContext = null) {
    if (!replyText) return '';

    // 1. Tước bỏ văn mẫu rập khuôn
    let refined = this.stripBoilerplate(replyText);

    // 2. Kiểm định sự thật
    const factCheck = this.validateFacts(refined, groundTruthContext);
    refined = factCheck.text;

    // 3. Đảm bảo câu trả lời kết thúc bằng dấu chấm hoàn chỉnh
    refined = refined.trim();
    if (!/[.!?]$/.test(refined)) {
      refined += '.';
    }

    return refined;
  }
}

module.exports = new AnswerValidator();
