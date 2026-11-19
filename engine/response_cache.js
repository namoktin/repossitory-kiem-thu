/**
 * 2Guide Response Cache & Cost Tracking Engine v6.1 (Production-Grade)
 * 
 * NÂNG CẤP TOÀN DIỆN:
 * 1. Cache Key đa chiều: query + subject + aspect + language + intent + knowledgeVersion + model.
 * 2. Bảo vệ Cá nhân hóa: Tuyệt đối không cache chia sẻ các phản hồi có yếu tố cá nhân hóa theo session
 *    (hội thoại tiếp nối, hồ sơ người dùng có ràng buộc thời gian/người già/xe lăn).
 * 3. Invalidation: Hỗ trợ xóa cache tự động khi tri thức hoặc chính sách cập nhật.
 * 4. Đo đạc chi phí & hiệu năng thực tế: Cache Hit/Miss, LLM Call Rate, Token consumption,
 *    Cost per 1,000 queries, Phân vị P50/P95 latency.
 */

const crypto = require('crypto');

class ResponseCacheEngineV2 {
  constructor(maxSize = 3000, ttlMs = 60 * 60 * 1000) { // 1 giờ TTL mặc định
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.knowledgeVersion = '6.1.0';
    this.modelName = 'qwen/qwen3.8-27b';

    // Thống kê toàn diện
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      llmCalls: 0,
      tierDistribution: {
        'Tier 1 (Fast Deterministic)': 0,
        'Tier 2 (Grounded Explanation)': 0,
        'Tier 3 (Multi-turn Context)': 0,
        'Tier 4 (Customer Care Scenario)': 0,
        'Tier 5 (Abstention & Clarification)': 0
      },
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      estimatedCostUsd: 0.0,
      latencies: []
    };
  }

  /**
   * Phân giải tham số hỗ trợ cả Object và Positional parameters
   */
  _parseArgs(firstArg, arg2, arg3, arg4, arg5) {
    if (typeof firstArg === 'object' && firstArg !== null) {
      return {
        query: firstArg.query || '',
        subject: firstArg.subject || '',
        aspect: firstArg.aspect || 'GENERAL',
        language: firstArg.language || 'vi',
        intent: firstArg.intent || ''
      };
    }
    return {
      query: firstArg || '',
      subject: typeof arg2 === 'string' ? arg2 : '',
      aspect: typeof arg4 === 'string' ? arg4 : 'GENERAL',
      language: typeof arg3 === 'string' ? arg3 : 'vi',
      intent: typeof arg5 === 'string' ? arg5 : ''
    };
  }

  /**
   * Tạo Cache Key duy nhất đa chiều (Multi-dimensional SHA-256)
   */
  generateKey(firstArg, arg2, arg3, arg4, arg5) {
    const { query, subject, aspect, language, intent } = this._parseArgs(firstArg, arg2, arg3, arg4, arg5);
    const normQ = (query || '').toLowerCase().trim();
    const raw = `${this.knowledgeVersion}|${this.modelName}|${language}|${intent}|${subject}|${aspect}|${normQ}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Kiểm tra điều kiện an toàn trước khi lưu Cache (Cacheability Check)
   */
  isCacheable({ isFollowUp, userProfile, intent, confidence } = {}) {
    // 1. Tuyệt đối không cache câu trả lời tiếp nối đa lượt (phụ thuộc session)
    if (isFollowUp) return false;

    // 2. Không cache câu trả lời có ràng buộc cá nhân hóa đặc thù
    if (userProfile?.timeConstraint || userProfile?.hasElderly || userProfile?.hasChildren || userProfile?.hasWheelchair) {
      return false;
    }

    // 3. Không cache khi độ tin cậy thấp hoặc cần làm rõ
    if (confidence === 'LOW' || intent === 'AMBIGUOUS_QUERY') return false;

    return true;
  }

  get(firstArg, arg2, arg3, arg4, arg5) {
    this.stats.totalRequests++;
    const key = this.generateKey(firstArg, arg2, arg3, arg4, arg5);
    const item = this.cache.get(key);

    if (!item) {
      this.stats.cacheMisses++;
      return null;
    }

    // Kiểm tra TTL
    if (Date.now() - item.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      return null;
    }

    // LRU re-insertion
    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.cacheHits++;
    return item.data;
  }

  set(firstArg, arg2, arg3, arg4, arg5) {
    let params, data, conditions;
    if (typeof firstArg === 'object' && firstArg !== null) {
      params = this._parseArgs(firstArg);
      data = arg2;
      conditions = arg3 || {};
    } else {
      // Positional args: set(query, subject, language, data, conditions)
      // hoặc set(query, subject, data, conditions)
      if (typeof arg4 === 'object' && arg4 !== null && (arg4.reply || arg4.text || arg4.answer)) {
        params = this._parseArgs(firstArg, arg2, arg3);
        data = arg4;
        conditions = arg5 || {};
      } else if (typeof arg3 === 'object' && arg3 !== null && (arg3.reply || arg3.text || arg3.answer)) {
        params = this._parseArgs(firstArg, arg2, 'vi');
        data = arg3;
        conditions = arg4 || {};
      } else {
        params = this._parseArgs(firstArg, arg2, typeof arg3 === 'string' ? arg3 : 'vi');
        data = typeof arg4 === 'object' ? arg4 : arg3;
        conditions = arg5 || {};
      }
    }

    if (!data) return;
    if (!this.isCacheable(conditions)) return;

    const key = this.generateKey(params);

    // LRU eviction nếu đầy
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Phân loại 5 Request Tiers chuẩn hóa
   */
  classifyTier({ hasExactMatch, isPolicy, isFollowUp, isCustomerCare, isClarification, isLLMGenerated }) {
    let tier = 'Tier 1 (Fast Deterministic)';

    if (isClarification) {
      tier = 'Tier 5 (Abstention & Clarification)';
    } else if (isCustomerCare) {
      tier = 'Tier 4 (Customer Care Scenario)';
    } else if (isFollowUp) {
      tier = 'Tier 3 (Multi-turn Context)';
    } else if (isLLMGenerated || (!hasExactMatch && !isPolicy)) {
      tier = 'Tier 2 (Grounded Explanation)';
    } else {
      tier = 'Tier 1 (Fast Deterministic)';
    }

    this.stats.tierDistribution[tier] = (this.stats.tierDistribution[tier] || 0) + 1;
    return tier;
  }

  /**
   * Ghi nhận tiêu thụ token và tính chi phí API thực tế
   */
  trackLLMUsage(inputTokens, outputTokens) {
    this.stats.llmCalls++;
    this.stats.estimatedInputTokens += inputTokens;
    this.stats.estimatedOutputTokens += outputTokens;
    // Bảng giá tham chiếu Qwen-27b / Qwen-2.5-32b Cloud: $0.20 / 1M input, $0.60 / 1M output
    const cost = (inputTokens / 1000000) * 0.20 + (outputTokens / 1000000) * 0.60;
    this.stats.estimatedCostUsd += cost;
  }

  /**
   * Ghi nhận độ trễ để tính toán phân vị P50 / P95
   */
  recordLatency(ms) {
    this.stats.latencies.push(ms);
    if (this.stats.latencies.length > 2000) {
      this.stats.latencies.shift();
    }
  }

  /**
   * Tính toán phân vị độ trễ P50, P90, P95
   */
  getPercentiles() {
    if (this.stats.latencies.length === 0) {
      return { p50: 0, p90: 0, p95: 0, avg: 0 };
    }
    const sorted = [...this.stats.latencies].sort((a, b) => a - b);
    const len = sorted.length;
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / len);
    const p50 = sorted[Math.floor(len * 0.50)];
    const p90 = sorted[Math.floor(len * 0.90)];
    const p95 = sorted[Math.floor(len * 0.95)];
    return { p50, p90, p95, avg };
  }

  /**
   * Vô hiệu hóa cache khi tri thức cập nhật
   */
  invalidateCache() {
    this.cache.clear();
    this.knowledgeVersion = '6.1.' + Date.now();
  }

  getStats() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    const hitRate = total > 0 ? ((this.stats.cacheHits / total) * 100).toFixed(1) + '%' : '0.0%';
    const llmCallRate = total > 0 ? ((this.stats.llmCalls / total) * 100).toFixed(1) + '%' : '0.0%';
    const costPer1000 = total > 0 ? ((this.stats.estimatedCostUsd / total) * 1000).toFixed(4) : '0.0000';
    const percentiles = this.getPercentiles();

    return {
      cacheSize: this.cache.size,
      hitRate,
      llmCallRate,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      llmCalls: this.stats.llmCalls,
      tierDistribution: this.stats.tierDistribution,
      estimatedInputTokens: this.stats.estimatedInputTokens,
      estimatedOutputTokens: this.stats.estimatedOutputTokens,
      estimatedCostUsd: Number(this.stats.estimatedCostUsd.toFixed(6)),
      costPer1000QueriesUsd: costPer1000,
      latencyMetrics: percentiles
    };
  }
}

module.exports = new ResponseCacheEngineV2();
