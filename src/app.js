/**
 * Sherpa Web Chat Application
 * Pure Vanilla JS + Fluent UI v9 Design Tokens
 * 100% standalone over file:/// and http:// without build tools
 */

class MockSherpaService {
  constructor(options = {}) {
    this.delayMs = options.delayMs ?? 400;
    this.failNext = false;
  }

  setFailNext(shouldFail) {
    this.failNext = shouldFail;
  }

  async sendMessage(request) {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    if (this.failNext) {
      this.failNext = false;
      const error = new Error('Сервис генерации ассистента временно недоступен (500). Попробуйте позже.');
      error.status = 500;
      error.code = 'LLM_SERVICE_UNAVAILABLE';
      throw error;
    }

    const text = (request.message || '').trim().toLowerCase();
    const conversationId = request.conversation_id || this.generateUuid();

    let replyText = '';
    let suggestions = [];

    if (text.includes('субд') || text.includes('баз') || text.includes('oracle') || text.includes('postgres')) {
      replyText = `По вашему запросу подобраны отечественные **СУБД** из реестра российского ПО:

| Продукт | Вендор | Совместимость с 1С | Ключевые особенности |
| :--- | :--- | :--- | :--- |
| **Postgres Pro Standard** | Postgres Professional | Полная | Оптимизировано для средних нагрузок, патчи для 1С |
| **Postgres Pro Enterprise** | Postgres Professional | Полная | High Availability, шардинг 64 ТБ+, сжатие данных |
| **Tantor SE / EE** | Группа Астра | Поддерживается | Удобная GUI-консоль администрирования и мониторинга |
| **Ред База Данных** | РЕД СОФТ | Поддерживается | На базе Firebird, сертификация ФСТЭК |

**Рекомендация менеджера:** Для высоконагруженных баз 1С (от 100 пользователей) рекомендуем **Postgres Pro Enterprise**.`;

      suggestions = [
        'Рассчитать спецификацию Postgres Pro Enterprise на 4 сокета',
        'Сравнить лицензирование Postgres Pro Standard и Enterprise',
        'Проверить партнерскую скидку дистрибутора'
      ];
    } else if (text.includes('ос') || text.includes('linux') || text.includes('астра') || text.includes('windows') || text.includes('ред ос') || text.includes('альт')) {
      replyText = `Обзор ключевых **операционных систем** для корпоративных заказчиков:

1. **Astra Linux Special Edition**
   - *Сертификация:* ФСТЭК 1-й уровень доверия (максимальный).
   - *Типы лицензий:* Серверная, Рабочая станция, Тонкий клиент.
   - *Сценарий:* Госсектор, КИИ, силовые ведомства.
2. **РЕД ОС (версия 8)**
   - *Преимущества:* Высокая совместимость с офисным ПО, привычный интерфейс для пользователей Windows.
   - *Редакции:* Стандартная и Сертифицированная.
3. **Альт Сервер / Альт Рабочая станция 10**
   - *Особенность:* Собственный репозиторий «Сизиф», широкая поддержка отечественных процессоров (Байкал, Эльбрус).

Нужно ли сформировать сравнительную таблицу цен по партнерской сетке?`;

      suggestions = [
        'Показать прайс-лист на Astra Linux SE 1.7',
        'Сравнить РЕД ОС и Альт Линукс',
        'Лицензии для образовательных учреждений'
      ];
    } else if (text.includes('1с') || text.includes('итс') || text.includes('клиент-сервер')) {
      replyText = `Информация по линейке **1С:Предприятие 8**:

- **Серверные лицензии:**
  - *1С:Предприятие 8.3 ПРОФ* — ограничение до 12 ядер на рабочий процесс.
  - *1С:Предприятие 8.3 КОРП* — неограниченная масштабируемость, фоновое обновление, мониторинг кластера.
- **Клиентские лицензии:** на 1, 5, 10, 20, 50, 100, 300, 500 р.м.
- **Сервисы сопровождения:** 1С:КП ПРОФ / 1С:КП Базовый.

Уточните, требуется поставка электронных поставок (ESD) или коробочных версий?`;

      suggestions = [
        'Подобрать лицензии 1С на 50 рабочих мест',
        'Правила апгрейда с ПРОФ на КОРП',
        'Проверить сроки действия 1С:КП'
      ];
    } else if (text.includes('офис') || text.includes('мойофис') || text.includes('р7')) {
      replyText = `Отечественные **офисные пакеты** для корпоративной замены Microsoft 365 / Office:

| Решение | Редакции | Облачное хранилище | Корпоративная почта |
| :--- | :--- | :--- | :--- |
| **Р7-Офис** | Десктоп, Сервер документов, Профессиональный | Поддерживается | Р7-Почта / Корпоративный сервер |
| **МойОфис** | Стандартный, Профессиональный, Частное облако | МойОфис Документы | Mailion / МойОфис Почта |

Оба продукта имеют 100% совместимость с форматами \`.docx\`, \`.xlsx\`, \`.pptx\`.`;

      suggestions = [
        'Запросить триал-ключи Р7-Офис для клиента',
        'Условия перехода с Microsoft 365 на МойОфис'
      ];
    } else {
      replyText = `Я готов помочь с консультацией по каталогу дистрибутора:

- **Подбор импортозамещающего ПО** (реестр Минцифры РФ).
- **Сравнение лицензий и редакций** (ОС, СУБД, офисный софт, виртуализация, безопасность).
- **Лицензирование 1С:Предприятие** и расчет пакетов рабочих мест.
- **Партнерские условия и скидки дистрибутора**.

Задайте ваш вопрос, например: *«Подбери аналог Oracle на Postgres для 1С»* или *«Какие лицензии Astra Linux нужны для сервера?»*.`;

      suggestions = [
        'Подбор СУБД для 1С',
        'Линейка Astra Linux',
        'Пакеты Р7-Офис и МойОфис'
      ];
    }

    return {
      id: this.generateUuid(),
      conversation_id: conversationId,
      sender: 'assistant',
      text: replyText,
      suggestions,
      created_at: new Date().toISOString()
    };
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

class SherpaChatApp {
  constructor(options = {}) {
    this.service = options.service || new MockSherpaService();
    this.container = options.container || document.body;
    this.conversationId = this.service.generateUuid();
    this.messages = [];
    this.isBusy = false;

    this.initElements();
    this.attachEvents();
    this.adjustTextareaHeight();
    this.updateSendButtonState();
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

    if (this.sendButton) {
      this.sendButton.addEventListener('click', (e) => {
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

      this.textarea.addEventListener('focus', () => {
        this.adjustTextareaHeight();
      });

      this.textarea.addEventListener('blur', () => {
        this.adjustTextareaHeight();
      });
    }

    // Слушатель изменения размера окна браузера (раздвигание чата)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.adjustTextareaHeight();
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

    const hasValue = this.textarea.value.trim().length > 0;
    const isFocused = document.activeElement === this.textarea;

    // Сбрасываем высоту для точного измерения scrollHeight
    this.textarea.style.height = 'auto';

    // Для placeholder при пустом вводе и без фокуса:
    // Создаем невидимый клон для точного расчета нужной высоты текста подсказки на текущей ширине
    let targetHeight = 24;

    if (!hasValue && !isFocused && typeof document !== 'undefined') {
      const placeholderText = this.textarea.getAttribute('placeholder') || '';
      const dummy = document.createElement('div');
      dummy.style.position = 'absolute';
      dummy.style.visibility = 'hidden';
      dummy.style.pointerEvents = 'none';
      dummy.style.width = `${this.textarea.clientWidth || 300}px`;
      if (typeof window !== 'undefined') {
        dummy.style.font = window.getComputedStyle(this.textarea).font;
      }
      dummy.style.lineHeight = '1.45';
      dummy.style.whiteSpace = 'normal';
      dummy.style.wordWrap = 'break-word';
      dummy.textContent = placeholderText;
      document.body.appendChild(dummy);
      const measuredPlaceholderHeight = dummy.offsetHeight;
      dummy.remove();

      if (measuredPlaceholderHeight > 28) {
        targetHeight = measuredPlaceholderHeight + 8; // с учетом внутренних отступов
      } else {
        targetHeight = 24;
      }
    } else {
      targetHeight = Math.max(this.textarea.scrollHeight, 24);
    }

    const isMultiline = targetHeight > 28;

    if (this.composerForm) {
      if (isMultiline) {
        this.composerForm.classList.add('multiline');
      } else {
        this.composerForm.classList.remove('multiline');
      }
    }

    this.textarea.style.height = `${targetHeight}px`;
    this.scrollToBottom();
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
      text: `Здравствуйте! Я **Sherpa** — ваш цифровой ассистент по продуктам и лицензированию ПО.

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

// Attach to global scope for browser execution (file:/// and http://)
if (typeof window !== 'undefined') {
  window.MockSherpaService = MockSherpaService;
  window.SherpaChatApp = SherpaChatApp;

  const startApp = () => {
    const container = document.querySelector('.chat-app-container') || document.body;
    window.sherpaApp = new SherpaChatApp({ container });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}

// Attach to globalThis for Node.js test runner
if (typeof globalThis !== 'undefined') {
  globalThis.MockSherpaService = MockSherpaService;
  globalThis.SherpaChatApp = SherpaChatApp;
}
