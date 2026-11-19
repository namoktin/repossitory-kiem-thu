/**
 * 2Guide & AI Fact-Checking Engine - Bộ Kiểm Chứng Độ Chính Xác 1000 Câu Hỏi Hỏa Lò
 * Tự động gửi câu hỏi, đối chiếu câu trả lời của AI với dữ liệu lịch sử chuẩn (Ground Truth)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class AiVerifier extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.targetUrl = options.url || 'http://localhost:4000/api/chat/ask';
    this.questionsFile = options.questionsFile || path.join(__dirname, 'data', '1000_cau_hoi_hoa_lo.json');
    this.limit = parseInt(options.limit, 10) || 1000;
    this.concurrency = parseInt(options.concurrency, 10) || 10;
    this.delayMs = options.delay !== undefined ? parseInt(options.delay, 10) : 100;
    this.timeoutMs = parseInt(options.timeout, 10) || 30000;

    this.isRunning = false;
    this.isAborted = false;

    // Tải bộ dữ liệu 1000 câu hỏi
    this.questions = [];
    this.loadQuestions();

    // Kết quả kiểm thử
    this.results = [];
    this.stats = {
      total: 0,
      completed: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
      rateLimited: 0,
      error: 0,
      accuracyRate: '0.0%',
      categoryStats: {}
    };

    this.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
    this.httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
  }

  loadQuestions() {
    try {
      if (fs.existsSync(this.questionsFile)) {
        const raw = fs.readFileSync(this.questionsFile, 'utf8');
        this.questions = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Lỗi nạp file 1000 câu hỏi:', e.message);
    }
  }

  normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt để so sánh linh hoạt
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  evaluateAnswer(aiReply, qItem) {
    if (!aiReply || typeof aiReply !== 'string') {
      return {
        verdict: 'ERROR',
        score: 0,
        matched: [],
        missing: qItem.expected_keywords,
        hallucinations: [],
        reason: 'Không nhận được câu trả lời từ AI'
      };
    }

    const normReply = this.normalizeText(aiReply);
    const matched = [];
    const missing = [];
    const hallucinations = [];

    // 1. Kiểm tra từ khóa bắt buộc (Expected keywords)
    for (const kw of qItem.expected_keywords) {
      const normKw = this.normalizeText(kw);
      if (normReply.includes(normKw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    // 2. Kiểm tra từ khóa sai lệch / bịa đặt (Hallucinations)
    for (const bad of (qItem.incorrect_keywords || [])) {
      const normBad = this.normalizeText(bad);
      if (normReply.includes(normBad)) {
        hallucinations.push(bad);
      }
    }

    // 3. Tính điểm độ chính xác (0 - 100)
    const matchRatio = qItem.expected_keywords.length > 0 ? (matched.length / qItem.expected_keywords.length) : 0;
    let score = Math.round(matchRatio * 100);

    let verdict = 'CORRECT';
    let reason = 'Thông tin chuẩn xác, trùng khớp dữ liệu lịch sử';

    if (hallucinations.length > 0) {
      verdict = 'INCORRECT';
      score = Math.max(0, score - 50);
      reason = `Phát hiện thông tin sai lệch/bịa đặt: [${hallucinations.join(', ')}]`;
    } else if (matchRatio >= 0.5) {
      verdict = 'CORRECT';
      reason = `Đáp ứng đầy đủ ${matched.length}/${qItem.expected_keywords.length} sự kiện lịch sử cốt lõi`;
    } else if (matchRatio >= 0.2) {
      verdict = 'PARTIAL';
      reason = `Trả lời đúng một phần (${matched.length}/${qItem.expected_keywords.length} ý), còn thiếu chi tiết: [${missing.slice(0, 3).join(', ')}]`;
    } else {
      verdict = 'INCORRECT';
      reason = `Thiếu hụt dữ kiện quan trọng, chưa bao hàm: [${missing.slice(0, 4).join(', ')}]`;
    }

    return {
      verdict,
      score,
      matched,
      missing,
      hallucinations,
      reason
    };
  }

  async run() {
    this.isRunning = true;
    this.isAborted = false;
    this.results = [];

    const targetList = this.questions.slice(0, this.limit);
    const total = targetList.length;

    this.stats = {
      total,
      completed: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
      rateLimited: 0,
      error: 0,
      accuracyRate: '0.0%',
      categoryStats: {}
    };

    // Khởi tạo stats cho từng category
    for (const q of targetList) {
      if (!this.stats.categoryStats[q.category]) {
        this.stats.categoryStats[q.category] = { total: 0, correct: 0, partial: 0, incorrect: 0, error: 0 };
      }
      this.stats.categoryStats[q.category].total++;
    }

    this.emit('start', { total, targetUrl: this.targetUrl, concurrency: this.concurrency });

    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < total && !this.isAborted) {
        const idx = currentIndex++;
        const qItem = targetList[idx];

        const resItem = await this.verifySingleQuestion(idx, qItem);
        this.recordResult(resItem);

        if (this.delayMs > 0) {
          await new Promise(r => setTimeout(r, this.delayMs));
        }
      }
    };

    const workers = [];
    const actualConcurrency = Math.min(this.concurrency, total);
    for (let i = 0; i < actualConcurrency; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    this.isRunning = false;
    this.stats.accuracyRate = this.stats.completed > 0 
      ? (((this.stats.correct + this.stats.partial * 0.5) / this.stats.completed) * 100).toFixed(1) + '%' 
      : '0.0%';

    this.saveReports();
    this.emit('complete', { stats: this.stats, results: this.results });
    return { stats: this.stats, results: this.results };
  }

  verifySingleQuestion(index, qItem) {
    return new Promise((resolve) => {
      const payload = {
        question: qItem.question,
        lat: 21.0253, // Tọa độ Di tích Hỏa Lò
        lng: 105.8465,
        yaw: 0,
        hubId: 'VERIFIER-HL01'
      };

      const postData = JSON.stringify(payload);
      const parsedUrl = new URL(this.targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        agent: isHttps ? this.httpsAgent : this.httpAgent,
        timeout: this.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': '2Guide-HoaLo-Verifier/1.0'
        }
      };

      const startReq = Date.now();
      const client = isHttps ? https : http;

      const req = client.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          const latency = Date.now() - startReq;
          const status = res.statusCode;

          let aiReply = '';
          let poiContext = '';
          try {
            const parsed = JSON.parse(body);
            aiReply = parsed?.data?.reply || parsed?.reply || parsed?.message || body;
            poiContext = parsed?.data?.nearestPoi || '';
          } catch {
            aiReply = body;
          }

          if (status === 429) {
            resolve({
              id: qItem.id,
              index: index + 1,
              category: qItem.category,
              target_poi: qItem.target_poi,
              question: qItem.question,
              aiReply: '[Bị chặn bởi Rate Limit 429 của Groq AI]',
              evaluation: { verdict: 'RATE_LIMIT', score: 0, reason: 'Quá tải hạn ngạch gọi API' },
              statusCode: 429,
              latency
            });
            return;
          }

          if (status >= 400) {
            resolve({
              id: qItem.id,
              index: index + 1,
              category: qItem.category,
              target_poi: qItem.target_poi,
              question: qItem.question,
              aiReply: `Lỗi Server HTTP ${status}: ${aiReply.slice(0, 150)}`,
              evaluation: { verdict: 'ERROR', score: 0, reason: `Server trả về mã lỗi HTTP ${status}` },
              statusCode: status,
              latency
            });
            return;
          }

          const evaluation = this.evaluateAnswer(aiReply, qItem);
          resolve({
            id: qItem.id,
            index: index + 1,
            category: qItem.category,
            target_poi: qItem.target_poi,
            question: qItem.question,
            aiReply,
            poiContext,
            groundTruth: qItem.ground_truth_summary,
            evaluation,
            statusCode: status,
            latency
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          id: qItem.id,
          index: index + 1,
          category: qItem.category,
          target_poi: qItem.target_poi,
          question: qItem.question,
          aiReply: '[Hết thời gian chờ - Timeout]',
          evaluation: { verdict: 'ERROR', score: 0, reason: 'Request Timeout' },
          statusCode: 408,
          latency: Date.now() - startReq
        });
      });

      req.on('error', (err) => {
        resolve({
          id: qItem.id,
          index: index + 1,
          category: qItem.category,
          target_poi: qItem.target_poi,
          question: qItem.question,
          aiReply: `[Lỗi kết nối mạng: ${err.message}]`,
          evaluation: { verdict: 'ERROR', score: 0, reason: err.message },
          statusCode: 0,
          latency: Date.now() - startReq
        });
      });

      req.write(postData);
      req.end();
    });
  }

  recordResult(item) {
    this.results.push(item);
    this.stats.completed++;

    const v = item.evaluation.verdict;
    const cat = item.category;

    if (v === 'CORRECT') {
      this.stats.correct++;
      if (this.stats.categoryStats[cat]) this.stats.categoryStats[cat].correct++;
    } else if (v === 'PARTIAL') {
      this.stats.partial++;
      if (this.stats.categoryStats[cat]) this.stats.categoryStats[cat].partial++;
    } else if (v === 'INCORRECT') {
      this.stats.incorrect++;
      if (this.stats.categoryStats[cat]) this.stats.categoryStats[cat].incorrect++;
    } else if (v === 'RATE_LIMIT') {
      this.stats.rateLimited++;
      if (this.stats.categoryStats[cat]) this.stats.categoryStats[cat].error++;
    } else {
      this.stats.error++;
      if (this.stats.categoryStats[cat]) this.stats.categoryStats[cat].error++;
    }

    const currentAcc = (((this.stats.correct + this.stats.partial * 0.5) / this.stats.completed) * 100).toFixed(1);

    this.emit('progress', {
      completed: this.stats.completed,
      total: this.stats.total,
      correct: this.stats.correct,
      partial: this.stats.partial,
      incorrect: this.stats.incorrect,
      rateLimited: this.stats.rateLimited,
      error: this.stats.error,
      accuracyRate: currentAcc + '%',
      lastResult: item
    });
  }

  stop() {
    this.isAborted = true;
    this.isRunning = false;
  }

  saveReports() {
    const mdPath = this.options?.reportFile 
      ? (path.isAbsolute(this.options.reportFile) ? this.options.reportFile : path.join(__dirname, this.options.reportFile))
      : path.join(__dirname, 'BAO_CAO_KIEM_CHUNG_AI_HOA_LO.md');
    const jsonPath = mdPath.endsWith('.md') ? mdPath.slice(0, -3) + '.json' : mdPath + '.json';

    fs.writeFileSync(jsonPath, JSON.stringify({ stats: this.stats, results: this.results }, null, 2), 'utf8');

    let md = `# 🏛️ BÁO CÁO KIỂM CHỨNG ĐỘ CHÍNH XÁC AI - DI TÍCH NHÀ TÙ HỎA LÒ (1000 CÂU HỎI)

* **Hệ thống AI được kiểm thử:** ${this.targetUrl}
* **Thời gian thực hiện:** ${new Date().toLocaleString('vi-VN')}
* **Tổng số câu hỏi kiểm chứng:** **${this.stats.total} câu hỏi**
* **Số câu hỏi đã hoàn tất:** **${this.stats.completed} câu hỏi**
* **TỶ LỆ CHÍNH XÁC TỔNG THỂ (ACCURACY RATE):** **${this.stats.accuracyRate}**

---

## 📊 1. KẾT QUẢ ĐỐI CHIẾU SỰ THẬT (FACT-CHECKING SUMMARY)

| Phân loại đánh giá | Số lượng | Tỷ lệ % | Đánh giá chuyên môn |
| :--- | :--- | :--- | :--- |
| **✅ Đúng chuẩn lịch sử (CORRECT)** | **${this.stats.correct}** | **${((this.stats.correct / this.stats.completed) * 100).toFixed(1)}%** | AI cung cấp đầy đủ các dữ kiện lịch sử cốt lõi |
| **⚠️ Đúng một phần (PARTIAL)** | **${this.stats.partial}** | **${((this.stats.partial / this.stats.completed) * 100).toFixed(1)}%** | AI trả lời đúng hướng nhưng thiếu chi tiết/thông số |
| **❌ Sai lệch / Bịa đặt (INCORRECT)** | **${this.stats.incorrect}** | **${((this.stats.incorrect / this.stats.completed) * 100).toFixed(1)}%** | Chứa thông tin sai hoặc bịa đặt (Hallucination) |
| **⚡ Quá tải Rate Limit (HTTP 429)** | **${this.stats.rateLimited}** | **${((this.stats.rateLimited / this.stats.completed) * 100).toFixed(1)}%** | Bị giới hạn hạn ngạch API từ nhà cung cấp LLM |
| **🚨 Lỗi kết nối / Server (5xx)** | **${this.stats.error}** | **${((this.stats.error / this.stats.completed) * 100).toFixed(1)}%** | Lỗi đường truyền hoặc server sập |

---

## 🏛️ 2. BẢNG PHÂN TÍCH ĐỘ CHÍNH XÁC THEO TỪNG HIỆN VẬT & KHU VỰC

| Hiện vật / Chủ đề tham quan | Tổng câu hỏi | Trả lời Đúng | Thiếu chi tiết | Sai / Lỗi | Tỷ lệ chính xác |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;

    for (const [catName, catStat] of Object.entries(this.stats.categoryStats)) {
      const acc = catStat.total > 0 ? (((catStat.correct + catStat.partial * 0.5) / catStat.total) * 100).toFixed(1) : '0.0';
      md += `| **${catName}** | ${catStat.total} | ${catStat.correct} | ${catStat.partial} | ${catStat.incorrect + catStat.error} | **${acc}%** |\n`;
    }

    md += `
---

## 🔍 3. MỘT SỐ VÍ DỤ ĐỐI CHIẾU THỰC TẾ (SAMPLE AUDIT)

`;

    // Lấy 5 mẫu đúng và 5 mẫu sai/thiếu
    const correctSamples = this.results.filter(r => r.evaluation.verdict === 'CORRECT').slice(0, 3);
    const failSamples = this.results.filter(r => r.evaluation.verdict === 'INCORRECT' || r.evaluation.verdict === 'PARTIAL').slice(0, 3);

    md += `### ✅ Mẫu câu trả lời Chuẩn Xác:\n`;
    for (const s of correctSamples) {
      md += `> **Du khách hỏi:** *"${s.question}"*\n`;
      md += `> **AI trả lời:** "${s.aiReply.slice(0, 300)}..."\n`;
      md += `> **Dữ kiện đối chiếu:** Khớp các mốc: \`${s.evaluation.matched.join(', ')}\`\n\n`;
    }

    if (failSamples.length > 0) {
      md += `### ⚠️ Mẫu câu trả lời Cần Cải Thiện:\n`;
      for (const s of failSamples) {
        md += `> **Du khách hỏi:** *"${s.question}"*\n`;
        md += `> **AI trả lời:** "${s.aiReply.slice(0, 300)}..."\n`;
        md += `> **Lý do đánh giá:** ${s.evaluation.reason}\n\n`;
      }
    }

    md += `
---

## 💡 4. ĐỀ XUẤT NÂNG CẤP HỆ THỐNG PROMPT & RAG CHO ĐỀ TÀI

1. **Bổ sung Vector Database (RAG):** Đưa toàn bộ tài liệu hồ sơ di tích Hỏa Lò vào cơ sở dữ liệu Vector để AI trích xuất chính xác 100% các con số (50kg, 1896, 24/12/1951, v.v.).
2. **System Prompt Guardrails:** Thiết lập quy tắc nghiêm ngặt: *"Nếu không chắc chắn về mốc thời gian hoặc tên nhân vật lịch sử, AI phải trả lời trung thực rằng chưa có tư liệu xác thực thay vì suy đoán bịa đặt"*.
3. **Bộ đệm FAQ Caching:** Lưu sẵn câu trả lời đã được chuyên gia lịch sử phê duyệt cho 200 câu hỏi phổ biến nhất để phản hồi ngay lập tức trong 10ms.
`;

    fs.writeFileSync(mdPath, md, 'utf8');
  }
}

module.exports = AiVerifier;

// Chạy trực tiếp từ dòng lệnh (CLI mode)
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) options.url = args[++i];
    else if (args[i] === '--limit' && args[i + 1]) options.limit = parseInt(args[++i], 10);
    else if (args[i] === '--concurrency' && args[i + 1]) options.concurrency = parseInt(args[++i], 10);
    else if ((args[i] === '--file' || args[i] === '--questionsFile') && args[i + 1]) options.questionsFile = args[++i];
    else if (args[i] === '--report' && args[i + 1]) options.reportFile = args[++i];
    else if (args[i] === '--delay' && args[i + 1]) options.delay = parseInt(args[++i], 10);
  }

  console.log('\n======================================================');
  console.log('🏛️ BỘ KIỂM CHỨNG ĐỘ CHÍNH XÁC AI - 1000 CÂU HỎI HỎA LÒ');
  console.log('======================================================');
  console.log('🎯 Mục tiêu:        ' + (options.url || 'http://localhost:4000/api/chat/ask'));
  console.log('📚 Số câu hỏi:      ' + (options.limit || 1000));
  console.log('⚡ Luồng song song:  ' + (options.concurrency || 10));
  console.log('------------------------------------------------------\n');

  const verifier = new AiVerifier(options);
  let lastPrint = 0;

  verifier.on('progress', (data) => {
    const now = Date.now();
    if (now - lastPrint > 250 || data.completed === data.total) {
      lastPrint = now;
      const barWidth = 20;
      const filled = Math.round((data.completed / data.total) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
      process.stdout.write(`\r[${bar}] ${data.completed}/${data.total} | Độ chính xác: ${data.accuracyRate} | Đúng: ${data.correct} | Thiếu: ${data.partial} | Sai: ${data.incorrect} | 429: ${data.rateLimited}`);
    }
  });

  verifier.run().then(({ stats }) => {
    console.log('\n\n======================================================');
    console.log('🎉 KIỂM CHỨNG LỊCH SỬ HOÀN TẤT!');
    console.log('======================================================');
    console.log('🎯 Tỷ lệ chính xác tổng thể: ' + stats.accuracyRate);
    console.log('✅ Đúng chuẩn lịch sử:       ' + stats.correct + '/' + stats.completed);
    console.log('⚠️ Trả lời đúng một phần:   ' + stats.partial);
    console.log('❌ Sai lệch / Bịa đặt:       ' + stats.incorrect);
    console.log('⚡ Quá tải Rate Limit (429): ' + stats.rateLimited);
    console.log('------------------------------------------------------');
    console.log('📄 Đã xuất báo cáo kiểm chứng: BAO_CAO_KIEM_CHUNG_AI_HOA_LO.md');
    console.log('📄 Đã xuất dữ liệu chi tiết:   ket_qua_kiem_chung_ai.json');
    console.log('======================================================\n');
  }).catch(err => {
    console.error('\n❌ Lỗi:', err);
  });
}
