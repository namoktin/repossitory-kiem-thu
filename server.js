/**
 * Web Dashboard Server cho Trạm Kiểm Thử Tải & Kiểm Chứng Độ Chính Xác AI
 * Cung cấp giao diện trực quan 60fps qua Server-Sent Events (SSE)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const StressTester = require('./stress_test');
const AiVerifier = require('./ai_verifier');

const PORT = 5050;
let currentTester = null;
let currentVerifier = null;
let sseClients = [];

function broadcastSse(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE Stream: /api/stream-stats
  if (pathname === '/api/stream-stats') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 1000\n\n');
    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  // 2. STRESS TEST: Bắt đầu kiểm thử tải
  if (pathname === '/api/start-test' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        if ((currentTester && currentTester.isRunning) || (currentVerifier && currentVerifier.isRunning)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Đang có một đợt kiểm thử đang chạy dở!' }));
          return;
        }

        const options = bodyStr ? JSON.parse(bodyStr) : {};
        currentTester = new StressTester(options);

        currentTester.on('start', (data) => broadcastSse('start', data));
        currentTester.on('progress', (data) => broadcastSse('progress', data));
        currentTester.on('complete', (summary) => broadcastSse('complete', summary));

        currentTester.run().catch(err => {
          broadcastSse('error', { message: err.message });
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Đã bắt đầu kiểm thử tải!',
          target: currentTester.targetUrl,
          total: currentTester.totalRequests,
          concurrency: currentTester.concurrency
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. STRESS TEST: Dừng kiểm thử tải
  if (pathname === '/api/stop-test' && req.method === 'POST') {
    if (currentTester && currentTester.isRunning) {
      currentTester.stop();
      broadcastSse('stopped', { message: 'Đã dừng kiểm thử bởi người dùng' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Đã dừng kiểm thử thành công!' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Không có bài kiểm thử tải nào đang chạy.' }));
    }
    return;
  }

  // 4. VERIFIER: Bắt đầu kiểm chứng 1000 câu hỏi Hỏa Lò
  if (pathname === '/api/verify/start' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        if ((currentTester && currentTester.isRunning) || (currentVerifier && currentVerifier.isRunning)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Đang có một đợt kiểm thử đang chạy dở!' }));
          return;
        }

        const options = bodyStr ? JSON.parse(bodyStr) : {};
        currentVerifier = new AiVerifier(options);

        currentVerifier.on('start', (data) => broadcastSse('verify-start', data));
        currentVerifier.on('progress', (data) => broadcastSse('verify-progress', data));
        currentVerifier.on('complete', (summary) => broadcastSse('verify-complete', summary));

        currentVerifier.run().catch(err => {
          broadcastSse('verify-error', { message: err.message });
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Đã bắt đầu kiểm chứng độ chính xác 1000 câu hỏi!',
          total: currentVerifier.limit,
          concurrency: currentVerifier.concurrency
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. VERIFIER: Dừng kiểm chứng
  if (pathname === '/api/verify/stop' && req.method === 'POST') {
    if (currentVerifier && currentVerifier.isRunning) {
      currentVerifier.stop();
      broadcastSse('verify-stopped', { message: 'Đã dừng kiểm chứng bởi người dùng' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Đã dừng kiểm chứng thành công!' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Không có bài kiểm chứng nào đang chạy.' }));
    }
    return;
  }

  // 6. VERIFIER: Lấy danh sách 1000 câu hỏi
  if (pathname === '/api/verify/questions') {
    const qPath = path.join(__dirname, 'data', '1000_cau_hoi_hoa_lo.json');
    if (fs.existsSync(qPath)) {
      const questions = JSON.parse(fs.readFileSync(qPath, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(questions));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Chưa tìm thấy tệp 1000 câu hỏi.' }));
    }
    return;
  }

  // 7. Lấy báo cáo mới nhất (Tải hoặc Kiểm chứng)
  if (pathname === '/api/latest-report') {
    const type = parsedUrl.searchParams.get('type') || 'stress';
    const filename = type === 'verify' ? 'BAO_CAO_KIEM_CHUNG_AI_HOA_LO.md' : 'BAO_CAO_KIEM_THU_TAI.md';
    const filePath = path.join(__dirname, filename);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ markdown: content }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Chưa có báo cáo nào được tạo.' }));
    }
    return;
  }

  // 8. Phục vụ giao diện Web tĩnh (public/index.html, css, js)
  let staticPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, 'public', staticPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 TRẠM KIỂM THỬ CHỊU TẢI & KIỂM CHỨNG AI SẴN SÀNG!`);
  console.log(`======================================================`);
  console.log(`🌐 Giao diện Dashboard: http://localhost:${PORT}`);
  console.log(`🎯 API kiểm thử mặc định: http://localhost:4000/api/chat/ask`);
  console.log(`📚 Đã nạp 1,000 câu hỏi lịch sử Nhà tù Hỏa Lò chuẩn xác!`);
  console.log(`======================================================\n`);
});
