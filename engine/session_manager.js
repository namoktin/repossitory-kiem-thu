/**
 * 2Guide Structured Session Manager v6.0 (Enterprise Edition)
 * 
 * Quản lý phiên hội thoại an toàn, cách ly tuyệt đối giữa các người dùng (Session Isolation),
 * duy trì Conversation State có cấu trúc phục vụ Multi-turn Conversational Intelligence:
 * - currentSubject: Thực thể/Chủ đề chính đang thảo luận.
 * - subjectName: Tên đại diện của chủ đề.
 * - entityHistory: Lịch sử các thực thể đã nhắc đến theo thứ tự.
 * - discussedAspects: Các khía cạnh đã trao đổi (tránh lặp lại thông tin).
 * - userProfile: Hồ sơ nhu cầu người dùng thu thập trong phiên (thời gian, đối tượng đi cùng...).
 * - turnCount: Số lượt tương tác.
 */

const crypto = require('crypto');

class StructuredSessionManager {
  constructor(ttlMs = 30 * 60 * 1000) { // 30 phút TTL
    this.sessions = new Map();
    this.ttlMs = ttlMs;
    this.maxHistoryTurns = 6; // Giữ tối đa 6 lượt hội thoại gần nhất

    // Dọn dẹp session hết hạn định kỳ mỗi 5 phút
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000).unref();
  }

  /**
   * Tạo Session ID an toàn chuẩn UUID cryptographically strong
   */
  generateSessionId() {
    return 'sess_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();
  }

  /**
   * Kiểm tra tính hợp lệ của Session ID để ngăn chặn Directory Traversal hoặc Injection
   */
  isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return false;
    // Cho phép chữ cái, chữ số, dấu gạch dưới, gạch ngang, độ dài từ 5 đến 80 ký tự
    return /^[a-zA-Z0-9_\-]{5,80}$/.test(sessionId);
  }

  getSession(sessionId) {
    if (!this.isValidSessionId(sessionId)) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() - session.lastAccess > this.ttlMs) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastAccess = Date.now();
    return session;
  }

  getOrCreateSession(sessionId) {
    let cleanId = sessionId;
    if (!this.isValidSessionId(cleanId)) {
      cleanId = this.generateSessionId();
    }

    let session = this.getSession(cleanId);
    if (!session) {
      session = {
        id: cleanId,
        createdAt: Date.now(),
        lastAccess: Date.now(),
        turnCount: 0,
        history: [],
        state: {
          currentSubject: null,
          subjectName: null,
          entityHistory: [],
          discussedAspects: [],
          userProfile: {
            timeConstraint: null, // e.g. 20, 30, 45, 90 (minutes)
            hasElderly: false,
            hasChildren: false,
            hasWheelchair: false,
            isForeigner: false,
            preferredLanguage: 'vi'
          },
          lastIntent: null,
          lastSubIntent: null
        },
        // Tương thích ngược với lastContext của v5.0
        get lastContext() {
          return {
            lastTopic: this.state.currentSubject,
            lastTopicName: this.state.subjectName,
            lastIntent: this.state.lastIntent,
            lastSubIntent: this.state.lastSubIntent,
            entityHistory: this.state.entityHistory,
            userProfile: this.state.userProfile
          };
        }
      };
      this.sessions.set(cleanId, session);
    }

    return session;
  }

  /**
   * Cập nhật ngữ cảnh phiên hội thoại có cấu trúc
   */
  updateSession(sessionId, userMessage, assistantReply, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);
    session.turnCount++;

    // Cập nhật lịch sử trao đổi
    session.history.push({ role: 'user', content: userMessage });
    session.history.push({ role: 'assistant', content: assistantReply });

    if (session.history.length > this.maxHistoryTurns * 2) {
      session.history = session.history.slice(-this.maxHistoryTurns * 2);
    }

    // Cập nhật Thực thể & Chủ đề
    if (metadata.topic) {
      session.state.currentSubject = metadata.topic;
      if (!session.state.entityHistory.includes(metadata.topic)) {
        session.state.entityHistory.push(metadata.topic);
        if (session.state.entityHistory.length > 8) {
          session.state.entityHistory.shift();
        }
      }
    }
    if (metadata.topicName) {
      session.state.subjectName = metadata.topicName;
    }
    if (metadata.intent) {
      session.state.lastIntent = metadata.intent;
    }
    if (metadata.subIntent) {
      session.state.lastSubIntent = metadata.subIntent;
    }

    // Cập nhật khía cạnh đã bàn (Aspects)
    if (metadata.aspect && !session.state.discussedAspects.includes(metadata.aspect)) {
      session.state.discussedAspects.push(metadata.aspect);
    }

    // Cập nhật hồ sơ người dùng nếu có tín hiệu mới
    if (metadata.userProfileSignals) {
      const sig = metadata.userProfileSignals;
      if (sig.timeConstraint) session.state.userProfile.timeConstraint = sig.timeConstraint;
      if (sig.hasElderly) session.state.userProfile.hasElderly = true;
      if (sig.hasChildren) session.state.userProfile.hasChildren = true;
      if (sig.hasWheelchair) session.state.userProfile.hasWheelchair = true;
      if (sig.isForeigner) session.state.userProfile.isForeigner = true;
      if (sig.preferredLanguage) session.state.userProfile.preferredLanguage = sig.preferredLanguage;
    }

    session.lastAccess = Date.now();
    return session;
  }

  resetSession(sessionId) {
    if (this.isValidSessionId(sessionId)) {
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastAccess > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  getSessionCount() {
    return this.sessions.size;
  }

  exportState(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return {
      sessionId: session.id,
      turnCount: session.turnCount,
      state: session.state,
      historyLength: session.history.length
    };
  }
}

module.exports = new StructuredSessionManager();
