import { MockSherpaService } from '../mocks/mock-assistant.js';

export class SherpaChatApp {
  constructor(options = {}) {
    this.service = options.service || new MockSherpaService();
    this.container = options.container || document.body;
    this.conversationId = this.service.generateUuid();
    this.messages = [];
    this.isBusy = false;

    this.initElements();
    this.attachEvents();
    this.loadInitialGreeting();
  }

  initElements() {
    this.feedElement = this.container.querySelector('#messageFeed');
    this.composerForm = this.container.querySelector('#composerForm');
    this.textarea = this.container.querySelector('#composerTextarea');
    this.sendButton = this.container.querySelector('#sendButton');
    this.resetButton = this.container.querySelector('#resetButton');
    this.errorBanner = this.container.querySelector('#errorBanner');
    this.errorMessage = this.container.querySelector('#errorMessage');
    this.retryButton = this.container.querySelector('#retryButton');
  }

  attachEvents() {
    if (this.composerForm) {
      this.composerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSend();
      });
    }

    if (this.textarea) {
      this.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });

      this.textarea.addEventListener('input', () => {
        this.adjustTextareaHeight();
        this.updateSendButtonState();
      });
    }

    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.resetChat();
      });
    }

    if (this.retryButton) {
      this.retryButton.addEventListener('click', () => {
        this.hideError();
        if (this.lastFailedMessage) {
          this.sendMessage(this.lastFailedMessage);
        }
      });
    }
  }

  adjustTextareaHeight() {
    if (!this.textarea) return;
    this.textarea.style.height = 'auto';
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  updateSendButtonState() {
    if (!this.sendButton || !this.textarea) return;
    const hasText = this.textarea.value.trim().length > 0;
    this.sendButton.disabled = !hasText || this.isBusy;
  }

  loadInitialGreeting() {
    const greeting = {
      id: 'greeting-1',
      sender: 'assistant',
      text: `Здравствуйте! Я **Шерпа** — ваш цифровой ассистент по продуктам и лицензированию ПО.

Я помогу:
- Подобрать программное обеспечение из **реестра отечественного ПО** взамен зарубежных решений (Oracle, Microsoft, VMware, Red Hat).
- Рассчитать спецификации и правила лицензирования для **1С:Предприятие 8**, **Astra Linux**, **Postgres Pro**, **Р7-Офис** и **МойОфис**.
- Уточнить партнерские условия, акции и скидки.

Чем могу помочь сегодня?`,
      suggestions: [
        'Подбор СУБД для 1С (Postgres Pro / Tantor)',
        'Серверные и клиентские лицензии 1С:Предприятие 8',
        'Линейка Astra Linux Special Edition',
        'Офисные пакеты Р7-Офис и МойОфис'
      ],
      created_at: new Date().toISOString()
    };

    this.messages = [greeting];
    this.renderMessages();
  }

  resetChat() {
    this.conversationId = this.service.generateUuid();
    this.lastFailedMessage = null;
    this.hideError();
    this.loadInitialGreeting();
    if (this.textarea) {
      this.textarea.value = '';
      this.adjustTextareaHeight();
      this.updateSendButtonState();
      this.textarea.focus();
    }
  }

  async handleSend() {
    if (!this.textarea || this.isBusy) return;
    const text = this.textarea.value.trim();
    if (!text) return;

    this.textarea.value = '';
    this.adjustTextareaHeight();
    this.updateSendButtonState();
    this.hideError();

    await this.sendMessage(text);
  }

  async sendMessage(text) {
    const userMsg = {
      id: this.service.generateUuid(),
      sender: 'user',
      text,
      created_at: new Date().toISOString()
    };

    this.messages.push(userMsg);
    this.renderMessages();
    this.scrollToBottom();

    this.setBusy(true);
    this.showTypingIndicator();

    try {
      const response = await this.service.sendMessage({
        conversation_id: this.conversationId,
        message: text
      });

      this.removeTypingIndicator();
      this.messages.push(response);
      this.renderMessages();
      this.scrollToBottom();
      this.lastFailedMessage = null;
    } catch (err) {
      this.removeTypingIndicator();
      this.lastFailedMessage = text;
      this.showError(err.message || 'Ошибка связи с ассистентом.');
    } finally {
      this.setBusy(false);
      this.updateSendButtonState();
      if (this.textarea) this.textarea.focus();
    }
  }

  setBusy(busy) {
    this.isBusy = busy;
    this.updateSendButtonState();
  }

  showTypingIndicator() {
    this.removeTypingIndicator();
    if (!this.feedElement) return;

    const row = document.createElement('div');
    row.id = 'typingRow';
    row.className = 'message-row assistant';
    row.innerHTML = `
      <div class="message-bubble-wrapper">
        <div class="typing-indicator-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    this.feedElement.appendChild(row);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const el = this.container.querySelector('#typingRow');
    if (el) el.remove();
  }

  showError(msg) {
    if (this.errorMessage) this.errorMessage.textContent = msg;
    if (this.errorBanner) this.errorBanner.style.display = 'flex';
  }

  hideError() {
    if (this.errorBanner) this.errorBanner.style.display = 'none';
  }

  renderMessages() {
    if (!this.feedElement) return;
    this.feedElement.innerHTML = '';

    this.messages.forEach((msg) => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.sender}`;

      const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const htmlContent = msg.sender === 'assistant' ? this.parseMarkdown(msg.text) : this.escapeHtml(msg.text);

      let suggestionsHtml = '';
      if (msg.suggestions && msg.suggestions.length > 0) {
        suggestionsHtml = `
          <div class="suggestion-chips">
            ${msg.suggestions.map((s) => `<button type="button" class="chip-button" data-chip="${this.escapeHtml(s)}">${this.escapeHtml(s)}</button>`).join('')}
          </div>
        `;
      }

      row.innerHTML = `
        <div class="message-bubble-wrapper">
          <div class="message-bubble">
            ${htmlContent}
          </div>
          ${suggestionsHtml}
          <div class="message-meta">
            <span>${timeStr}</span>
          </div>
        </div>
      `;

      // Attach chip click events
      row.querySelectorAll('.chip-button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const chipText = btn.getAttribute('data-chip');
          if (chipText && !this.isBusy) {
            this.sendMessage(chipText);
          }
        });
      });

      this.feedElement.appendChild(row);
    });
  }

  scrollToBottom() {
    if (!this.feedElement) return;
    requestAnimationFrame(() => {
      this.feedElement.scrollTop = this.feedElement.scrollHeight;
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Lightweight robust Markdown parser for enterprise chat
   * Handles tables, bold, italics, lists, code, line breaks
   */
  parseMarkdown(text) {
    if (!text) return '';

    const lines = text.split('\n');
    let html = '';
    let inTable = false;
    let tableHeaders = [];
    let inList = false;

    const flushList = () => {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    };

    const flushTable = () => {
      if (inTable) {
        html += '</tbody></table>';
        inTable = false;
        tableHeaders = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Table line detection: starts and ends with |
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        const cells = line.split('|').slice(1, -1).map((c) => c.trim());

        // Check if separator line (|---|---|)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          html += '<table><thead><tr>';
          cells.forEach((cell) => {
            html += `<th>${this.formatInline(cell)}</th>`;
          });
          html += '</tr></thead><tbody>';
        } else {
          html += '<tr>';
          cells.forEach((cell) => {
            html += `<td>${this.formatInline(cell)}</td>`;
          });
          html += '</tr>';
        }
        continue;
      } else {
        flushTable();
      }

      // Unordered or ordered list detection
      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const itemContent = line.replace(/^(-\s|\*\s|\d+\.\s)/, '');
        html += `<li>${this.formatInline(itemContent)}</li>`;
        continue;
      } else {
        flushList();
      }

      // Empty line
      if (!line) {
        continue;
      }

      // Standard paragraph
      html += `<p>${this.formatInline(line)}</p>`;
    }

    flushList();
    flushTable();

    return html;
  }

  formatInline(str) {
    let out = this.escapeHtml(str);
    // Bold **text**
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code `code`
    out = out.replace(/`(.+?)`/g, '<code>$1</code>');
    return out;
  }
}

// Auto-bootstrap when loaded in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.chat-app-container') || document.body;
    window.sherpaApp = new SherpaChatApp({ container });
  });
}
