/**
 * 2Guide Production Conversational AI Engine v6.1 (Production-Grade Edition)
 * 
 * KIẾN TRÚC 8 TẦNG XỬ LÝ DOANH NGHIỆP:
 * 1. INPUT PROCESSING & PROFILE SIGNALS: Chuẩn hóa gõ, lọc injection, trích xuất nhu cầu cá nhân hóa (thời gian, người già, trẻ nhỏ, xe lăn).
 * 2. SEMANTIC INTENT UNDERSTANDING: Phân tích 4 chiều (Intent, SubIntent, Subject, Aspect, Urgency).
 * 3. HYBRID CONTEXT RETRIEVAL: Ground Truth sử học, SSOT Service Knowledge, Hồ sơ phân khu & khía cạnh.
 * 4. INTELLIGENT RESPONSE CACHING V2: Cache Key đa chiều, bảo vệ dữ liệu cá nhân hóa, theo dõi Token & Cost P50/P95.
 * 5. ADAPTIVE ANSWER COMPOSER V2: Không sao chép cứng Ground Truth, thích ứng theo khía cạnh, không văn mẫu khuôn sáo.
 * 6. REAL CLAIM-LEVEL VERIFICATION: Tách mệnh đề độc lập, đối chiếu bằng chứng, Clean Replacement, hiệu chuẩn Confidence thực tế.
 * 7. STRUCTURED CONVERSATION STATE: Cryptographic Session ID, theo dõi tiến trình thực thể, cách ly tuyệt đối (Session Isolation).
 * 8. PRODUCTION HARDENING: Configurable CORS, Rate Limiting (120 req/m) an toàn Proxy, Payload Limit (32KB), Safe Error Handling.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Nạp biến môi trường từ file .env nếu có
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
const API_KEY = process.env.API_KEY || ''; // Nếu set thì kích hoạt API Key protection
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const PRIMARY_MODEL = 'qwen/qwen3.8-27b';
const MAX_PAYLOAD_BYTES = 32 * 1024; // 32KB
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 120; // 120 req/phút/IP
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

// Nạp các Engine độc lập
const nlp = require('./engine/nlp_processor');
const { classifier, INTENTS } = require('./engine/intent_classifier');
const { knowledgeBase, HISTORICAL_EXHIBITS } = require('./engine/knowledge_base');
const sessionManager = require('./engine/session_manager');
const composer = require('./engine/answer_composer');
const validator = require('./engine/answer_validator');
const responseCache = require('./engine/response_cache');

class ProductionSmartTourGuideServer {
  constructor() {
    this.stats = {
      totalRequests: 0,
      intentsCount: {},
      confidenceCount: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      groqCalls: 0,
      totalLatencyMs: 0
    };
    this.rateLimitMap = new Map(); // ip -> { count, resetTime }
  }

  /**
   * Rate Limiter chống spam và lạm dụng tài nguyên
   */
  checkRateLimit(ip) {
    // Whitelist loopback và kiểm thử nội bộ localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost') {
      return true;
    }
    const now = Date.now();
    let record = this.rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
      this.rateLimitMap.set(ip, record);
      return true;
    }
    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    return true;
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
        const content = d.choices?.[0]?.message?.content?.trim();
        const usage = d.usage;
        if (usage) {
          responseCache.trackLLMUsage(usage.prompt_tokens || 200, usage.completion_tokens || 100);
        }
        return content;
      }
    } catch (e) {
      console.warn('[Groq Engine] Lỗi gọi API:', e.message);
    }
    return null;
  }

  /**
   * Xử lý câu hỏi của khách tham quan theo kiến trúc 8 tầng V6.1
   */
  async handleAsk(body) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const rawQuestion = (body.question || '').trim();
    if (!rawQuestion) {
      return { success: false, error: 'Câu hỏi không được để trống' };
    }
    if (rawQuestion.length > 500) {
      return { success: false, error: 'Câu hỏi vượt quá giới hạn cho phép (tối đa 500 ký tự)' };
    }

    // TẦNG 1: INPUT PROCESSING & USER PROFILE SIGNALS
    const sessionId = body.sessionId || null;
    const session = sessionManager.getOrCreateSession(sessionId);
    const cleaned = nlp.cleanRawText(rawQuestion);
    const language = nlp.detectLanguage(cleaned);
    const standardized = nlp.standardizeTypos(cleaned);
    const userProfileSignals = nlp.extractUserProfileSignals(cleaned);

    // Xử lý câu hỏi tiếp nối & Chuyển hướng chủ đề (Pronoun Resolution & Topic Shift)
    const followUp = nlp.resolveFollowUp(standardized, session.lastContext);
    const activeQuery = followUp.resolvedQuery;

    // TẦNG 2: SEMANTIC INTENT UNDERSTANDING (4-Dimensional Analysis)
    const intentAnalysis = classifier.classify(activeQuery, session.lastContext);
    let intent = intentAnalysis.intent;
    const subIntent = intentAnalysis.subIntent || null;
    const subject = intentAnalysis.subject || session.state?.currentSubject || null;
    const aspect = intentAnalysis.aspect || 'GENERAL';
    const urgency = intentAnalysis.urgency || 'NORMAL';
    this.stats.intentsCount[intent] = (this.stats.intentsCount[intent] || 0) + 1;

    // TẦNG 3: HYBRID CONTEXT RETRIEVAL
    let retrievedData = {
      groundTruthMatch: null,
      exhibitMatch: null,
      customerCareContext: null,
      servicePolicy: null,
      subIntent,
      urgency,
      facts: []
    };

    let topicId = null;
    let topicName = null;

    // 1. Kiểm tra Ground Truth trước tiên
    let gt = null;
    if (followUp.isFollowUp) {
      gt = knowledgeBase.findGroundTruthMatch(activeQuery);
    } else {
      const gtCleaned = knowledgeBase.findGroundTruthMatch(cleaned);
      gt = (gtCleaned && gtCleaned.type === 'EXACT') ? gtCleaned : (knowledgeBase.findGroundTruthMatch(activeQuery) || gtCleaned);
    }
    if (gt) {
      retrievedData.groundTruthMatch = gt;
      retrievedData.facts.push(gt.item.reference_answer || gt.item.verified_answer);
      topicId = gt.item.id;
      topicName = gt.item.artifact || gt.item.area;
      if (gt.type === 'EXACT' && !intentAnalysis.isSafetyOrSecurity && intent !== INTENTS.EXPIRED_POLICY && intent !== INTENTS.OUT_OF_SCOPE) {
        intent = INTENTS.HISTORICAL_FACT;
      }
    }

    // 2. Tra cứu Chính sách Dịch vụ Đã Xác Thực (SSOT)
    const policyResult = knowledgeBase.findServicePolicy(activeQuery, intent);
    if (policyResult) {
      retrievedData.servicePolicy = policyResult;
      retrievedData.facts.push(policyResult.policy.content);
      if (!topicId) topicId = policyResult.policy.id;
      if (!topicName) topicName = policyResult.policy.title;
    }

    if (intent === INTENTS.HISTORICAL_FACT || intent === INTENTS.EXHIBIT_INFORMATION || intent === INTENTS.HISTORICAL_EXPLANATION) {
      // 3. Tìm trong 13 hồ sơ phân khu
      const exhibit = knowledgeBase.findHistoricalExhibit(activeQuery);
      if (exhibit) {
        retrievedData.exhibitMatch = exhibit;
        retrievedData.facts.push(...exhibit.exhibit.facts);
        if (!topicId) topicId = exhibit.exhibit.id;
        if (!topicName) topicName = exhibit.exhibit.name;
      }
    } else {
      const cc = knowledgeBase.getCustomerCareContext(intent);
      if (cc) {
        retrievedData.customerCareContext = cc;
        retrievedData.facts.push(...cc.facts);
        if (!topicId) topicId = intent;
        if (!topicName) topicName = cc.title;
      }
    }

    // TẦNG 4: INTELLIGENT RESPONSE CACHING (Kiểm tra Cache trước khi xử lý sâu)
    const cachedItem = responseCache.get({
      query: activeQuery,
      subject: subject || '',
      aspect,
      language,
      intent
    });

    if (cachedItem && !followUp.isFollowUp) {
      const resolvedTopicName = (subject && HISTORICAL_EXHIBITS[subject] ? HISTORICAL_EXHIBITS[subject].name : null) || topicName || 'Di tích Hỏa Lò';
      const resolvedTopicId = subject || topicId;
      sessionManager.updateSession(session.id, rawQuestion, cachedItem.reply, {
        topic: resolvedTopicId,
        topicName: resolvedTopicName,
        intent: cachedItem.intent || intent,
        subIntent: cachedItem.subIntent || subIntent,
        aspect: cachedItem.aspect || aspect,
        userProfileSignals
      });
      const latencyMs = Date.now() - startTime;
      this.stats.totalLatencyMs += latencyMs;
      responseCache.recordLatency(latencyMs);

      return {
        success: true,
        data: {
          ...cachedItem,
          sessionId: session.id,
          latencyMs,
          isCached: true
        }
      };
    }

    // TẦNG 5: ANSWER GENERATION (Adaptive Answer Composer V2)
    const composerResult = await composer.compose({
      question: activeQuery,
      intent,
      subIntent,
      urgency,
      subject,
      aspect,
      retrievedData,
      language,
      session,
      userProfile: userProfileSignals,
      groqCaller: (q, sysPrompt, hist) => this.callGroq(q, sysPrompt, hist)
    });

    const confidence = composerResult.confidence || 'HIGH';
    const confidenceScore = composerResult.confidenceScore || 0.95;
    this.stats.confidenceCount[confidence] = (this.stats.confidenceCount[confidence] || 0) + 1;

    // TẦNG 6: ANSWER VALIDATION V2 (Real Claim-Level Verification & Correction)
    const finalReply = composerResult.reply;
    const claims = composerResult.claims || [];
    const verifiedClaims = composerResult.verifiedClaims || [];

    // Xác định Request Tier
    const requestTier = responseCache.classifyTier({
      hasExactMatch: retrievedData.groundTruthMatch?.type === 'EXACT',
      isPolicy: !!policyResult,
      isFollowUp: followUp.isFollowUp,
      isCustomerCare: [
        'CUSTOMER_COMPLAINT', 'CUSTOMER_ASSISTANCE', 'ACCESSIBILITY_SUPPORT',
        'TICKET_INFORMATION', 'OPENING_HOURS', 'FACILITY_SUPPORT'
      ].includes(intent),
      isClarification: intent === INTENTS.AMBIGUOUS_QUERY,
      isLLMGenerated: composerResult.responseType === 'LLM_GROUNDED_SYNTHESIS'
    });

    // TẦNG 7: STRUCTURED CONVERSATION STATE & SESSION PERSISTENCE
    const resolvedTopicName = (subject && HISTORICAL_EXHIBITS[subject] ? HISTORICAL_EXHIBITS[subject].name : null) || topicName || 'Di tích Hỏa Lò';
    const resolvedTopicId = subject || topicId;
    sessionManager.updateSession(session.id, rawQuestion, finalReply, {
      topic: resolvedTopicId,
      topicName: resolvedTopicName,
      intent: intent,
      subIntent: subIntent,
      aspect: aspect,
      userProfileSignals
    });

    const latencyMs = Date.now() - startTime;
    this.stats.totalLatencyMs += latencyMs;
    responseCache.recordLatency(latencyMs);

    // TẦNG 8: FINAL RESPONSE (Đầy đủ Metadata V6.1)
    const responseData = {
      reply: finalReply,
      intent: intent,
      subIntent: subIntent,
      subject: subject,
      aspect: aspect,
      urgency: urgency,
      style: composerResult.style || 'CUSTOMER_CARE',
      confidence: confidence,
      confidenceScore: confidenceScore,
      requestTier: requestTier,
      sources: composerResult.sources || (policyResult ? [policyResult.policy.source] : ['Ban Quản Lý Di Tích Nhà Tù Hỏa Lò']),
      claims: claims.slice(0, 4),
      verifiedClaims: verifiedClaims.slice(0, 4),
      wasCorrected: composerResult.wasCorrected || false,
      policy: policyResult ? {
        id: policyResult.policy.id,
        title: policyResult.policy.title,
        officialSource: policyResult.policy.official_source,
        sourceUrl: policyResult.policy.source_url,
        status: policyResult.policy.status,
        isExpired: policyResult.isExpired || false,
        responsibleDepartment: policyResult.policy.responsible_department,
        authority: policyResult.policy.authority_boundary
      } : null,
      requiresHuman: composerResult.requiresHuman || false,
      responseType: composerResult.responseType || 'DIRECT_ANSWER',
      language: language,
      isFollowUp: followUp.isFollowUp,
      resolvedQuery: followUp.isFollowUp ? activeQuery : undefined,
      sessionId: session.id,
      latencyMs: latencyMs,
      provider: '2Guide Production Conversational AI Engine v6.1'
    };

    // Lưu vào LRU Cache nếu đủ điều kiện
    responseCache.set({
      query: activeQuery,
      subject: subject || '',
      aspect,
      language,
      intent
    }, responseData, {
      isFollowUp: followUp.isFollowUp,
      userProfile: userProfileSignals,
      intent,
      confidence
    });

    return {
      success: true,
      data: responseData
    };
  }
}

