/**
 * HttpSherpaService — HTTP-клиент взаимодействия с REST API ассистента Sherpa
 * Conforms to contracts/api/sherpa-chat-api-v1.yaml
 */

class HttpSherpaService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? (options.apiUrl ?? '');
    this.token = options.token ?? null;
    this.headers = options.headers ?? {};
    this.userName = options.userName ?? 'Илья';
    this.isServerConnected = options.isServerConnected ?? false;
    this.logger = options.logger ?? null;
    this.services = options.services ?? [];

    if (this.logger) {
      this.logger.log('info', 'HTTP', `HttpSherpaService инициализирован (${this.baseUrl || 'URL не задан'})`);
    }
  }

  getServices() {
    return this.services;
  }

  getStatus() {
    return this.isServerConnected ? 'online' : 'server-offline';
  }

  setStatus(status) {
    this.isServerConnected = status !== 'server-offline' && status !== 'offline' && status !== false;
  }

  extractSuggestionCommandText(suggestionText) {
    if (!suggestionText) return '';
    let str = String(suggestionText).trim();
    if (str.startsWith('!') || str.startsWith('~')) {
      str = str.slice(1).trim();
    }
    const mapped = str.split(/\s+=>\s+/);
    if (mapped.length > 1 && mapped[1].trim()) {
      return mapped[1].trim();
    }
    const parts = mapped[0].split(/\s+[—–]\s+/);
    return parts[0].trim();
  }

  formatResponseText(replyText, suggestions = [], placeholder = '') {
    this.lastSuggestions = suggestions || [];
    let result = (replyText || '').trim();

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      const formattedBtns = [];
      suggestions.forEach((item, idx) => {
        let raw = String(item).trim();
        let prefix = '';
        if (raw.startsWith('!')) {
          prefix = '! ';
          raw = raw.slice(1).trim();
        } else if (raw.startsWith('~')) {
          prefix = '~ ';
          raw = raw.slice(1).trim();
        }

        const mapped = raw.split(/\s+=>\s+/);
        const label = (mapped[0] || '').trim();
        const sendText = (mapped[1] || label).trim();
        const cleanCmd = this.extractSuggestionCommandText(sendText);
        const cmdToMatch = cleanCmd || sendText;

        if (cmdToMatch && result.includes(`(cmd:${cmdToMatch})`)) {
          return;
        }

        formattedBtns.push(`[${prefix}${idx + 1}. ${label}](cmd:${cmdToMatch})`);
      });

      if (formattedBtns.length > 0) {
        result += '\n\n' + formattedBtns.join('  \n');
      }
    }

    if (placeholder) {
      result += `\n\n:::placeholder ${placeholder} :::`;
    }

    return result;
  }

  async getGreeting(userName = this.userName) {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/chat/greeting`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.headers
    };

    const token = this.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('sherpa_token') : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.logger) {
      this.logger.log('info', 'HTTP', `GET ${url}`);
    }

    let response;
    const startTime = Date.now();
    try {
      response = await fetch(url, {
        method: 'GET',
        headers
      });
    } catch (networkErr) {
      this.isServerConnected = false;
      if (this.logger) {
        this.logger.log('error', 'HTTP', `Сбой сети при запросе greeting к ${url}: ${networkErr.message}`);
      }
      const err = new Error(`Не удалось подключиться к серверу ассистента (${networkErr.message || 'Network Error'}). Проверьте соединение.`);
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      this.isServerConnected = false;
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP Error ${response.status} (${response.statusText})` };
      }

      if (this.logger) {
        this.logger.log('error', 'HTTP', `Ошибка greeting ${response.status} от ${url} (${elapsed}ms)`, errorData);
      }

      const err = new Error(errorData.message || `Ошибка сервера (${response.status})`);
      err.status = response.status;
      err.code = errorData.code || 'SERVER_ERROR';
      throw err;
    }

    const data = await response.json();
    this.isServerConnected = true;

    if (data.services) {
      this.services = data.services;
    }

    if (this.logger) {
      this.logger.log('info', 'HTTP', `Успешное greeting от ${url} (${elapsed}ms)`, {
        id: data.id,
        servicesCount: data.services ? data.services.length : 0
      });
    }

    return {
      id: data.id || this.generateUuid(),
      conversation_id: data.conversation_id,
      sender: data.sender || 'assistant',
      text: data.text || '',
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      placeholder: data.placeholder || 'Введите сообщение или выберите действие...',
      services: data.services || this.getServices(),
      created_at: data.created_at || new Date().toISOString()
    };
  }

  async sendMessage(request) {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/chat/message`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.headers
    };

    const token = this.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('sherpa_token') : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.logger) {
      this.logger.log('info', 'HTTP', `POST ${url}`, { conversation_id: request.conversation_id, message: request.message });
    }

    let response;
    const startTime = Date.now();
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id: request.conversation_id,
          message: request.message,
          context: request.context || {},
          attachments: request.attachments || []
        })
      });
    } catch (networkErr) {
      this.isServerConnected = false;
      if (this.logger) {
        this.logger.log('error', 'HTTP', `Сбой сети при запросе к ${url}: ${networkErr.message}`);
      }
      const err = new Error(`Не удалось подключиться к серверу ассистента (${networkErr.message || 'Network Error'}). Проверьте соединение.`);
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      this.isServerConnected = false;
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (_) {
        // ignore non-json error responses
      }
      if (this.logger) {
        this.logger.log('error', 'HTTP', `Ошибка HTTP ${response.status} (${elapsed}мс): ${errorData.message || response.statusText}`);
      }
      const err = new Error(errorData.message || `Ошибка сервера (${response.status} ${response.statusText || ''})`);
      err.status = response.status;
      err.code = errorData.code || `HTTP_${response.status}`;
      throw err;
    }

    const data = await response.json();
    this.isServerConnected = true;

    if (data.services) {
      this.services = data.services;
    }

    if (this.logger) {
      this.logger.log('info', 'HTTP', `Успешный ответ 200 OK (${elapsed}мс)`);
    }
    return data;
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.HttpSherpaService = HttpSherpaService;
}
if (typeof window !== 'undefined') {
  window.HttpSherpaService = HttpSherpaService;
}
