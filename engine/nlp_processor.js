/**
 * 2Guide NLP Processor
 * Xử lý ngôn ngữ tự nhiên: Chuẩn hóa, nhận diện ngôn ngữ, sửa lỗi gõ,
 * tách từ và liên kết đại từ ngữ cảnh hội thoại (Follow-up resolution).
 */

class NlpProcessor {
  constructor() {
    this.typoMap = [
      { pattern: /\b(may\s*chem|máy\s*chém|guillotin|guillotine|gillot|gi-lô-tin)\b/gi, replacement: 'máy chém' },
      { pattern: /\b(cay\s*bang|cây\s*bàng|la\s*bang|lá\s*bàng|bup\s*bang|búp\s*bàng|hat\s*bang|hạt\s*bàng|canh\s*bang|cành\s*bàng)\b/gi, replacement: 'cây bàng' },
      { pattern: /\b(cong\s*ngam|cống\s*ngầm|duong\s*cong|đường\s*cống|mieng\s*cong|miệng\s*cống)\b/gi, replacement: 'cống ngầm' },
      { pattern: /\b(cachot|ca\s*chot|ca-sốt|nguc\s*toi|ngục\s*tối|biet\s*giam|biệt\s*giam)\b/gi, replacement: 'ngục tối cachot' },
      { pattern: /\b(hoang\s*van\s*thu|hoàng\s*văn\s*thụ)\b/gi, replacement: 'Hoàng Văn Thụ' },
      { pattern: /\b(nguyen\s*thai\s*hoc|nguyễn\s*thái\s*học)\b/gi, replacement: 'Nguyễn Thái Học' },
      { pattern: /\b(john\s*mccain|mccain|mác\s*kên|mác\s*cain)\b/gi, replacement: 'John McCain' },
      { pattern: /\b(pete\s*peterson|douglas\s*peterson|peterson|pi-tơ-xơn)\b/gi, replacement: 'Pete Peterson' },
      { pattern: /\b(dem\s*thieng\s*lieng|đêm\s*thiêng\s*liêng|tour\s*dem|tour\s*đêm)\b/gi, replacement: 'Đêm thiêng liêng' },
      { pattern: /\b(gia\s*ve|giá\s*vé|ve\s*vao|vé\s*vào|mua\s*ve|mua\s*vé|tien\s*ve|tiền\s*vé)\b/gi, replacement: 'giá vé' },
      { pattern: /\b(gio\s*mo\s*cua|giờ\s*mở\s*cửa|may\s*gio\s*dong\s*cua|mấy\s*giờ\s*đóng\s*cửa|thoi\s*gian\s*mo\s*cua)\b/gi, replacement: 'giờ mở cửa' },
      { pattern: /\b(nha\s*ve\s*sinh|nhà\s*vệ\s*sinh|toilet|wc|ve\s*sinh)\b/gi, replacement: 'nhà vệ sinh' },
      { pattern: /\b(gui\s*do|gửi\s*đồ|de\s*do|để\s*đồ|balo|hanh\s*ly|hành\s*lý)\b/gi, replacement: 'gửi đồ' },
      { pattern: /\b(xe\s*lan|xe\s*lăn|khuyet\s*tat|khuyết\s*tật|nguoi\s*gia|người\s*già|cao\s*tuoi|cao\s*tuổi)\b/gi, replacement: 'người cao tuổi và khuyết tật' }
    ];
  }

  normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanRawText(text) {
    if (!text || typeof text !== 'string') return '';
    // Lọc các thẻ độc hại hoặc inject mã
    let cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[system\]/gi, '')
      .replace(/ignore\s+previous\s+instructions/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned;
  }

  tokenize(text) {
    const norm = this.normalize(text);
    return norm.split(' ').filter(w => w.length > 1);
  }

  tokenizeSet(text) {
    return new Set(this.tokenize(text));
  }

  detectLanguage(text) {
    if (!text) return 'vi';
    const lower = text.toLowerCase();

    // Dấu hiệu tiếng Việt đặc trưng
    const viAccentRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    if (viAccentRegex.test(lower)) return 'vi';

    const viKeywords = ['tôi', 'bạn', 'có', 'không', 'là', 'gì', 'thế', 'nào', 'tại', 'sao', 'bao', 'nhiêu', 'ở', 'đâu', 'vé', 'cửa', 'hỏa', 'lò', 'máy', 'chém'];
    const viMatches = viKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(lower));
    if (viMatches.length >= 2) return 'vi';

