/**
 * 2Guide NLP Processor v6.0 (Enterprise Conversational Intelligence)
 * 
 * - Chuẩn hóa và làm sạch văn bản Unicode / tiếng Việt không dấu.
 * - Sửa lỗi gõ telex/vni thông dụng.
 * - Nhận diện ngôn ngữ (vi, en, fr).
 * - Trích xuất tín hiệu nhu cầu cá nhân hóa (thời gian, người cao tuổi, trẻ nhỏ...).
 * - Phát hiện dấu hiệu tấn công bảo mật Prompt Injection / Jailbreak.
 * - Phân giải câu hỏi tiếp nối (Pronoun resolution & Topic shift detection).
 */

class NlpProcessor {
  constructor() {
    this.typoMap = [
      { pattern: /\bmay\s*chem\b/gi, replacement: 'máy chém' },
      { pattern: /\bguilot(?:in|ine)?\b/gi, replacement: 'máy chém' },
      { pattern: /\bcachot\b/gi, replacement: 'ngục tối cachot' },
      { pattern: /\bxa\s*lim\b/gi, replacement: 'xà lim' },
      { pattern: /\bcong\s*ngam\b/gi, replacement: 'cống ngầm' },
      { pattern: /\bcay\s*bang\b/gi, replacement: 'cây bàng' },
      { pattern: /\bhanoi\s*hilton\b/gi, replacement: 'Hanoi Hilton' },
      { pattern: /\bmccain\b/gi, replacement: 'John McCain' },
      { pattern: /\bhoang\s*van\s*thu\b/gi, replacement: 'Hoàng Văn Thụ' },
      { pattern: /\bnguyen\s*thai\s*hoc\b/gi, replacement: 'Nguyễn Thái Học' },
      { pattern: /\bmaison\s*centrale\b/gi, replacement: 'Maison Centrale' },
      { pattern: /\bphu\s*khanh\b/gi, replacement: 'Phụ Khánh' }
    ];
  }