// Khởi tạo Server
const engine = new ProductionSmartTourGuideServer();

const server = http.createServer(async (req, res) => {
  // 1. Configurable CORS Headers
  const reqOrigin = req.headers.origin || '';
  let allowOrigin = '*';
  if (!ALLOWED_ORIGINS.includes('*')) {
    allowOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : (ALLOWED_ORIGINS[0] || '');
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 2. Safe IP Detection with Trust Proxy Support
  const clientIp = TRUST_PROXY && req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  // 3. Rate Limiting Middleware
  if (!engine.checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      error: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.'
    }));
    return;
  }

  // 4. API Key Protection (Nếu cấu hình)
  if (API_KEY) {
    const authHeader = req.headers['authorization'] || '';
    const customKey = req.headers['x-api-key'] || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    if (customKey !== API_KEY && bearerKey !== API_KEY) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Xác thực không hợp lệ: API Key không đúng hoặc bị thiếu.' }));
      return;
    }
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Endpoint API Chat chính (/api/chat/ask)
  if (parsedUrl.pathname === '/api/chat/ask' && req.method === 'POST') {
    let bodyStr = '';
    let bodyBytes = 0;

    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_PAYLOAD_BYTES) {
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Dung lượng yêu cầu vượt quá giới hạn tối đa cho phép (32KB).' }));
        }
        return;
      }
      bodyStr += chunk;
    });

    req.on('end', async () => {
      if (bodyBytes > MAX_PAYLOAD_BYTES) return;
      try {
        const body = bodyStr ? JSON.parse(bodyStr) : {};
        const result = await engine.handleAsk(body);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('Lỗi server:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.' }));
      }
    });
    return;
  }

  // Endpoint Giám sát hiệu năng & Thống kê Tiers (/stats)
  if (parsedUrl.pathname === '/stats' || parsedUrl.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    const avgLatency = engine.stats.totalRequests > 0
      ? (engine.stats.totalLatencyMs / engine.stats.totalRequests).toFixed(2)
      : 0;
    res.end(JSON.stringify({
      server: '2Guide Production Conversational AI Engine v6.1 (Production-Grade)',
      activeSessions: sessionManager.getSessionCount(),
      stats: {
        ...engine.stats,
        averageLatencyMs: Number(avgLatency)
      },
      cacheStats: responseCache.getStats(),
      uptimeSeconds: process.uptime()
    }));
    return;
  }

  // Endpoint Kiểm tra trạng thái máy chủ (/health)
  if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'UP',
      version: '6.1.0 (Production-Grade Conversational AI)',
      port: PORT,
      memoryUsage: process.memoryUsage(),
      activeSessions: sessionManager.getSessionCount()
    }));
    return;
  }

  // Tuyến đường mặc định 404
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ success: false, error: 'Đường dẫn không tồn tại trên hệ thống 2Guide AI API.' }));
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('🎉 2GUIDE PRODUCTION CONVERSATIONAL AI v6.1 ĐÃ SẴN SÀNG!');
  console.log('======================================================');
  console.log(`🌐 Cổng dịch vụ:     http://localhost:${PORT}`);
  console.log(`🎯 API Chat:         http://localhost:${PORT}/api/chat/ask`);
  console.log(`📊 Giám sát & Stats: http://localhost:${PORT}/stats`);
  console.log('🧠 Kiến trúc:        8 Tầng (NLP ➡️ Intent ➡️ Hybrid KB ➡️ Cache ➡️ Composer ➡️ Validator)');
  console.log(`⚡ AI Nền tảng:      Groq Cloud LLM (${PRIMARY_MODEL}) + Heritage Precision Engine`);
  console.log('🛡️ Bảo mật:          Rate Limit (120 req/m) + Payload Limit (32KB) + CORS + Session Isolation');
  console.log('======================================================\n');
});

module.exports = { engine, server };
