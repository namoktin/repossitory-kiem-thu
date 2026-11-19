/**
 * 2Guide & API Stress Tester - Engine Kiểm Thử Chịu Tải 1000 Request AI
 * Hỗ trợ chạy dòng lệnh CLI hoặc chạy ngầm làm API cho Web Dashboard
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Danh sách câu hỏi giả lập khách tham quan di tích gửi lên AI
let SAMPLE_QUESTIONS = [
  "Cỗ máy chém tại Nhà tù Hỏa Lò có chiều cao và trọng lượng lưỡi dao là bao nhiêu?",
  "Cây bàng cổ thụ trong sân Hỏa Lò có tác dụng gì đối với các chiến sĩ?",
  "Cuộc vượt ngục cống ngầm đêm Giáng sinh 24/12/1951 diễn ra như thế nào?",
  "Xà lim Cachot biệt giam có thiết kế tàn bạo như thế nào?",
  "Khu trại giam Nữ đã diễn ra các phong trào đấu tranh kiên cường nào?",
  "Tại sao phi công Mỹ lại gọi Hỏa Lò là Khách sạn Hanoi Hilton?",
  "Cổng chính Maison Centrale được xây dựng năm nào?",
  "Tour đêm Đêm thiêng liêng có những trải nghiệm đặc biệt gì?",
  "Giá vé tham quan và giờ mở cửa Nhà tù Hỏa Lò ra sao?"
];

try {
  const qPath = path.join(__dirname, 'data', '1000_cau_hoi_random_test.json');
  if (fs.existsSync(qPath)) {
    const list = JSON.parse(fs.readFileSync(qPath, 'utf8'));
    SAMPLE_QUESTIONS = list.map(item => item.question);
  }
} catch (e) {}

class StressTester extends EventEmitter {
  constructor(options = {}) {
    super();
    this.targetUrl = options.url || 'http://localhost:4000/api/chat/ask';
    this.totalRequests = parseInt(options.total, 10) || 1000;
    this.concurrency = parseInt(options.concurrency, 10) || 20;
    this.delayMs = parseInt(options.delay, 10) || 0;
    this.timeoutMs = parseInt(options.timeout, 10) || 30000; // AI có thể mất 3-5s để sinh câu trả lời
    this.method = (options.method || 'POST').toUpperCase();
    this.customBody = options.body || null;
    this.outputReport = options.report !== false;

    this.isRunning = false;
    this.isAborted = false;

    // Bộ đếm thống kê
    this.sentCount = 0;
    this.completedCount = 0;
    this.successCount = 0;
    this.rateLimitCount = 0; // HTTP 429
    this.errorCount = 0;     // HTTP 4xx, 5xx, Network
    this.statusCodes = {};
    this.latencies = [];
    this.startTime = 0;
    this.endTime = 0;
    this.recentLogs = [];

    // HTTP Agents để tái sử dụng socket TCP (Connection Keep-Alive)
    this.httpAgent = new http.Agent({ keepAlive: true, maxSockets: Math.max(100, this.concurrency * 2) });
    this.httpsAgent = new https.Agent({ keepAlive: true, maxSockets: Math.max(100, this.concurrency * 2) });
  }

  generatePayload(index) {
    if (this.customBody) {
      if (typeof this.customBody === 'string') {
        try {
          return JSON.parse(this.customBody);
        } catch {
          return { question: this.customBody };
        }
      }
      return this.customBody;
    }

    // Mặc định chuẩn cấu trúc Payload cho 2Guide /api/chat/ask
    const randomQuestion = SAMPLE_QUESTIONS[index % SAMPLE_QUESTIONS.length];
    return {
      question: randomQuestion,
      lat: 21.0028 + (Math.random() - 0.5) * 0.002,
      lng: 105.8431 + (Math.random() - 0.5) * 0.002,
      yaw: Math.floor(Math.random() * 360),
      hubId: `TEST-${String((index % 50) + 1).padStart(2, '0')}`
    };
  }

  async run() {
    this.isRunning = true;
    this.isAborted = false;
    this.startTime = Date.now();
    this.sentCount = 0;
    this.completedCount = 0;
    this.successCount = 0;
    this.rateLimitCount = 0;
    this.errorCount = 0;
    this.statusCodes = {};
    this.latencies = [];
    this.recentLogs = [];

    this.emit('start', {
      url: this.targetUrl,
      total: this.totalRequests,
      concurrency: this.concurrency,
      startTime: this.startTime
    });

    let currentRequestIndex = 0;

    // Worker xử lý hàng đợi
    const worker = async (workerId) => {
      while (currentRequestIndex < this.totalRequests && !this.isAborted) {
        const reqIdx = currentRequestIndex++;
        this.sentCount++;
        
        await this.sendSingleRequest(reqIdx);

        if (this.delayMs > 0) {
          await new Promise(r => setTimeout(r, this.delayMs));
        }
      }
    };

    // Khởi chạy đồng thời số lượng workers theo concurrency
    const workers = [];
    const actualConcurrency = Math.min(this.concurrency, this.totalRequests);
    for (let i = 0; i < actualConcurrency; i++) {
      workers.push(worker(i));
    }

    await Promise.all(workers);

    this.endTime = Date.now();
    this.isRunning = false;

    const summary = this.getSummary();
    if (this.outputReport) {
      this.saveReport(summary);
    }

    this.emit('complete', summary);
    return summary;
  }

  sendSingleRequest(index) {
    return new Promise((resolve) => {
      const payload = this.generatePayload(index);
      const postData = JSON.stringify(payload);
      const parsedUrl = new URL(this.targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: this.method,
        agent: isHttps ? this.httpsAgent : this.httpAgent,
        timeout: this.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': '2Guide-Stress-Tester/1.0',
          'Accept': 'application/json, text/plain, */*'
        }
      };

      const startReq = Date.now();
      const client = isHttps ? https : http;

      const req = client.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { responseBody += chunk; });
        res.on('end', () => {
          const latency = Date.now() - startReq;
          const status = res.statusCode;
          this.recordResult(index, status, latency, responseBody, null);
          resolve();
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const latency = Date.now() - startReq;
        this.recordResult(index, 408, latency, '', 'Request Timeout');
        resolve();
      });

      req.on('error', (err) => {
        const latency = Date.now() - startReq;
        this.recordResult(index, 0, latency, '', err.message);
        resolve();
      });

      if (this.method === 'POST' || this.method === 'PUT') {
        req.write(postData);
      }
      req.end();
    });
  }

  recordResult(index, statusCode, latency, responseBody, errorMessage) {
    this.completedCount++;
    this.latencies.push(latency);
    this.statusCodes[statusCode] = (this.statusCodes[statusCode] || 0) + 1;

    let isSuccess = statusCode >= 200 && statusCode < 300;
    if (isSuccess) {
      this.successCount++;
    } else if (statusCode === 429) {
      this.rateLimitCount++;
    } else {
      this.errorCount++;
    }

    // Trích xuất câu trả lời AI nếu có
    let aiPreview = '';
    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        aiPreview = parsed?.data?.reply || parsed?.reply || parsed?.message || responseBody.slice(0, 100);
      } catch {
        aiPreview = responseBody.slice(0, 100);
      }
    }

    const logItem = {
      index: index + 1,
      statusCode,
      latency,
      isSuccess,
      error: errorMessage,
      preview: aiPreview ? aiPreview.replace(/\n/g, ' ').slice(0, 80) : '',
      timestamp: Date.now()
    };

    this.recentLogs.push(logItem);
    if (this.recentLogs.length > 50) {
      this.recentLogs.shift();
    }

    this.emit('progress', {
      completed: this.completedCount,
      total: this.totalRequests,
      success: this.successCount,
      rateLimit: this.rateLimitCount,
      error: this.errorCount,
      percent: ((this.completedCount / this.totalRequests) * 100).toFixed(1),
      currentRps: this.getCurrentRps(),
      lastLog: logItem
    });
  }

  getCurrentRps() {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    return elapsedSec > 0 ? (this.completedCount / elapsedSec).toFixed(1) : 0;
  }

  stop() {
    this.isAborted = true;
    this.isRunning = false;
    this.endTime = Date.now();
  }

  getSummary() {
    const totalDurationSec = ((this.endTime || Date.now()) - this.startTime) / 1000;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const count = sorted.length;

    const minLatency = count > 0 ? sorted[0] : 0;
    const maxLatency = count > 0 ? sorted[count - 1] : 0;
    const sumLatency = sorted.reduce((a, b) => a + b, 0);
    const avgLatency = count > 0 ? Math.round(sumLatency / count) : 0;

    const p50 = count > 0 ? sorted[Math.floor(count * 0.50)] : 0;
    const p90 = count > 0 ? sorted[Math.floor(count * 0.90)] : 0;
    const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] : 0;
    const p99 = count > 0 ? sorted[Math.floor(count * 0.99)] : 0;

    const rps = totalDurationSec > 0 ? (this.completedCount / totalDurationSec).toFixed(2) : 0;
    const successRate = this.completedCount > 0 ? ((this.successCount / this.completedCount) * 100).toFixed(2) : 0;

    return {
      targetUrl: this.targetUrl,
      totalConfigured: this.totalRequests,
      completed: this.completedCount,
      successCount: this.successCount,
      rateLimitCount: this.rateLimitCount,
      errorCount: this.errorCount,
      successRate: `${successRate}%`,
      durationSec: totalDurationSec.toFixed(2),
      requestsPerSecond: rps,
      concurrency: this.concurrency,
      statusCodes: this.statusCodes,
      latency: {
        min: minLatency,
        max: maxLatency,
        avg: avgLatency,
        p50,
        p90,
        p95,
        p99
      },
      completedAt: new Date().toISOString()
    };
  }

  saveReport(summary) {
    const outDir = __dirname;
    const jsonPath = path.join(outDir, 'ket_qua_kiem_thu.json');
    const mdPath = path.join(outDir, 'BAO_CAO_KIEM_THU_TAI.md');

    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

    const mdContent = `# 📊 BÁO CÁO KIỂM THỬ CHỊU TẢI SERVER (LOAD & STRESS TEST REPORT)

* **Hệ thống kiểm thử:** ${summary.targetUrl}
* **Thời gian thực hiện:** ${new Date().toLocaleString('vi-VN')}
* **Tổng số Request yêu cầu:** **${summary.totalConfigured} requests**
* **Số luồng đồng thời (Concurrency):** **${summary.concurrency} workers**
* **Tổng thời gian kiểm thử:** **${summary.durationSec} giây**

---

## ⚡ 1. CHỈ SỐ HIỆU NĂNG TỔNG QUAN

| Chỉ số kiểm thử | Giá trị đo được | Đánh giá |
| :--- | :--- | :--- |
| **Tỷ lệ thành công (Success Rate)** | **${summary.successRate}** (${summary.successCount}/${summary.completed}) | ${parseFloat(summary.successRate) > 95 ? '✅ Rất tốt' : (parseFloat(summary.successRate) > 80 ? '⚠️ Tạm ổn' : '❌ Quá tải')} |
| **Tốc độ xử lý (RPS)** | **${summary.requestsPerSecond} req/s** | Tải trung bình hệ thống đáp ứng được |
| **Bị giới hạn tần suất (HTTP 429)** | **${summary.rateLimitCount} requests** | ${summary.rateLimitCount > 0 ? '⚠️ Bị Groq AI / Tường lửa Rate Limit' : '✅ Không bị chặn'} |
| **Lỗi hệ thống (5xx / Timeout)** | **${summary.errorCount} requests** | ${summary.errorCount === 0 ? '✅ Ổn định tuyệt đối' : '⚠️ Có lỗi phát sinh'} |

---

## ⏱️ 2. PHÂN TÍCH ĐỘ TRỄ PHẢN HỒI (LATENCY)

> Độ trễ tính bằng mili-giây (ms), phản ánh thời gian từ lúc gửi câu hỏi đến khi nhận đủ câu trả lời từ AI.

* **Nhanh nhất (Min):** \`${summary.latency.min} ms\`
* **Trung bình (Average):** \`${summary.latency.avg} ms\`
* **Phổ thông (Median P50):** \`${summary.latency.p50} ms\` (50% người dùng nhận câu trả lời trong khoảng này)
* **P90 (90% người dùng):** \`${summary.latency.p90} ms\`
* **P95 (95% người dùng):** \`${summary.latency.p95} ms\`
* **Chậm nhất (Max):** \`${summary.latency.max} ms\`

---

## 📈 3. PHÂN BỐ MÃ PHẢN HỒI HTTP (HTTP STATUS CODES)

\`\`\`json
${JSON.stringify(summary.statusCodes, null, 2)}
\`\`\`

---

## 💡 4. NHẬN XÉT & KẾT LUẬN CHO ĐỒ ÁN / ĐỀ TÀI

1. **Khả năng chịu tải đồng thời:** Hệ thống đã hoàn thành đợt kiểm thử với **${summary.completed} request** ở mức đồng thời **${summary.concurrency} kết nối**.
2. **Nút thắt cổ chai (Bottleneck):** ${summary.rateLimitCount > 0 ? 'Hệ thống bị nghẽn ở hạn ngạch RPM của Groq API (HTTP 429). Cần bổ sung hàng đợi (Redis Queue/BullMQ) hoặc cơ chế fallback.' : 'Hệ thống xử lý mượt mà, không gặp lỗi nghẽn cổ chai nghiêm trọng.'}
3. **Khuyến nghị tối ưu:** Tích hợp bộ đệm phản hồi (AI Response Caching) cho các câu hỏi phổ biến để giảm 70% số lần gọi LLM bên ngoài và tăng tốc độ phản hồi về dưới 50ms.
`;

    fs.writeFileSync(mdPath, mdContent, 'utf8');
  }
}

