/**
 * ChatLogger — встроенное логирование событий и журналов Sherpa Web Chat
 */

class ChatLogger {
  constructor(options = {}) {
    this.maxLogs = options.maxLogs ?? 200;
    this.logs = [];
    this.listeners = [];
  }

  log(level, tag, message, data = null) {
    const entry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level, // 'info' | 'warn' | 'error' | 'debug'
      tag,   // 'SYS' | 'MOCK' | 'HTTP' | 'USER' | 'ASSISTANT' | ...
      message,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.listeners.forEach((fn) => {
      try {
        fn(entry, this.logs);
      } catch (_) {}
    });

    return entry;
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach((fn) => {
      try {
        fn(null, this.logs);
      } catch (_) {}
    });
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }

  getFormattedText() {
    return this.logs
      .map((l) => `[${l.timeStr}] [${l.tag}] ${l.message}${l.data ? ' ' + JSON.stringify(l.data) : ''}`)
      .join('\n');
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.ChatLogger = ChatLogger;
}
if (typeof window !== 'undefined') {
  window.ChatLogger = ChatLogger;
}
