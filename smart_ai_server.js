/**
 * 2Guide AI Customer Experience & Heritage Precision Engine v4.0 (Enterprise Edition)
 * 
 * KIẾN TRÚC MỚI 8 TẦNG XỬ LÝ (9-10/10 STANDARD):
 * 1. INPUT PROCESSING: Chuẩn hóa, sửa lỗi chính tả, nhận diện ngôn ngữ, giải quyết đại từ ngữ cảnh.
 * 2. INTENT UNDERSTANDING: Phân loại 14+ ý định (Lịch sử, Hiện vật, Khiếu nại, Trợ năng, Vé, Giờ...).
 * 3. CONTEXT RETRIEVAL: Truy xuất đa nguồn từ Ground Truth, Hồ sơ phân khu, và Cẩm nang dịch vụ.
 * 4. CONFIDENCE EVALUATION: Đánh giá độ tin cậy 3 bậc (HIGH / MEDIUM / LOW).
 * 5. ANSWER GENERATION: Trả lời trực tiếp ngay câu 1, văn phong chuyên nghiệp, không văn mẫu.
 * 6. ANSWER VALIDATION: Kiểm định sự thật lịch sử, lọc bỏ mẫu chào kết máy móc, chống bịa đặt.
 * 7. CUSTOMER EXPERIENCE OPTIMIZATION: Thấu cảm, chỉ dẫn hành động cụ thể, cá nhân hóa phiên.
 * 8. FINAL RESPONSE: JSON tương thích 100% với frontend và các bài kiểm thử hiện có.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Nạp biến môi trường từ file .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  });
}

const PORT = process.env.PORT || 4001;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const PRIMARY_MODEL = 'qwen/qwen3.8-27b';

// Nạp các Engine độc lập
const nlp = require('./engine/nlp_processor');
const { classifier, INTENTS } = require('./engine/intent_classifier');
const { knowledgeBase } = require('./engine/knowledge_base');
const sessionManager = require('./engine/session_manager');
const composer = require('./engine/answer_composer');
const validator = require('./engine/answer_validator');

class SmartTourGuideServer {
  constructor() {
    this.stats = {
      totalRequests: 0,
      intentsCount: {},
      confidenceCount: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      groqCalls: 0,
      totalLatencyMs: 0
    };
  }

  async callGroq(question, systemPrompt, conversationHistory = []) {
    if (!GROQ_API_KEY) return null;
    try {
      this.stats.groqCalls++;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-4),
        { role: 'user', content: question }
      ];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 350
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (res.ok) {
        const d = await res.json();
        return d.choices?.[0]?.message?.content?.trim();
      }
    } catch (e) {
      console.warn('[Groq Engine] Lỗi gọi API:', e.message);
    }
    return null;
  }

  async handleAsk(body) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const rawQuestion = (body.question || '').trim();
    if (!rawQuestion) {
      return { success: false, error: 'Câu hỏi không được để trống' };
    }

    // TẦNG 1: INPUT PROCESSING (Chuẩn hóa, Ngôn ngữ, Sửa lỗi gõ, Phiên hội thoại)
    const sessionId = body.sessionId || null;
    const session = sessionManager.getOrCreateSession(sessionId);
    const cleaned = nlp.cleanRawText(rawQuestion);
    const language = nlp.detectLanguage(cleaned);
    const standardized = nlp.standardizeTypos(cleaned);

    // Xử lý câu hỏi tiếp nối (Pronoun resolution)
    const followUp = nlp.resolveFollowUp(standardized, session.lastContext);
    const activeQuery = followUp.resolvedQuery;

    // TẦNG 2: INTENT UNDERSTANDING (14+ ý định)
    const intentAnalysis = classifier.classify(activeQuery, session.lastContext);
    const intent = intentAnalysis.intent;
    this.stats.intentsCount[intent] = (this.stats.intentsCount[intent] || 0) + 1;

    // TẦNG 3: CONTEXT RETRIEVAL (Truy xuất tri thức có căn cứ)
    let retrievedData = {
      groundTruthMatch: null,
      exhibitMatch: null,
      customerCareContext: null,
      facts: []
    };

    let topicId = null;
    let topicName = null;

    // 1. Kiểm tra Ground Truth trước tiên để bảo đảm độ chính xác lịch sử tuyệt đối
    const gt = knowledgeBase.findGroundTruthMatch(activeQuery);
    if (gt) {
      retrievedData.groundTruthMatch = gt;
      retrievedData.facts.push(gt.item.reference_answer || gt.item.verified_answer);
      topicId = gt.item.id;
      topicName = gt.item.artifact || gt.item.area;
    }

    if (intent === INTENTS.HISTORICAL_FACT || intent === INTENTS.EXHIBIT_INFORMATION || intent === INTENTS.HISTORICAL_EXPLANATION) {
      // 2. Tìm trong 13 hồ sơ phân khu
      const exhibit = knowledgeBase.findHistoricalExhibit(activeQuery);
      if (exhibit) {
        retrievedData.exhibitMatch = exhibit;
        retrievedData.facts.push(...exhibit.exhibit.facts);
        if (!topicId) topicId = exhibit.exhibit.id;
        if (!topicName) topicName = exhibit.exhibit.name;
      }
    } else {
      // Lấy hồ sơ nghiệp vụ tương ứng (Vé, Giờ, Khiếu nại, Trợ năng...)
      const cc = knowledgeBase.getCustomerCareContext(intent);
      if (cc) {
        retrievedData.customerCareContext = cc;
        retrievedData.facts.push(...cc.facts);
        if (!topicId) topicId = intent;
        if (!topicName) topicName = cc.title;
      }
    }

    // TẦNG 4 & 5: CONFIDENCE EVALUATION & ANSWER GENERATION (Answer Composer)
    const composerResult = await composer.compose({
      question: activeQuery,
      intent,
      retrievedData,
      language,
      session,
      groqCaller: (q, sysPrompt, hist) => this.callGroq(q, sysPrompt, hist)
    });

    const confidence = composerResult.confidence || 'HIGH';
    this.stats.confidenceCount[confidence] = (this.stats.confidenceCount[confidence] || 0) + 1;

    // TẦNG 6: ANSWER VALIDATION
    const finalReply = validator.validateAndRefine(composerResult.reply, intent);

    // TẦNG 7: CUSTOMER EXPERIENCE OPTIMIZATION & SESSION PERSISTENCE
    sessionManager.updateSession(session.id, rawQuestion, finalReply, {
      topic: topicId,
      topicName: topicName,
      intent: intent
    });

    const latencyMs = Date.now() - startTime;
    this.stats.totalLatencyMs += latencyMs;

    // TẦNG 8: FINAL RESPONSE (Tương thích 100% với frontend cũ + bổ sung metadata)
    return {
      success: true,
      data: {
        reply: finalReply,
        intent: intent,
        confidence: confidence,
        sources: composerResult.sources || ['Ban Quản Lý Di Tích Nhà Tù Hỏa Lò'],
        requiresHuman: composerResult.requiresHuman || false,
        responseType: composerResult.responseType || 'DIRECT_ANSWER',
        language: language,
        isFollowUp: followUp.isFollowUp,
        resolvedQuery: followUp.isFollowUp ? activeQuery : undefined,
        sessionId: session.id,
        latencyMs: latencyMs,
        provider: `2Guide Heritage Precision Engine (${intent})`
      }
    };
  }
}

// Khởi tạo Server
const engine = new SmartTourGuideServer();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Endpoint API Chat chính
  if (parsedUrl.pathname === '/api/chat/ask' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const body = bodyStr ? JSON.parse(bodyStr) : {};
        const result = await engine.handleAsk(body);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Endpoint Giám sát hiệu năng & thống kê ý định
  if (parsedUrl.pathname === '/stats' || parsedUrl.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const avgLatency = engine.stats.totalRequests > 0
      ? (engine.stats.totalLatencyMs / engine.stats.totalRequests).toFixed(2)
      : 0;
    res.end(JSON.stringify({
      server: '2Guide AI Customer Experience & Heritage Precision Engine v4.0',
      activeSessions: sessionManager.getSessionCount(),
      stats: {
        ...engine.stats,
        averageLatencyMs: Number(avgLatency)
      },
      uptimeSeconds: process.uptime()
    }, null, 2));
    return;
  }

  // Health check
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP', version: '4.0.0 (Enterprise Quality)', port: PORT }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('2Guide AI Server v4.0 - 404 Not Found');
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(`🎉 2GUIDE AI CUSTOMER EXPERIENCE ENGINE v4.0 ĐÃ SẴN SÀNG!`);
  console.log('======================================================');
  console.log(`🌐 Cổng dịch vụ:     http://localhost:${PORT}`);
  console.log(`🎯 API Chat:         http://localhost:${PORT}/api/chat/ask`);
  console.log(`📊 Giám sát & Stats: http://localhost:${PORT}/stats`);
  console.log(`🧠 Kiến trúc:        8 Tầng (NLP ➡️ Intent ➡️ Context ➡️ Confidence ➡️ Composer ➡️ Validator)`);
  console.log(`⚡ AI Nền tảng:      Groq Cloud LLM (${PRIMARY_MODEL}) + Heritage Precision Engine`);
  console.log('======================================================\n');
});