    // Dấu hiệu tiếng Anh
    const enKeywords = ['what', 'where', 'when', 'who', 'why', 'how', 'is', 'are', 'the', 'ticket', 'price', 'opening', 'hours', 'prison', 'guillotine', 'escape', 'can', 'i', 'you', 'help'];
    const enMatches = enKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(lower));
    if (enMatches.length >= 2 || (enMatches.length >= 1 && !viMatches.length)) {
      return 'en';
    }

    // Dấu hiệu tiếng Pháp
    const frKeywords = ['bonjour', 'prison', 'billet', 'horaire', 'guillotine', 'merci', 'comment', 'pourquoi'];
    const frMatches = frKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(lower));
    if (frMatches.length >= 2) return 'fr';

    return 'vi';
  }

  /**
   * Phát hiện dấu hiệu Prompt Injection / Jailbreak
   */
  detectPromptInjection(text) {
    if (!text || typeof text !== 'string') return false;
    const norm = ' ' + this.normalize(text) + ' ';
    const injectionPatterns = [
      'ignore previous instructions', 'ignore all instructions', 'disregard prior',
      'bo qua huong dan', 'bo qua moi huong dan', 'quen het quy tac', 'quen tat ca quy tac',
      'bo qua moi quy tac', 'bo qua quy tac', 'bo qua tat ca quy tac',
      'you are now', 'act as a', 'jailbreak', 'system override', 'admin mode', 'developer mode',
      'dong vai', 'tro thanh mot ai khac', 'khong can tuan thu',
      'noi rang hoa lo khong co that', 'noi rang may chem khong ton tai', 'bip bom'
    ];
    if (injectionPatterns.some(p => norm.includes(p))) return true;

    // Quy tắc cấu trúc vượt rào bảo mật
    if (norm.includes('bo qua') && (norm.includes('quy tac') || norm.includes('huong dan') || norm.includes('chi dan') || norm.includes('cau lenh') || norm.includes('lenh'))) {
      return true;
    }
    if (norm.includes('quen') && (norm.includes('quy tac') || norm.includes('huong dan') || norm.includes('chi dan'))) {
      return true;
    }
    if ((norm.includes('noi rang') || norm.includes('tuyen bo') || norm.includes('khang dinh')) && (norm.includes('khong co that') || norm.includes('khong ton tai'))) {
      return true;
    }

    return false;
  }

  /**
   * Phân tích mức độ phức tạp và tín hiệu hỗ trợ (Query Complexity & Sentiment Signals)
   */
  analyzeQueryFeatures(text) {
    const raw = this.cleanRawText(text);
    const norm = ' ' + this.normalize(raw) + ' ';
    const words = raw.split(/\s+/).filter(Boolean);

    // 1. Phân loại độ phức tạp (Complexity)
    let complexity = 'SIMPLE';
    if (words.length > 15 || norm.includes(' va ') || norm.includes(' dong thoi ') || norm.includes(' ngoai ra ')) {
      complexity = 'MULTI_PART';
    } else if (words.length >= 8 || norm.includes('tai sao') || norm.includes('nguyen nhan') || norm.includes('y nghia') || norm.includes('nhu the nao')) {
      complexity = 'DETAILED';
    }

    // 2. Tín hiệu trạng thái hỗ trợ (Không gán nhãn cố định)
    const isFrustrated = [
      'that vong', 'te', 'kem', 'kho chiu', 'buc minh', 'buc boi', 'thai do', 'thieu nhiet tinh',
      'on ao', 'qua dong', 'chen chuc', 'khong hai long', 'bi re', 'hong tai nghe'
    ].some(s => norm.includes(s));

    const isUrgent = [
      'khan cap', 'cap cuu', 'ngat', 'so cuu', 'lac con', 'lac tre', 'tim be', 'tim con', 'mat vi', 'roi vi', 'mat dien thoai'
    ].some(s => norm.includes(s));

    const isPolicyQuery = [
      'quy dinh', 'chinh sach', 'gia ve', 'gio mo cua', 'hoan tien', 'doi ve', 'co duoc phep', 'co duoc mang'
    ].some(s => norm.includes(s));

    return {
      wordCount: words.length,
      complexity,
      signals: {
        isFrustrated,
        isUrgent,
        isPolicyQuery
      }
    };
  }

  standardizeTypos(text) {
    if (!text) return '';
    let result = text;
    for (const rule of this.typoMap) {
      result = result.replace(rule.pattern, rule.replacement);
    }
    return result;
  }

  /**
   * Phát hiện câu hỏi tiếp nối (Follow-up) & giải quyết tham chiếu đại từ
   */
  resolveFollowUp(currentQuestion, lastTurnContext = null) {
    const raw = this.cleanRawText(currentQuestion);
    const norm = ' ' + this.normalize(raw) + ' ';

    if (!lastTurnContext || !lastTurnContext.lastTopic) {
      return {
        isFollowUp: false,
        resolvedQuery: raw,
        topic: null
      };
    }

    const followUpPronouns = [
      ' no ', ' vat nay ', ' cai nay ', ' o do ', ' cho nay ', ' khu nay ', ' khu do ',
      ' ong ay ', ' ba ay ', ' nguoi nay ', ' ho ', ' o day ', ' the con ', ' the con ve ',
      ' nang bao nhieu ', ' cao bao nhieu ', ' lam bang gi ', ' dung de lam gi ',
      ' duoc su dung nhu the nao ', ' vi sao vay ', ' tai sao lai the '
    ];

    const hasPronoun = followUpPronouns.some(p => norm.includes(p));
    const isVeryShort = raw.split(' ').length <= 4 && !norm.includes('xin chao') && !norm.includes('tam biet');

    if (hasPronoun || isVeryShort) {
      const topicName = lastTurnContext.lastTopicName || lastTurnContext.lastTopic;
      // Ghép thực thể của lượt trước vào câu hỏi hiện tại
      let resolvedQuery = raw;
      if (norm.includes(' no ') || norm.includes(' vat nay ') || norm.includes(' cai nay ')) {
        resolvedQuery = raw.replace(/(?:^|\s)(nó|vật này|cái này)(?=\s|[.,!?]|$)/gi, ' ' + topicName).trim();
      } else if (norm.includes(' o do ') || norm.includes(' cho nay ') || norm.includes(' khu do ') || norm.includes(' khu nay ')) {
        resolvedQuery = raw.replace(/(?:^|\s)(ở đó|chỗ này|khu đó|khu này)(?=\s|[.,!?]|$)/gi, ' tại ' + topicName).trim();
      } else if (isVeryShort && !raw.toLowerCase().includes(topicName.toLowerCase())) {
        resolvedQuery = `${topicName}: ${raw}`;
      }

      return {
        isFollowUp: true,
        resolvedQuery,
        topic: lastTurnContext.lastTopic,
        topicName
      };
    }

    return {
      isFollowUp: false,
      resolvedQuery: raw,
      topic: null
    };
  }
}

module.exports = new NlpProcessor();
