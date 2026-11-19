/**
 * 2Guide Response Cache & Request Tier Engine v6.0
 * 
 * - In-Memory LRU Cache tối ưu hóa hiệu năng, giảm thiểu chi phí LLM.
 * - Phân loại 5 Request Tiers theo kiến trúc Production.
 * - Theo dõi lượng tiêu thụ token và ước lượng chi phí API thực tế.
 */

const crypto = require('crypto');

class ResponseCacheEngine {
  constructor(maxSize = 2000, ttlMs = 60 * 60 * 1000) { // 1 giờ TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.version = '6.0.0';

    // Thống kê chi phí & Token
    this.costStats = {
      cacheHits: 0,
      cacheMisses: 0,
      tierDistribution: {
        'Tier 1 (Fast Deterministic)': 0,
        'Tier 2 (Grounded Explanation)': 0,
        'Tier 3 (Multi-turn Context)': 0,
        'Tier 4 (Customer Care Scenario)': 0,
        'Tier 5 (Abstention & Clarification)': 0
      },
      estimatedInputTokens: 0,
      estimatedOutputTokens: 0,
      estimatedCostUsd: 0.0 // Ước tính theo Qwen-27b (~$0.20/M in, $0.60/M out)
    };
  }

  generateKey(query, subject = '', language = 'vi') {
    const raw = `${this.version}_${language}_${subject}_${query.toLowerCase().trim()}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  get(query, subject = '', language = 'vi') {
    const key = this.generateKey(query, subject, language);
    const item = this.cache.get(key);
    if (!item) {
      this.costStats.cacheMisses++;
      return null;
    }

    if (Date.now() - item.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.costStats.cacheMisses++;
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.costStats.cacheHits++;
    return item.data;
  }

  set(query, subject = '', language = 'vi', data) {
    if (!data) return;
    const key = this.generateKey(query, subject, language);

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
   * Phân loại Request Tier (1 đến 5)
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

    this.costStats.tierDistribution[tier] = (this.costStats.tierDistribution[tier] || 0) + 1;
    return tier;
  }

  /**
   * Ghi nhận tiêu thụ token khi gọi LLM
   */
  trackLLMUsage(inputTokens, outputTokens) {
    this.costStats.estimatedInputTokens += inputTokens;
    this.costStats.estimatedOutputTokens += outputTokens;
    // Giá tham chiếu Qwen-27b Cloud: $0.20/1M input, $0.60/1M output
    const cost = (inputTokens / 1000000) * 0.20 + (outputTokens / 1000000) * 0.60;
    this.costStats.estimatedCostUsd += cost;
  }

  invalidateCache() {
    this.cache.clear();
    this.version = '6.0.' + Date.now();
  }

  getStats() {
    const total = this.costStats.cacheHits + this.costStats.cacheMisses;
    const hitRate = total > 0 ? ((this.costStats.cacheHits / total) * 100).toFixed(1) + '%' : '0.0%';
    return {
      cacheSize: this.cache.size,
      hitRate,
      ...this.costStats,
      costPer1000QueriesUsd: total > 0 ? ((this.costStats.estimatedCostUsd / total) * 1000).toFixed(4) : '0.0000'
    };
  }
}

module.exports = new ResponseCacheEngine();
