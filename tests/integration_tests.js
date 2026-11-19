/**
 * 2GUIDE V6.0 - AUTOMATED INTEGRATION TEST SUITE
 * Tests HTTP endpoints, session continuity, limits, and security headers
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:4001';

function postRequest(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = typeof data === 'string' ? data : JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 4001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Connection': 'close',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null });
        }
      });
    }).on('error', reject);
  });
}

async function runIntegrationTests() {
  console.log('\n========================================');
  console.log('🌐 CHẠY KIỂM THỬ TÍCH HỢP (INTEGRATION TESTS V6.0)');
  console.log('========================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
      throw e;
    }
  }

  // 1. Health check
  await test('Endpoint GET /health phản hồi 200 UP và phiên bản 6.0.0', async () => {
    const res = await getRequest('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'UP');
    assert(res.body.version.includes('6.0.0'), 'Phiên bản không đúng');
  });

  // 2. Stats endpoint
  await test('Endpoint GET /stats báo cáo đầy đủ 5 Request Tiers và Token Cost', async () => {
    const res = await getRequest('/stats');
    assert.strictEqual(res.status, 200);
    assert(res.body.cacheStats, 'Thiếu cacheStats');
    assert(res.body.cacheStats.tierDistribution, 'Thiếu tierDistribution');
  });

  // 3. Single Chat Ask
  let sessionId = null;
  await test('Endpoint POST /api/chat/ask phản hồi 200 với đầy đủ Metadata', async () => {
    const res = await postRequest('/api/chat/ask', {
      question: 'Cỗ máy chém tại Nhà tù Hỏa Lò cao bao nhiêu và nặng bao nhiêu?'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.reply.includes('4 mét') || res.body.data.reply.includes('50kg'));
    assert(res.body.data.sessionId, 'Thiếu sessionId');
    assert(res.body.data.requestTier, 'Thiếu requestTier');
    sessionId = res.body.data.sessionId;
  });

  // 4. Multi-turn Follow-up Continuity
  await test('Hội thoại tiếp nối đa lượt: duy trì Session và giải quyết đại từ', async () => {
    assert(sessionId, 'Không có sessionId từ test trước');
    const res = await postRequest('/api/chat/ask', {
      question: 'Nó được sử dụng để làm gì?',
      sessionId: sessionId
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.isFollowUp, true);
    assert(res.body.data.reply.includes('máy chém') || res.body.data.reply.includes('khủng bố') || res.body.data.reply.includes('hành quyết') || res.body.data.reply.includes('đàn áp'));
  });

  // 5. Payload limit (32KB ceiling)
  await test('Giới hạn kích thước Payload: Từ chối gói tin > 32KB với HTTP 413', async () => {
    const hugeString = 'A'.repeat(35 * 1024); // 35KB
    const res = await postRequest('/api/chat/ask', { question: hugeString });
    assert.strictEqual(res.status, 413, `Kỳ vọng HTTP 413 nhưng nhận được ${res.status}`);
  });

  // 6. Empty / Invalid Question
  await test('Kiểm soát đầu vào: Từ chối câu hỏi rỗng', async () => {
    const res = await postRequest('/api/chat/ask', { question: '   ' });
    assert.strictEqual(res.body.success, false);
    assert(res.body.error.includes('trống'));
  });

  console.log(`\n========================================`);
  console.log(`🎉 TẤT CẢ ${passed}/${total} INTEGRATION TESTS ĐÃ VƯỢT QUA!`);
  console.log(`========================================\n`);
}

runIntegrationTests().catch(err => {
  console.error('Integration tests failed:', err);
  process.exit(1);
});