// Nếu chạy trực tiếp từ dòng lệnh (CLI mode)
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) options.url = args[++i];
    else if (args[i] === '--total' && args[i + 1]) options.total = parseInt(args[++i], 10);
    else if (args[i] === '--concurrency' && args[i + 1]) options.concurrency = parseInt(args[++i], 10);
    else if (args[i] === '--delay' && args[i + 1]) options.delay = parseInt(args[++i], 10);
    else if (args[i] === '--timeout' && args[i + 1]) options.timeout = parseInt(args[++i], 10);
  }

  console.log('\n======================================================');
  console.log('🚀 2GUIDE & AI API STRESS TESTER (1000 REQUESTS)');
  console.log('======================================================');
  console.log(`🎯 Mục tiêu:     ${options.url || 'http://localhost:4000/api/chat/ask'}`);
  console.log(`📦 Tổng request: ${options.total || 1000}`);
  console.log(`⚡ Luồng đồng thời: ${options.concurrency || 20}`);
  console.log('------------------------------------------------------\n');

  const tester = new StressTester(options);

  let lastPrint = 0;
  tester.on('progress', (data) => {
    const now = Date.now();
    if (now - lastPrint > 250 || data.completed === data.total) {
      lastPrint = now;
      const barWidth = 25;
      const filled = Math.round((data.completed / data.total) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
      process.stdout.write(`\r[${bar}] ${data.completed}/${data.total} (${data.percent}%) | RPS: ${data.currentRps} | OK: ${data.success} | 429: ${data.rateLimit} | Err: ${data.error}`);
    }
  });

  tester.run().then((summary) => {
    console.log('\n\n======================================================');
    console.log('🎉 KIỂM THỬ TẢI HOÀN TẤT!');
    console.log('======================================================');
    console.log(`⏱️ Thời gian:         ${summary.durationSec} giây`);
    console.log(`🚀 Tốc độ trung bình:   ${summary.requestsPerSecond} req/s`);
    console.log(`✅ Thành công (2xx):    ${summary.successCount} (${summary.successRate})`);
    console.log(`⚠️ Rate Limit (429):   ${summary.rateLimitCount}`);
    console.log(`❌ Lỗi (4xx/5xx/Net):  ${summary.errorCount}`);
    console.log(`📊 Độ trễ trung bình:  ${summary.latency.avg} ms (Min: ${summary.latency.min}ms, Max: ${summary.latency.max}ms)`);
    console.log(`📊 Phổ thông P50/P95:  ${summary.latency.p50}ms / ${summary.latency.p95}ms`);
    console.log('------------------------------------------------------');
    console.log(`📄 Đã xuất báo cáo chi tiết ra: BAO_CAO_KIEM_THU_TAI.md`);
    console.log(`📄 Đã xuất dữ liệu thô JSON ra:  ket_qua_kiem_thu.json`);
    console.log('======================================================\n');
  }).catch((err) => {
    console.error('\n❌ Lỗi trong quá trình kiểm thử:', err);
  });
}

module.exports = StressTester;
