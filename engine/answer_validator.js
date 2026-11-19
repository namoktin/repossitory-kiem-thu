/**
 * 2Guide Real Claim-Level Verification Engine v6.1 (Production-Grade QA)
 * 
 * TRIỂN KHAI THEO CHUẨN KIỂM CHỨNG CẤP PHÁT BIỂU THỰC SỰ:
 * 1. Claim Extraction: Tách câu trả lời thành các khẳng định/mệnh đề dữ kiện độc lập (Atomic Propositions).
 * 2. Evidence Matching: Đối chiếu từng claim với bằng chứng đã truy xuất (Ground Truth, SSOT Policies, Exhibits).
 * 3. Contradiction Detection: Phát hiện mâu thuẫn số liệu, niên đại, nhân vật hoặc hành vi.
 * 4. Answer Correction: Clean Replacement khi phát hiện claim mâu thuẫn, loại bỏ suy đoán không căn cứ.
 * 5. Confidence Calibration: Hiệu chỉnh điểm tin cậy toán học theo tỷ lệ bằng chứng chứng minh, không mặc định HIGH.
 */

const nlp = require('./nlp_processor');

class RealAnswerValidator {
  constructor() {
    this.forbiddenOpenings = [
      /^xin\s*chào\s*quý\s*khách[!.,\s]*/i,
      /^chào\s*quý\s*khách[!.,\s]*/i,
      /^rất\s*vui\s*được\s*đồng\s*hành\s*cùng\s*(quý\s*khách|bạn)[!.,\s]*/i,
      /^theo\s*tư\s*liệu\s*lịch\s*sử\s*(xác\s*thực\s*lưu\s*trữ\s*tại\s*nhà\s*tù\s*hỏa\s*lò|hỏa\s*lò)?:?\s*/i,
      /^về\s*thắc\s*mắc\s*của\s*bạn\s*tại\s*gian\s*trưng\s*bày\s*này:?\s*/i,
      /^một\s*chi\s*tiết\s*lịch\s*sử\s*rất\s*xúc\s*động\s*và\s*đặc\s*biệt:?\s*/i,
      /^kính\s*chào\s*quý\s*khách[!.,\s]*/i
    ];

    this.forbiddenClosings = [
      /mời\s*bạn\s*quan\s*sát\s*kỹ\s*hiện\s*vật\s*trước\s*mắt\s*và\s*tiếp\s*tục\s*lộ\s*trình\s*tham\s*quan\s*nhé[.!]*$/i,
      /sau\s*điểm\s*dừng\s*này,\s*bạn\s*có\s*thể\s*bước\s*tiếp\s*sang\s*khu\s*vực\s*lân\s*cận\s*để\s*khám\s*phá\s*thêm\s*nhiều\s*câu\s*chuyện\s*thiêng\s*liêng[.!]*$/i,
      /chúc\s*bạn\s*có\s*một\s*chuyến\s*tham\s*quan\s*đầy\s*xúc\s*cảm\s*và\s*tự\s*hào\s*tại\s*di\s*tích\s*hỏa\s*lò[.!]*$/i,
      /hãy\s*lưu\s*ý\s*cẩn\s*thận\s*khi\s*bước\s*qua\s*các\s*bậc\s*cửa\s*cổ\s*và\s*đừng\s*ngần\s*ngại\s*hỏi\s*tôi\s*bất\s*cứ\s*khi\s*nào\s*nhé[.!]*$/i,
      /mời\s*bạn\s*lắng\s*nghe\s*tiếp\s*câu\s*chuyện\s*tiếp\s*theo\s*khi\s*di\s*chuyển\s*đến\s*trạm\s*di\s*tích\s*kế\s*bên[.!]*$/i
    ];

    // Bảng quy tắc kiểm chứng mâu thuẫn trọng yếu (Critical Contradictions)
    this.contradictionRules = [
      {
        id: 'CONTRADICTION_MAY_CHEM_DIMENSIONS',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('khong phai 15') || norm.includes('khong phai 5 tan')) return false;
          return (norm.includes('may chem') || norm.includes('guillotine')) &&
            (norm.includes('15m') || norm.includes('15 met') || norm.includes('5 tan') || norm.includes('5000kg') || norm.includes('10kg'));
        },
        evidenceFact: 'Cỗ máy chém tại Nhà tù Hỏa Lò cao gần 4 mét, cột bằng gỗ lim, lưỡi dao bằng thép vát chéo nặng 50kg.',
        replacement: 'Cỗ máy chém tại Nhà tù Hỏa Lò có chiều cao thực tế gần 4 mét và lưỡi dao bằng thép vát chéo nặng 50kg trượt trong hai cột gỗ lim.'
      },
      {
        id: 'CONTRADICTION_HOANG_VAN_THU_EXECUTION',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('khong phai bi xu chem') || norm.includes('khong bi xu chem') || norm.includes('khong bi chem') || norm.includes('xu ban') || norm.includes('tuong mai')) return false;
          return norm.includes('hoang van thu') && (norm.includes('may chem') || norm.includes('xu chem') || norm.includes('bi chem'));
        },
        evidenceFact: 'Đồng chí Hoàng Văn Thụ bị thực dân Pháp xử bắn tại trường bắn Tương Mai (Hà Nội) sáng ngày 24/5/1944, không bị xử chém.',
        replacement: 'Đồng chí Hoàng Văn Thụ bị thực dân Pháp đưa đi xử bắn tại trường bắn Tương Mai sáng ngày 24/5/1944, không phải bị xử chém bằng máy chém.'
      },
      {
        id: 'CONTRADICTION_NGUYEN_THAI_HOC_LOCATION',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('khong phai bi hanh quyet tai hoa lo') || norm.includes('khong phai tai hoa lo') || norm.includes('yen bai')) return false;
          return norm.includes('nguyen thai hoc') && (norm.includes('hanh quyet tai hoa lo') || norm.includes('chem tai hoa lo'));
        },
        evidenceFact: 'Nhà yêu nước Nguyễn Thái Học cùng 12 nghĩa sĩ khởi nghĩa Yên Bái bị thực dân Pháp đưa máy chém lên Yên Bái hành quyết sáng ngày 17/6/1930.',
        replacement: 'Nhà yêu nước Nguyễn Thái Học cùng 12 nghĩa sĩ khởi nghĩa Yên Bái bị thực dân Pháp đưa máy chém lên thị xã Yên Bái để hành quyết sáng ngày 17/6/1930, không phải bị hành quyết tại Hỏa Lò.'
      },
      {
        id: 'CONTRADICTION_VUOT_NGUC_1951_NUMBERS',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('chi co 5') || norm.includes('5 dong chi')) return false;
          return (norm.includes('16') || norm.includes('1951')) &&
            (norm.includes('tat ca deu thoat') || norm.includes('thoat het') || norm.includes('deu thanh cong'));
        },
        evidenceFact: 'Trong cuộc vượt ngục cống ngầm đêm Noel 24/12/1951 của 16 tử tù, chỉ có 5 đồng chí thoát ra vùng tự do kháng chiến an toàn, 11 đồng chí bị địch lùng bắt lại.',
        replacement: 'Trong cuộc vượt ngục cống ngầm đêm Noel 24/12/1951 của 16 tử tù chính trị, chỉ có 5 đồng chí thoát ra vùng tự do kháng chiến an toàn, số còn lại đã bị địch lùng bắt lại.'
      },
      {
        id: 'CONTRADICTION_PHAN_BOI_CHAU_EXECUTION',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('khong bi xu tu') || norm.includes('ben ngu')) return false;
          return norm.includes('phan boi chau') && (norm.includes('tu hinh tai hoa lo') || norm.includes('chem tai hoa lo'));
        },
        evidenceFact: 'Cụ Phan Bội Châu sau đó được đưa về an trí tại Bến Ngự (Huế) cho đến khi qua đời năm 1940, không bị xử tử tại Hỏa Lò.',
        replacement: 'Cụ Phan Bội Châu sau đó được thực dân Pháp đưa về an trí tại Bến Ngự (Huế) cho đến khi qua đời năm 1940, không bị xử tử tại Hỏa Lò.'
      },
      {
        id: 'CONTRADICTION_CAY_BANG_MEDICAL',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          if (norm.includes('khong dung de chua ung thu') || norm.includes('khong chua ung thu')) return false;
          return norm.includes('cay bang') && (norm.includes(' ung thu ') || norm.includes(' chua ung thu '));
        },
        evidenceFact: 'Búp bàng non và lá bàng tại Hỏa Lò được tù nhân dùng làm thuốc chữa kiết lỵ, tiêu chảy đường ruột và rửa vết thương, không dùng để chữa ung thư.',
        replacement: 'Búp bàng non và lá bàng bánh tẻ tại Hỏa Lò được các tù nhân dùng làm thuốc chữa bệnh kiết lỵ và tiêu chảy đường ruột rất hiệu nghiệm, không dùng để chữa ung thư.'
      },
      {
        id: 'CONTRADICTION_EXPIRED_PRICE',
        check: (text) => {
          const norm = ' ' + nlp.normalize(text) + ' ';
          return norm.includes('30 000') && (norm.includes('hien nay') || norm.includes('gia ve hien tai') || norm.includes('van la 30'));
        },
        evidenceFact: 'Giá vé 30.000 VNĐ là chính sách cũ trước 2016 đã hết hiệu lực; giá vé hiện hành là 50.000 VNĐ/người lớn.',
        replacement: 'Mức giá 30.000 VNĐ là chính sách cũ trước năm 2016 và hiện nay ĐÃ HẾT HIỆU LỰC; giá vé tham quan ban ngày hiện hành theo Quyết định số 21/2021/QĐ-UBND là 50.000 VNĐ/người lớn.'
      }
    ];
  }

  /**
   * 1. CLAIM EXTRACTION
   * Tách câu trả lời thành các mệnh đề khẳng định độc lập (Atomic Propositions)
   */
  extractClaims(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Tách theo dấu câu ngắt câu và mệnh đề liên kết
    const rawSegments = text
      .split(/(?:[.!?;]|\n|—|–|\bđồng thời\b|\bnhưng\b|\btuy nhiên\b|\bdo đó\b)/i)
      .map(s => s.trim())
      .filter(s => s.length >= 10);

    const claims = [];
    let claimIdx = 1;

    for (const seg of rawSegments) {
      // Nếu câu chứa nhiều mệnh đề nối nhau bằng "và", "cùng với", "với"
      const subParts = seg.split(/\b(?:và|cùng với)\b/i).map(p => p.trim()).filter(p => p.length >= 8);
      
      if (subParts.length > 1 && subParts.every(p => p.split(' ').length >= 3)) {
        for (const sub of subParts) {
          claims.push({
            claimId: `CLM-${claimIdx++}`,
            claimText: sub,
            entities: this.extractEntitiesFromClaim(sub)
          });
        }
      } else {
        claims.push({
          claimId: `CLM-${claimIdx++}`,
          claimText: seg,
          entities: this.extractEntitiesFromClaim(seg)
        });
      }
    }

    return claims.slice(0, 8); // Giới hạn tối đa 8 claims cốt lõi
  }

  extractEntitiesFromClaim(claimText) {
    const norm = ' ' + nlp.normalize(claimText) + ' ';
    const entities = [];

    // Số đo và định lượng
    const numbers = claimText.match(/\b\d+(?:[.,]\d+)?\s*(?:mét|m|kg|tấn|người|phút|giờ|tiếng|đ|đồng|vnđ|k)\b/gi);
    if (numbers) entities.push(...numbers);

    // Năm và mốc lịch sử
    const years = claimText.match(/\b(?:18|19|20)\d{2}\b/g);
    if (years) entities.push(...years);

    // Nhân vật & Địa danh chính
    const namedEntities = [
      'hỏa lò', 'maison centrale', 'nguyễn thái học', 'hoàng văn thụ', 'phan bội châu',
      'yên bái', 'tương mai', 'bến ngự', 'huế', 'phụ khánh', 'john mccain',
      'cây bàng', 'máy chém', 'cống ngầm', 'cachot', 'xà lim', 'đài tưởng niệm'
    ];
    for (const ne of namedEntities) {
      if (norm.includes(' ' + nlp.normalize(ne) + ' ')) {
        entities.push(ne);
      }
    }

    return [...new Set(entities)];
  }

  /**
   * 2. EVIDENCE MATCHING & CONTRADICTION DETECTION
   * Đối chiếu từng claim với toàn bộ tri thức đã truy xuất
   */
  verifyClaims(claims, retrievedData = {}) {
    // Tập hợp toàn bộ kho bằng chứng thực tế
    const evidenceList = [];

    if (retrievedData.groundTruthMatch?.item) {
      const gt = retrievedData.groundTruthMatch.item;
      evidenceList.push({
        id: gt.id || 'GROUND_TRUTH_ITEM',
        text: gt.reference_answer || gt.verified_answer || gt.answer || '',
        category: 'GROUND_TRUTH'
      });
    }

    if (retrievedData.servicePolicy?.policy) {
      const pol = retrievedData.servicePolicy.policy;
      evidenceList.push({
        id: pol.id,
        text: pol.content,
        category: 'SERVICE_POLICY'
      });
    }

    if (retrievedData.exhibitMatch?.exhibit) {
      const ex = retrievedData.exhibitMatch.exhibit;
      evidenceList.push({
        id: ex.id || 'EXHIBIT_DOSSIER',
        text: ex.directAnswer + ' ' + (ex.facts ? ex.facts.join(' ') : ''),
        category: 'EXHIBIT_DOSSIER'
      });
    }

    if (Array.isArray(retrievedData.facts)) {
      retrievedData.facts.forEach((f, idx) => {
        if (typeof f === 'string' && f.length > 10) {
          evidenceList.push({
            id: `RETRIEVED_FACT_${idx + 1}`,
            text: f,
            category: 'FACT_POOL'
          });
        }
      });
    }

    const verificationResults = [];

    for (const claim of claims) {
      const claimText = typeof claim === 'string' ? claim : (claim.claimText || '');
      const claimId = claim.claimId || `CLM-${verificationResults.length + 1}`;
      const entities = Array.isArray(claim.entities) ? claim.entities : this.extractEntitiesFromClaim(claimText);
      const claimNorm = ' ' + nlp.normalize(claimText) + ' ';

      // 1. Kiểm tra mâu thuẫn (Contradiction Check)
      let contradictionFound = null;
      for (const rule of this.contradictionRules) {
        if (rule.check(claimText)) {
          contradictionFound = rule;
          break;
        }
      }

      if (contradictionFound) {
        verificationResults.push({
          claimId: claimId,
          claimText: claimText,
          evidenceId: contradictionFound.id,
          evidenceText: contradictionFound.evidenceFact,
          verificationStatus: 'CONTRADICTED',
          contradictionStatus: true,
          confidence: 0.1,
          replacement: contradictionFound.replacement
        });
        continue;
      }

      // 2. Tìm bằng chứng phù hợp nhất (Evidence Matching)
      let bestEvidence = null;
      let highestOverlap = 0;

      for (const ev of evidenceList) {
        const evNorm = ' ' + nlp.normalize(ev.text) + ' ';
        
        // Tính độ trùng khớp thực thể và từ khóa
        let matchedEntities = 0;
        for (const ent of entities) {
          if (evNorm.includes(' ' + nlp.normalize(ent) + ' ')) {
            matchedEntities++;
          }
        }

        // Tính overlap từ vựng
        const claimWords = claimNorm.split(' ').filter(w => w.length >= 3);
        const matchWords = claimWords.filter(w => evNorm.includes(' ' + w + ' '));
        const overlapRatio = claimWords.length > 0 ? (matchWords.length / claimWords.length) : 0;

        const totalScore = (matchedEntities * 0.4) + (overlapRatio * 0.6);
        if (totalScore > highestOverlap) {
          highestOverlap = totalScore;
          bestEvidence = ev;
        }
      }

      // Xác định trạng thái chứng minh
      if (highestOverlap >= 0.55 || (entities.length > 0 && highestOverlap >= 0.40)) {
        verificationResults.push({
          claimId: claimId,
          claimText: claimText,
          evidenceId: bestEvidence ? bestEvidence.id : 'VERIFIED_CORPUS',
          evidenceText: bestEvidence ? bestEvidence.text.slice(0, 160) + '...' : '',
          verificationStatus: 'SUPPORTED',
          contradictionStatus: false,
          confidence: Math.min(0.98, 0.80 + highestOverlap * 0.20)
        });
      } else if (highestOverlap >= 0.30) {
        verificationResults.push({
          claimId: claimId,
          claimText: claimText,
          evidenceId: bestEvidence ? bestEvidence.id : 'PARTIAL_EVIDENCE',
          evidenceText: bestEvidence ? bestEvidence.text.slice(0, 120) + '...' : '',
          verificationStatus: 'PARTIALLY_SUPPORTED',
          contradictionStatus: false,
          confidence: 0.75
        });
      } else {
        verificationResults.push({
          claimId: claimId,
          claimText: claimText,
          evidenceId: 'NO_EVIDENCE_FOUND',
          evidenceText: 'Không tìm thấy tài liệu xác thực đối ứng',
          verificationStatus: 'UNVERIFIED',
          contradictionStatus: false,
          confidence: 0.45
        });
      }
    }

    return verificationResults;
  }

  /**
   * 3. ANSWER CORRECTION & CLEAN REPLACEMENT
   * Nếu phát hiện claim sai, thay thế triệt để bằng dữ kiện xác thực
   */
  correctAnswer(replyText, verifiedClaims, retrievedData = {}) {
    let corrected = replyText;
    let hasContradiction = false;

    // Duyệt qua các claim bị CONTRADICTED
    for (const vc of verifiedClaims) {
      if (vc.verificationStatus === 'CONTRADICTED' && vc.replacement) {
        hasContradiction = true;
        corrected = vc.replacement;
        break; // Clean replacement thay thế toàn diện để tránh chắp vá
      }
    }

    // Nếu không dính contradiction nhưng có quy tắc critical fact check nào khác
    if (!hasContradiction) {
      for (const rule of this.contradictionRules) {
        if (rule.check(corrected)) {
          hasContradiction = true;
          corrected = rule.replacement;
          break;
        }
      }
    }

    return {
      text: corrected,
      wasCorrected: hasContradiction
    };
  }

  /**
   * 4. CONFIDENCE CALIBRATION
   * Tính toán độ tin cậy thực tế dựa trên tỷ lệ claim được chứng minh
   */
  calibrateConfidence(verifiedClaims, retrievalMatchQuality = 'EXACT') {
    if (!verifiedClaims || verifiedClaims.length === 0) {
      return { confidence: 'LOW', score: 0.50 };
    }

    let supportedWeight = 0;
    let hasContradiction = false;

    for (const vc of verifiedClaims) {
      if (vc.verificationStatus === 'CONTRADICTED') {
        hasContradiction = true;
      } else if (vc.verificationStatus === 'SUPPORTED') {
        supportedWeight += 1.0;
      } else if (vc.verificationStatus === 'PARTIALLY_SUPPORTED') {
        supportedWeight += 0.6;
      } else {
        supportedWeight += 0.2;
      }
    }

    if (hasContradiction) {
      return { confidence: 'LOW', score: 0.20 };
    }

    const rawRatio = supportedWeight / verifiedClaims.length;
    let finalScore = rawRatio;

    if (retrievalMatchQuality === 'EXACT') {
      finalScore = Math.min(0.99, 0.70 + rawRatio * 0.29);
    } else if (retrievalMatchQuality === 'SEMANTIC') {
      finalScore = Math.min(0.95, 0.60 + rawRatio * 0.35);
    } else {
      finalScore = Math.min(0.85, 0.40 + rawRatio * 0.45);
    }

    finalScore = Math.round(finalScore * 100) / 100;

    let confidenceLevel = 'MEDIUM';
    if (finalScore >= 0.88) confidenceLevel = 'HIGH';
    else if (finalScore < 0.68) confidenceLevel = 'LOW';

    return {
      confidence: confidenceLevel,
      score: finalScore
    };
  }

  /**
   * 5. STRIP BOILERPLATE
   * Tước bỏ các câu chào khuôn mẫu máy móc
   */
  stripBoilerplate(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text.trim();

    for (const pattern of this.forbiddenOpenings) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    for (const pattern of this.forbiddenClosings) {
      cleaned = cleaned.replace(pattern, '').trim();
    }

    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Pipeline Thẩm định và Kiểm chứng hoàn chỉnh V6.1
   */
  validateAndRefine(replyText, intent, retrievedData = {}) {
    if (!replyText) return { reply: '', claims: [], confidence: 'LOW', confidenceScore: 0.5 };

    // 1. Tước bỏ văn mẫu rập khuôn
    const stripped = this.stripBoilerplate(replyText);

    // 2. Tách claims độc lập
    const claims = this.extractClaims(stripped);

    // 3. Đối chiếu bằng chứng từng claim
    const verifiedClaims = this.verifyClaims(claims, retrievedData);

    // 4. Sửa lỗi dữ kiện nếu có mâu thuẫn
    const correctionResult = this.correctAnswer(stripped, verifiedClaims, retrievedData);
    const finalReply = correctionResult.text;

    // 5. Hiệu chuẩn độ tin cậy thực tế
    const matchType = retrievedData.groundTruthMatch?.type || 'NONE';
    const cal = this.calibrateConfidence(verifiedClaims, matchType);

    return {
      reply: finalReply,
      verifiedClaims: verifiedClaims,
      claims: verifiedClaims.map(vc => vc.claimText).slice(0, 4),
      wasCorrected: correctionResult.wasCorrected,
      confidence: cal.confidence,
      confidenceScore: cal.score
    };
  }
}

module.exports = new RealAnswerValidator();