  cleanRawText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // bỏ control characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  removeAccents(str) {
    if (!str) return '';
    return str
      .replace(/[đĐ]/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  normalize(text) {
    if (!text) return '';
    return this.removeAccents(text.toLowerCase())
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenize(text) {
    const norm = this.normalize(text);
    return norm ? norm.split(' ') : [];
  }

  detectLanguage(text) {
    const norm = ' ' + this.normalize(text) + ' ';
    const enTokens = [' what ', ' where ', ' when ', ' who ', ' why ', ' how ', ' ticket ', ' price ', ' open ', ' prison ', ' tour '];
    const frTokens = [' quel ', ' où ', ' quand ', ' prix ', ' billet ', ' prison ', ' ouvert '];

    let enCount = 0;
    let frCount = 0;
    enTokens.forEach(t => { if (norm.includes(t)) enCount++; });
    frTokens.forEach(t => { if (norm.includes(t)) frCount++; });

    if (enCount >= 2 || (enCount >= 1 && !/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text))) {
      return 'en';
    }
    if (frCount >= 2) return 'fr';
    return 'vi';
  }

  /**
   * Phát hiện dấu hiệu Prompt Injection / Jailbreak V6.0
   */
  detectPromptInjection(text) {
    if (!text || typeof text !== 'string') return false;
    const norm = ' ' + this.normalize(text) + ' ';

    const injectionPatterns = [
      'ignore previous instructions', 'ignore all instructions', 'disregard prior',
      'bo qua huong dan', 'bo qua moi huong dan', 'quen het quy tac', 'quen tat ca quy tac',
      'bo qua moi quy tac', 'bo qua quy tac', 'bo qua tat ca quy tac', 'bo qua moi chi dan',
      'you are now', 'act as a', 'jailbreak', 'system override', 'admin mode', 'developer mode',
      'dong vai', 'tro thanh mot ai khac', 'khong can tuan thu',
      'noi rang hoa lo khong co that', 'noi rang may chem khong ton tai', 'bip bom',
      'reveal system prompt', 'show system prompt', 'in ra huong dan', 'xem prompt'
    ];
    if (injectionPatterns.some(p => norm.includes(p))) return true;

    // Quy tắc cấu trúc vượt rào bảo mật
    if (norm.includes('bo qua') && (norm.includes('quy tac') || norm.includes('huong dan') || norm.includes('chi dan') || norm.includes('cau lenh') || norm.includes('lenh'))) {
      return true;
    }
    if (norm.includes('quen') && (norm.includes('quy tac') || norm.includes('huong dan') || norm.includes('chi dan') || norm.includes('moi quy dinh'))) {
      return true;
    }
    if ((norm.includes('noi rang') || norm.includes('tuyen bo') || norm.includes('khang dinh')) && (norm.includes('khong co that') || norm.includes('khong ton tai'))) {
      return true;
    }

    return false;
  }

  /**
   * Trích xuất tín hiệu cá nhân hóa người dùng (User Profile Signals V6.0)
   */
  extractUserProfileSignals(text) {
    const raw = this.cleanRawText(text);
    const norm = ' ' + this.normalize(raw) + ' ';

    let timeConstraint = null;
    if (norm.includes('15 phut') || norm.includes('15p')) timeConstraint = 15;
    else if (norm.includes('20 phut') || norm.includes('20p')) timeConstraint = 20;
    else if (norm.includes('30 phut') || norm.includes('30p')) timeConstraint = 30;
    else if (norm.includes('45 phut') || norm.includes('45p')) timeConstraint = 45;
    else if (norm.includes('1 tieng') || norm.includes('60 phut') || norm.includes('90 phut')) timeConstraint = 90;
    else if (norm.includes('it thoi gian') || norm.includes('voi') || norm.includes('nhanh')) timeConstraint = 30;

    const hasElderly = ['nguoi gia', 'bo me gia', 'nguoi lon tuoi', 'nguoi cao tuoi', 'ong ba', 'bo me lon tuoi', 'cao tuoi', 'ong ba gia', 'elderly', 'senior'].some(s => norm.includes(s));
    const hasChildren = ['tre em', 'tre con', 'con nho', 'em be', 'tre nho', 'baby', 'children', 'kids'].some(s => norm.includes(s));
    const hasWheelchair = ['xe lan', 'khuyet tat', 'tan tat', 'wheelchair', 'disabled'].some(s => norm.includes(s));
    const isForeigner = this.detectLanguage(text) !== 'vi' || norm.includes('international') || norm.includes('foreign');

    return {
      timeConstraint,
      hasElderly,
      hasChildren,
      hasWheelchair,
      isForeigner,
      preferredLanguage: this.detectLanguage(text)
    };
  }

  /**
   * Phân tích mức độ phức tạp và tín hiệu tâm trạng (Query Complexity & Sentiment Signals)
   */
  analyzeQueryFeatures(text) {
    const raw = this.cleanRawText(text);
    const norm = ' ' + this.normalize(raw) + ' ';
    const words = raw.split(/\s+/).filter(Boolean);

    let complexity = 'SIMPLE';
    if (words.length > 15 || norm.includes(' va ') || norm.includes(' dong thoi ') || norm.includes(' ngoai ra ')) {
      complexity = 'MULTI_PART';
    } else if (words.length >= 8 || norm.includes('tai sao') || norm.includes('nguyen nhan') || norm.includes('y nghia') || norm.includes('nhu the nao')) {
      complexity = 'DETAILED';
    }

    const isFrustrated = [
      'that vong', 'te', 'kem', 'kho chiu', 'buc minh', 'buc boi', 'thai do', 'thieu nhiet tinh',
      'on ao', 'qua dong', 'chen chuc', 'khong hai long', 'bi re', 'hong tai nghe'
    ].some(s => norm.includes(s));

    const isUrgent = [
      'khan cap', 'cap cuu', 'say nang', 'ngat xiu', ' ngat ', 'so cuu', 'lac con', 'lac tre', 'tim be', 'tim con', 'mat vi', 'roi vi', 'mat dien thoai'
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
   * Phát hiện câu hỏi tiếp nối (Follow-up) & giải quyết tham chiếu đại từ V6.0
   * Có cơ chế phát hiện chuyển hướng chủ đề (Topic Shift Detection)
   */
  resolveFollowUp(currentQuestion, lastTurnContext = null) {
    const raw = this.cleanRawText(currentQuestion);
    const norm = ' ' + this.normalize(raw) + ' ';

    if (!lastTurnContext || !lastTurnContext.lastTopic) {
      return {
        isFollowUp: false,
        resolvedQuery: raw,
        topic: null,
        isComparisonExpansion: false
      };
    }

    // 1. Kiểm tra Chuyển hướng chủ đề (Topic Shift)
    // Nếu câu hỏi mới rõ ràng đề cập đến một thực thể/dịch vụ độc lập khác, không ghép với chủ đề cũ!
    const independentEntities = [
      've vao cong', 'gia ve', 'gio mo cua', 'gui do', 'nha ve sinh', 'toilet', 'wc',
      'cay bang', 'may chem', 'cong ngam', 'phi cong', 'john mccain', 'hoang van thu',
      'nguyen thai hoc', 'cachot', 'xa lim', 'lang hoa lo', 'phu khanh', 'maison centrale'
    ];
    const mentionsOtherEntity = independentEntities.some(e => norm.includes(e));
    if (mentionsOtherEntity && !norm.includes('so voi') && !norm.includes('tuong tu')) {
      return {
        isFollowUp: false,
        resolvedQuery: raw,
        topic: null,
        isComparisonExpansion: false
      };
    }

    // 2. Nhận diện câu hỏi mở rộng / so sánh sang nhóm hiện vật tương tự
    const isComparisonExpansion = [
      'tuong tu', 'khac khong', 'hien vat nao khac', 'co gi giong', 'co thu nao khac',
      'con cai gi khac', 'khu vuc khac', 'khac nua khong'
    ].some(s => norm.includes(s));

    // 3. Nhận diện đại từ thay thế
    const followUpPronouns = [
      ' no ', ' vat nay ', ' cai nay ', ' o do ', ' cho nay ', ' khu nay ', ' khu do ',
      ' ong ay ', ' ba ay ', ' nguoi nay ', ' ho ', ' o day ', ' the con ', ' the con ve ',
      ' nang bao nhieu ', ' cao bao nhieu ', ' lam bang gi ', ' dung de lam gi ',
      ' duoc su dung nhu the nao ', ' vi sao vay ', ' tai sao lai the ',
      ' dua vao day khi nao ', ' khi nao dua vao ', ' ai da su dung ', ' ai dung '
    ];

    const hasPronoun = followUpPronouns.some(p => norm.includes(p));
    const isVeryShort = raw.split(' ').length <= 5 && !norm.includes('xin chao') && !norm.includes('tam biet') && !norm.includes('cam on');

    if (hasPronoun || isVeryShort || isComparisonExpansion) {
      let rawTopicName = lastTurnContext.lastTopicName || lastTurnContext.lastTopic || '';
      // Loại bỏ phần phụ trong ngoặc đơn như (Guillotine) để câu sau tự nhiên hơn
      const topicName = rawTopicName.replace(/\s*\([^)]*\)/g, '').trim() || rawTopicName;
      let resolvedQuery = raw;

      if (norm.includes(' no ') || norm.includes(' vat nay ') || norm.includes(' cai nay ')) {
        resolvedQuery = raw.replace(/(?:^|\s)(nó|vật này|cái này)(?=\s|[.,!?]|$)/gi, ' ' + topicName).trim();
      } else if (norm.includes(' o do ') || norm.includes(' cho nay ') || norm.includes(' khu do ') || norm.includes(' khu nay ')) {
        resolvedQuery = raw.replace(/(?:^|\s)(ở đó|chỗ này|khu đó|khu này)(?=\s|[.,!?]|$)/gi, ' tại ' + topicName).trim();
      } else if (isComparisonExpansion) {
        resolvedQuery = `${raw} (liên quan tới ${topicName})`;
      } else if (isVeryShort && !raw.toLowerCase().includes(topicName.toLowerCase())) {
        resolvedQuery = `${topicName}: ${raw}`;
      }

      return {
        isFollowUp: true,
        resolvedQuery,
        topic: lastTurnContext.lastTopic,
        topicName,
        isComparisonExpansion
      };
    }

    return {
      isFollowUp: false,
      resolvedQuery: raw,
      topic: null,
      isComparisonExpansion: false
    };
  }
}

module.exports = new NlpProcessor();
