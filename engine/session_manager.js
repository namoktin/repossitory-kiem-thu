/**
 * 2Guide Session Manager
 * Quản lý phiên hội thoại an toàn, có kiểm soát độ dài và thời gian sống (TTL),
 * phục vụ hội thoại nhiều lượt và câu hỏi tiếp nối (Multi-turn conversational memory).
 */

class SessionManager {
  constructor(ttlMs = 30 * 60 * 1000) { // 30 phút TTL
    this.sessions = new Map();
    this.ttlMs = ttlMs;
    this.maxHistoryTurns = 4; // Giữ tối đa 4 lượt gần nhất

    // Dọn dẹp session hết hạn định kỳ mỗi 5 phút
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000).unref();
  }

  getSession(sessionId) {
    if (!sessionId) return null;
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
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }

    let session = this.getSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        lastAccess: Date.now(),
        history: [],
        lastContext: {
          lastTopic: null,
          lastTopicName: null,
          lastIntent: null
        }
      };
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  updateSession(sessionId, userMessage, assistantReply, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);

    // Cập nhật lịch sử
    session.history.push({ role: 'user', content: userMessage });
    session.history.push({ role: 'assistant', content: assistantReply });

    // Cắt bớt nếu vượt quá số lượt quy định
    if (session.history.length > this.maxHistoryTurns * 2) {
      session.history = session.history.slice(-this.maxHistoryTurns * 2);
    }

    // Cập nhật ngữ cảnh cho lượt tiếp nối
    if (metadata.topic) {
      session.lastContext.lastTopic = metadata.topic;
    }
    if (metadata.topicName) {
      session.lastContext.lastTopicName = metadata.topicName;
    }
    if (metadata.intent) {
      session.lastContext.lastIntent = metadata.intent;
    }

    session.lastAccess = Date.now();
    return session;
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
}

module.exports = new SessionManager();
