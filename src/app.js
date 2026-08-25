/**
 * Sherpa Web Chat Application v0.3.0
 * Pure Vanilla JS + Fluent UI v9 Design Tokens
 * Standalone Thin Client
 */

class SherpaChatApp {
  constructor(options = {}) {
    const LoggerClass = (typeof globalThis !== 'undefined' && globalThis.ChatLogger) || (typeof window !== 'undefined' && window.ChatLogger);
    this.logger = options.logger || (LoggerClass ? new LoggerClass() : null);
    this.settings = this.loadSettings(options.settings || {});
    this.service = options.service || this.createServiceFromSettings();
    this.container = options.container || (typeof document !== 'undefined' ? document.body : null);
    this.conversationId = (this.service && typeof this.service.generateUuid === 'function')
      ? this.service.generateUuid()
      : 'c-' + Math.random().toString(36).substring(2, 9);
    this.messages = [];
    this.isBusy = false;
    this.isConnecting = false;

    if (this.container) {
      this.initElements();
      this.attachEvents();
      this.initLoggerSubscriber();
      this.adjustTextareaHeight();
      this.updateInputControlsState();
      this.loadInitialGreeting();
    }

    if (this.logger) {
      this.logger.log('info', 'SYS', 'Sherpa Web Chat инициализирован');
    }
  }

  loadSettings(overrides = {}) {
    const defaults = {
      mode: 'mock',
      mock1cStatus: 'online',
      mockGlinerStatus: 'online',
      mockServerStatus: 'online',
      mockDelayMs: 400,
      userName: 'Илья',
      apiUrl: 'http://localhost:8000',
      token: '',
      messageRenderMode: 'markdown'
    };

    let stored = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const item = localStorage.getItem('sherpa_settings');
        if (item) stored = JSON.parse(item);
      } catch (_) {}
    }

    // URL params override
    let urlOverrides = {};
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const mockParam = urlParams.get('mock');
      const modeParam = urlParams.get('mode');
      const apiUrlParam = urlParams.get('apiUrl') || urlParams.get('api_url');
      const tokenParam = urlParams.get('token');
      const statusParam = urlParams.get('status');

      if (mockParam === 'false' || modeParam === 'live') {
        urlOverrides.mode = 'live';
      } else if (mockParam === 'true' || modeParam === 'mock') {
        urlOverrides.mode = 'mock';
      }

      if (apiUrlParam) urlOverrides.apiUrl = apiUrlParam;
      if (tokenParam) urlOverrides.token = tokenParam;
      if (statusParam) {
        if (statusParam === '1c-offline') urlOverrides.mock1cStatus = 'offline';
        if (statusParam === 'server-offline') urlOverrides.mockServerStatus = 'offline';
      }
    }

    return { ...defaults, ...stored, ...urlOverrides, ...overrides };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('sherpa_settings', JSON.stringify(this.settings));
      } catch (_) {}
    }
  }

  createServiceFromSettings() {
    const FactoryClass = (typeof globalThis !== 'undefined' && globalThis.SherpaServiceFactory) || (typeof window !== 'undefined' && window.SherpaServiceFactory);
    return FactoryClass ? FactoryClass.createService(this.settings, this.logger) : null;
  }

  initElements() {
    if (!this.container) return;

    this.feedElement = this.container.querySelector('#messageFeed');
    this.composerForm = this.container.querySelector('#composerForm');
    this.textarea = this.container.querySelector('#composerTextarea');
    this.sendButton = this.container.querySelector('#sendButton');
    this.resetButton = this.container.querySelector('#resetButton');
    this.attachButton = this.container.querySelector('#attachButton');
    this.fileInput = this.container.querySelector('#fileInput');
    this.attachmentPreviewBar = this.container.querySelector('#attachmentPreviewBar');
    this.selectedAttachments = [];
    this.presenceBadge = this.container.querySelector('.presence-badge');
    this.headerBadge = this.container.querySelector('#headerStatusBadge') || this.container.querySelector('.header-badge');
    this.errorBanner = this.container.querySelector('#errorBanner');
    this.errorMessage = this.container.querySelector('#errorMessage');
    this.retryButton = this.container.querySelector('#retryButton');

    // Settings Modal elements
    this.settingsButton = this.container.querySelector('#settingsButton');
    this.settingsBackdrop = this.container.querySelector('#settingsBackdrop');
    this.settingsModal = this.container.querySelector('#settingsModal');
    this.closeSettingsButton = this.container.querySelector('#closeSettingsButton');
    this.cancelSettingsButton = this.container.querySelector('#cancelSettingsButton');
    this.applySettingsButton = this.container.querySelector('#applySettingsButton');

    this.modeMockRadio = this.container.querySelector('#modeMockRadio');
    this.modeLiveRadio = this.container.querySelector('#modeLiveRadio');
    this.mockOptionsSection = this.container.querySelector('#mockOptionsSection');
    this.liveOptionsSection = this.container.querySelector('#liveOptionsSection');

    this.mock1cStatusSelect = this.container.querySelector('#mock1cStatusSelect');
    this.mockGlinerStatusSelect = this.container.querySelector('#mockGlinerStatusSelect');
    this.mockServerStatusSelect = this.container.querySelector('#mockServerStatusSelect');
    this.mockUserNameInput = this.container.querySelector('#mockUserNameInput');
    this.mockDelayRange = this.container.querySelector('#mockDelayRange');
    this.mockDelayValue = this.container.querySelector('#mockDelayValue');

    this.liveApiUrlInput = this.container.querySelector('#liveApiUrlInput');
    this.liveTokenInput = this.container.querySelector('#liveTokenInput');

    this.messageRenderModeSelect = this.container.querySelector('#messageRenderModeSelect');

    this.logConsole = this.container.querySelector('#logConsole');
    this.copyLogsBtn = this.container.querySelector('#copyLogsBtn');
    this.clearLogsBtn = this.container.querySelector('#clearLogsBtn');
  }

  attachEvents() {
    if (!this.container) return;

    if (this.composerForm) {
      this.composerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUserSubmit();
      });
    }

    if (this.textarea) {
      this.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserSubmit();
        }
      });

      this.textarea.addEventListener('input', () => {
        this.adjustTextareaHeight();
        this.updateSendButtonState();
      });

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => {
          this.adjustTextareaHeight();
        });
      }
    }

    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.resetConversation();
      });
    }

    if (this.attachButton && this.fileInput) {
      this.attachButton.addEventListener('click', () => {
        this.fileInput.click();
      });

      this.fileInput.addEventListener('change', (e) => {
        this.handleFileSelect(e.target.files);
      });
    }

    if (this.feedElement) {
      this.feedElement.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-chip]');
        if (chip) {
          const chipValue = chip.getAttribute('data-chip');
          this.handleChipClick(chipValue);
        }
      });
    }

    // Settings Modal events
    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', () => this.openSettingsModal());
    }
    if (this.closeSettingsButton) {
      this.closeSettingsButton.addEventListener('click', () => this.closeSettingsModal());
    }
    if (this.cancelSettingsButton) {
      this.cancelSettingsButton.addEventListener('click', () => this.closeSettingsModal());
    }
    if (this.applySettingsButton) {
      this.applySettingsButton.addEventListener('click', () => this.applySettingsFromModal());
    }
    if (this.settingsBackdrop) {
      this.settingsBackdrop.addEventListener('click', (e) => {
        if (e.target === this.settingsBackdrop) {
          this.closeSettingsModal();
        }
      });
    }

    if (this.modeMockRadio) {
      this.modeMockRadio.addEventListener('change', () => this.toggleSettingsSections());
    }
    if (this.modeLiveRadio) {
      this.modeLiveRadio.addEventListener('change', () => this.toggleSettingsSections());
    }

    if (this.mockDelayRange && this.mockDelayValue) {
      this.mockDelayRange.addEventListener('input', () => {
        this.mockDelayValue.textContent = `${this.mockDelayRange.value} мс`;
      });
    }

    if (this.copyLogsBtn) {
      this.copyLogsBtn.addEventListener('click', () => this.copyLogsToClipboard());
    }
    if (this.clearLogsBtn) {
      this.clearLogsBtn.addEventListener('click', () => {
        if (this.logger) this.logger.clear();
      });
    }
  }

  initLoggerSubscriber() {
    if (!this.logger) return;
    this.logger.subscribe((entry, logs) => {
      this.renderLogsConsole(logs);
    });
  }

  renderLogsConsole(logs) {
    if (!this.logConsole) return;
    if (!logs || logs.length === 0) {
      this.logConsole.innerHTML = '<div class="log-empty">Журнал событий пуст</div>';
      return;
    }

    const html = logs.map((l) => {
      const levelClass = l.level ? ` log-level-${l.level}` : '';
      const tagClass = l.tag ? ` log-tag-${l.tag.toLowerCase()}` : '';
      const dataStr = l.data ? `<span class="log-data"> ${this.escapeHtml(JSON.stringify(l.data))}</span>` : '';
      return `<div class="log-line${levelClass}">` +
        `<span class="log-time">[${l.timeStr}]</span> ` +
        `<span class="log-tag${tagClass}">[${l.tag}]</span> ` +
        `<span class="log-msg">${this.escapeHtml(l.message)}</span>` +
        `${dataStr}</div>`;
    }).join('');

    this.logConsole.innerHTML = html;
    this.logConsole.scrollTop = this.logConsole.scrollHeight;
  }

  copyLogsToClipboard() {
    if (!this.logger) return;
    const text = this.logger.getFormattedText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopyLogsSuccess();
      }).catch(() => {
        this.fallbackCopyLogs(text);
      });
    } else {
      this.fallbackCopyLogs(text);
    }
  }

  fallbackCopyLogs(text) {
    const doc = typeof document !== 'undefined' ? document : (typeof globalThis !== 'undefined' && globalThis.document ? globalThis.document : null);
    if (!doc || !doc.body) return;
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    try {
      doc.execCommand('copy');
      this.showCopyLogsSuccess();
    } catch (_) {}
    doc.body.removeChild(ta);
  }

  showCopyLogsSuccess() {
    if (!this.copyLogsBtn) return;
    const span = this.copyLogsBtn.querySelector('span');
    if (!span) return;
    const oldText = span.textContent;
    span.textContent = 'Скопировано!';
    this.copyLogsBtn.classList.add('success');
    setTimeout(() => {
      span.textContent = oldText;
      this.copyLogsBtn.classList.remove('success');
    }, 2000);
  }

  openSettingsModal() {
    if (!this.settingsBackdrop) return;

    // Fill controls from current settings
    if (this.settings.mode === 'live') {
      if (this.modeLiveRadio) this.modeLiveRadio.checked = true;
    } else {
      if (this.modeMockRadio) this.modeMockRadio.checked = true;
    }

    if (this.mock1cStatusSelect) this.mock1cStatusSelect.value = this.settings.mock1cStatus || 'online';
    if (this.mockGlinerStatusSelect) this.mockGlinerStatusSelect.value = this.settings.mockGlinerStatus || 'online';
    if (this.mockServerStatusSelect) this.mockServerStatusSelect.value = this.settings.mockServerStatus || 'online';
    if (this.mockUserNameInput) this.mockUserNameInput.value = this.settings.userName || 'Илья';
    if (this.mockDelayRange) {
      this.mockDelayRange.value = this.settings.mockDelayMs ?? 400;
      if (this.mockDelayValue) this.mockDelayValue.textContent = `${this.mockDelayRange.value} мс`;
    }

    if (this.liveApiUrlInput) this.liveApiUrlInput.value = this.settings.apiUrl || '';
    if (this.liveTokenInput) this.liveTokenInput.value = this.settings.token || '';
    if (this.messageRenderModeSelect) this.messageRenderModeSelect.value = this.settings.messageRenderMode || 'markdown';

    this.toggleSettingsSections();
    if (this.logger) {
      this.renderLogsConsole(this.logger.getLogs());
    }

    this.settingsBackdrop.style.display = 'flex';
  }

  closeSettingsModal() {
    if (this.settingsBackdrop) {
      this.settingsBackdrop.style.display = 'none';
    }
  }

  toggleSettingsSections() {
    const isLive = this.modeLiveRadio && this.modeLiveRadio.checked;
    if (this.mockOptionsSection) {
      this.mockOptionsSection.style.display = isLive ? 'none' : 'block';
    }
    if (this.liveOptionsSection) {
      this.liveOptionsSection.style.display = isLive ? 'block' : 'none';
    }
  }

  applySettingsFromModal() {
    const isLive = this.modeLiveRadio && this.modeLiveRadio.checked;
    const newSettings = {
      mode: isLive ? 'live' : 'mock',
      mock1cStatus: this.mock1cStatusSelect ? this.mock1cStatusSelect.value : 'online',
      mockGlinerStatus: this.mockGlinerStatusSelect ? this.mockGlinerStatusSelect.value : 'online',
      mockServerStatus: this.mockServerStatusSelect ? this.mockServerStatusSelect.value : 'online',
      userName: (this.mockUserNameInput && this.mockUserNameInput.value.trim()) ? this.mockUserNameInput.value.trim() : 'Илья',
      mockDelayMs: this.mockDelayRange ? parseInt(this.mockDelayRange.value, 10) : 400,
      apiUrl: (this.liveApiUrlInput && this.liveApiUrlInput.value.trim()) ? this.liveApiUrlInput.value.trim() : 'http://localhost:8000',
      token: this.liveTokenInput ? this.liveTokenInput.value.trim() : '',
      messageRenderMode: this.messageRenderModeSelect ? this.messageRenderModeSelect.value : 'markdown'
    };

    this.saveSettings(newSettings);
    if (this.logger) {
      this.logger.log('info', 'SYS', 'Параметры обновлены из UI модального окна', newSettings);
    }

    this.closeSettingsModal();
    this.restartAppWithNewSettings();
  }

  restartAppWithNewSettings() {
    this.service = this.createServiceFromSettings();
    this.conversationId = (this.service && typeof this.service.generateUuid === 'function')
      ? this.service.generateUuid()
      : 'c-' + Math.random().toString(36).substring(2, 9);
    this.messages = [];
    this.selectedAttachments = [];
    this.renderAttachmentBar();
    if (this.feedElement) {
      this.feedElement.innerHTML = '';
    }
    this.loadInitialGreeting();
  }

  adjustTextareaHeight() {
    if (!this.textarea) return;

    const isEmpty = !this.textarea.value;
    if (isEmpty && this.textarea.placeholder) {
      this.textarea.value = this.textarea.placeholder;
    }

    this.textarea.style.height = 'auto';
    const scrollH = this.textarea.scrollHeight;

    if (isEmpty && this.textarea.placeholder) {
      this.textarea.value = '';
    }

    const isMultiline = scrollH > 32;

    if (this.composerForm) {
      this.composerForm.classList.toggle('multiline', isMultiline);
    }

    if (isMultiline) {
      const newHeight = Math.min(scrollH, 140);
      this.textarea.style.height = `${newHeight}px`;
      this.textarea.style.overflowY = scrollH > 140 ? 'auto' : 'hidden';
    } else {
      this.textarea.style.height = '24px';
      this.textarea.style.overflowY = 'hidden';
    }
  }

  updateSendButtonState() {
    if (!this.sendButton || !this.textarea) return;
    const hasText = this.textarea.value.trim().length > 0;
    const hasAttachments = this.selectedAttachments.length > 0;
    this.sendButton.disabled = this.isBusy || this.isConnecting || (!hasText && !hasAttachments);
  }

  updateInputControlsState() {
    this.updateSendButtonState();
    if (this.textarea) {
      this.textarea.disabled = this.isBusy || this.isConnecting;
    }
    if (this.attachButton) {
      this.attachButton.disabled = this.isBusy || this.isConnecting;
    }
  }

  updatePresenceStatus(status = 'online') {
    const isOnline = status === 'online';
    if (this.presenceBadge) {
      this.presenceBadge.classList.toggle('online', isOnline);
      this.presenceBadge.classList.toggle('offline', !isOnline);
      this.presenceBadge.title = isOnline ? 'Оркестратор ассистента в сети' : 'Нет связи с оркестратором ассистента';
    }
  }

  renderServiceTags(services = []) {
    if (!this.headerBadge) return;
    let badgeContainer = this.headerBadge;
    if (!badgeContainer.classList.contains('header-service-tags')) {
      badgeContainer.classList.add('header-service-tags');
    }

    if (!Array.isArray(services) || services.length === 0) {
      badgeContainer.innerHTML = '';
      return;
    }

    const tagsHtml = services.map((s) => {
      const sId = (s.id || s.name || '').toLowerCase();
      const sName = s.name || (sId.includes('1c') ? '1C CRM' : sId.includes('gliner') ? 'GliNER' : s.id);
      return `<span class="service-tag gray-tag" data-service-id="${this.escapeHtml(s.id)}">${this.escapeHtml(sName)}</span>`;
    }).join(' ');

    badgeContainer.innerHTML = tagsHtml;
  }

  updatePlaceholder(text) {
    if (!this.textarea || !text) return;
    this.textarea.placeholder = text;
    this.adjustTextareaHeight();
  }

  async loadInitialGreeting() {
    this.isConnecting = true;
    this.updateInputControlsState();
    this.updatePresenceStatus('offline');
    this.renderServiceTags([]);

    // Удаляем предыдущие системные плашки ошибок сети, чтобы они не накапливались в ленте
    this.removeSystemErrorMessages();

    const connectingMessageId = 'msg-connecting-' + Date.now();
    this.appendMessageBubble({
      id: connectingMessageId,
      sender: 'assistant',
      text: 'Подключение к ассистенту Sherpa...',
      isTyping: true,
      created_at: new Date().toISOString()
    });

    try {
      const greeting = await this.service.getGreeting(this.settings.userName);

      this.isConnecting = false;
      this.updatePresenceStatus('online');

      if (greeting.services) {
        this.renderServiceTags(greeting.services);
      }
      if (greeting.placeholder) {
        this.updatePlaceholder(greeting.placeholder);
      }

      this.replaceTypingWithContent(connectingMessageId, {
        id: greeting.id,
        text: greeting.text,
        suggestions: greeting.suggestions || [],
        created_at: greeting.created_at
      });
    } catch (err) {
      this.isConnecting = false;
      this.updatePresenceStatus('offline');
      this.renderServiceTags([]);

      const systemMsgText = `**Сбой подключения к оркестратору ассистента.**
${this.escapeHtml(err.message || 'Ошибка сети.')}

[! Повторить попытку подключения](cmd:! Повторить)`;

      this.replaceTypingWithContent(connectingMessageId, {
        id: 'msg-sys-error-' + Date.now(),
        sender: 'system',
        text: systemMsgText,
        created_at: new Date().toISOString()
      });
    } finally {
      this.updateInputControlsState();
      if (this.textarea) {
        this.textarea.focus();
      }
    }
  }

  removeSystemErrorMessages() {
    if (!this.feedElement) return;
    const sysErrorRows = this.feedElement.querySelectorAll('.message-row.system');
    sysErrorRows.forEach((row) => {
      const msgId = row.getAttribute('data-message-id');
      if (msgId) {
        this.removeMessageBubble(msgId);
      } else {
        row.remove();
      }
    });
  }

  removeMessageBubble(messageId) {
    if (!this.feedElement) return;
    const bubbleEl = this.feedElement.querySelector(`[data-message-id="${messageId}"]`);
    if (bubbleEl) {
      bubbleEl.remove();
    }
    this.messages = this.messages.filter((m) => m.id !== messageId);
  }

  handleFileSelect(files) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      this.selectedAttachments.push({
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        fileObj: file
      });
    });

    if (this.fileInput) {
      this.fileInput.value = '';
    }

    this.renderAttachmentBar();
    this.updateSendButtonState();
  }

  removeAttachment(attId) {
    this.selectedAttachments = this.selectedAttachments.filter((a) => a.id !== attId);
    this.renderAttachmentBar();
    this.updateSendButtonState();
  }

  renderAttachmentBar() {
    if (!this.attachmentPreviewBar) return;

    if (this.selectedAttachments.length === 0) {
      this.attachmentPreviewBar.style.display = 'none';
      this.attachmentPreviewBar.innerHTML = '';
      return;
    }

    this.attachmentPreviewBar.style.display = 'flex';
    const html = this.selectedAttachments.map((att) => {
      return `<div class="attachment-chip" data-att-id="${att.id}">` +
        `<span class="att-icon">📎</span>` +
        `<span class="att-name">${this.escapeHtml(att.name)}</span>` +
        `<button type="button" class="attachment-chip-remove" data-remove-att="${att.id}" title="Удалить файл">×</button>` +
        `</div>`;
    }).join('');

    this.attachmentPreviewBar.innerHTML = html;

    const removeBtns = this.attachmentPreviewBar.querySelectorAll('[data-remove-att]');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-remove-att');
        this.removeAttachment(id);
      });
    });
  }

  async handleUserSubmit(overrideText = null) {
    if (this.isBusy || this.isConnecting) return;

    // Удаляем прошлые системные карточки ошибок при отправке повторного запроса
    this.removeSystemErrorMessages();

    let text = overrideText != null ? overrideText : (this.textarea ? this.textarea.value.trim() : '');
    const attachments = [...this.selectedAttachments];

    if (!text && attachments.length === 0) return;

    if (!text && attachments.length > 0) {
      text = 'прикрепил файл';
    }

    if (overrideText == null && this.textarea) {
      this.textarea.value = '';
      this.adjustTextareaHeight();
    }

    this.selectedAttachments = [];
    this.renderAttachmentBar();

    const userMessageId = 'msg-user-' + Date.now();
    const userMsgObj = {
      id: userMessageId,
      sender: 'user',
      text,
      attachments: attachments.map((a) => ({ name: a.name, size: a.size })),
      created_at: new Date().toISOString()
    };

    this.appendMessageBubble(userMsgObj);

    this.isBusy = true;
    this.updateInputControlsState();

    const typingId = 'msg-typing-' + Date.now();
    this.showTypingIndicator(typingId);

    try {
      const response = await this.service.sendMessage({
        conversation_id: this.conversationId,
        message: text,
        attachments: attachments.map((a) => ({ name: a.name, size: a.size, type: a.type }))
      });

      this.updatePresenceStatus('online');

      if (response.services) {
        this.renderServiceTags(response.services);
      }
      if (response.placeholder) {
        this.updatePlaceholder(response.placeholder);
      }

      this.replaceTypingWithContent(typingId, {
        id: response.id || ('msg-asst-' + Date.now()),
        text: response.text,
        suggestions: response.suggestions || [],
        created_at: response.created_at || new Date().toISOString()
      });
    } catch (err) {
      this.updatePresenceStatus(this.service.getStatus ? this.service.getStatus() : 'offline');

      const systemMsgText = `**Сбой обработки запроса.**
${this.escapeHtml(err.message || 'Ошибка взаимодействия с сервером.')}

[! Повторить запрос](cmd:! Повторить)`;

      this.replaceTypingWithContent(typingId, {
        id: 'msg-sys-err-' + Date.now(),
        sender: 'system',
        text: systemMsgText,
        created_at: new Date().toISOString()
      });
    } finally {
      this.isBusy = false;
      this.updateInputControlsState();
      if (this.textarea) {
        this.textarea.focus();
      }
    }
  }

  handleChipClick(chipValue) {
    if (this.isBusy || this.isConnecting) return;
    if (chipValue === '! Повторить' || chipValue === '! Повторить попытку подключения') {
      if (this.messages.length <= 1) {
        this.loadInitialGreeting();
      } else {
        const lastUserMsg = [...this.messages].reverse().find((m) => m.sender === 'user');
        if (lastUserMsg) {
          this.handleUserSubmit(lastUserMsg.text);
        } else {
          this.loadInitialGreeting();
        }
      }
      return;
    }

    this.handleUserSubmit(chipValue);
  }

  showTypingIndicator(typingId) {
    this.appendMessageBubble({
      id: typingId,
      sender: 'assistant',
      text: 'Sherpa думает...',
      isTyping: true,
      created_at: new Date().toISOString()
    });
  }

  hideTypingIndicator(typingId) {
    this.removeMessageBubble(typingId);
  }

  replaceTypingWithContent(typingId, data) {
    if (!this.feedElement) return;

    const rowDiv = this.feedElement.querySelector(`[data-message-id="${typingId}"]`);
    if (!rowDiv) {
      this.appendMessageBubble({
        id: data.id || ('msg-asst-' + Date.now()),
        sender: data.sender || 'assistant',
        text: data.text,
        suggestions: data.suggestions || [],
        created_at: data.created_at || new Date().toISOString()
      });
      return;
    }

    if (data.sender) {
      const isSystem = data.sender === 'system';
      const isUser = data.sender === 'user';
      rowDiv.className = `message-row ${isUser ? 'user' : isSystem ? 'system' : 'assistant'}`;
    }

    const wrapper = rowDiv.querySelector('.message-bubble-wrapper');
    if (!wrapper) return;

    if (data.id) {
      rowDiv.setAttribute('data-message-id', data.id);
    }

    const existingMsg = this.messages.find((m) => m.id === typingId);
    if (existingMsg) {
      existingMsg.id = data.id || typingId;
      existingMsg.text = data.text;
      existingMsg.isTyping = false;
      existingMsg.suggestions = data.suggestions || [];
    }

    wrapper.classList.add('transforming');

    setTimeout(() => {
      let parsedContent = '';
      if (this.settings.messageRenderMode === 'raw') {
        parsedContent = `<pre class="raw-message-text">${this.escapeHtml(data.text)}</pre>`;
      } else {
        parsedContent = this.parseMarkdown(data.text);
      }

      let innerHtml = `<div class="message-bubble">${parsedContent}</div>`;
      if (data.created_at) {
        const timeStr = new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        innerHtml += `<div class="message-meta"><span>${timeStr}</span></div>`;
      }

      wrapper.innerHTML = innerHtml;
      
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          wrapper.classList.remove('transforming');
          this.scrollToBottom();
        });
      } else {
        wrapper.classList.remove('transforming');
        this.scrollToBottom();
      }
    }, 100);
  }

  disablePreviousInteractiveButtons() {
    if (!this.feedElement) return;

    const interactiveSelectors = '.chip-button, .suggestion-chip, .option-card, .deal-card';
    const previousButtons = this.feedElement.querySelectorAll(interactiveSelectors);

    previousButtons.forEach((btn) => {
      // Исключаем только синтаксические кнопки «! Повторить» в сообщениях об ошибках сети
      const chipValue = btn.getAttribute('data-chip') || '';
      if (chipValue.startsWith('! Повторить')) return;

      btn.classList.add('disabled');
      btn.setAttribute('disabled', 'true');
    });
  }

  appendMessageBubble(msg) {
    if (!this.feedElement) return;

    // Затеняем и блокируем интерактивные кнопки в прошлых сообщениях
    if (msg.sender === 'user' || msg.sender === 'assistant') {
      this.disablePreviousInteractiveButtons();
    }

    this.messages.push(msg);

    const isUser = msg.sender === 'user';
    const isSystem = msg.sender === 'system';

    const doc = typeof document !== 'undefined' ? document : (typeof globalThis !== 'undefined' && globalThis.document ? globalThis.document : null);
    if (!doc) return;

    const rowDiv = doc.createElement('div');
    rowDiv.className = `message-row ${isUser ? 'user' : isSystem ? 'system' : 'assistant'}`;
    rowDiv.setAttribute('data-message-id', msg.id);

    let html = '';
    if (!isUser) {
      html += '<div class="message-avatar">SH</div>';
    }

    html += '<div class="message-bubble-wrapper">';

    if (msg.attachments && msg.attachments.length > 0) {
      html += '<div class="message-attachments">';
      msg.attachments.forEach((att) => {
        html += `<div class="message-attachment-chip">📎 <span>${this.escapeHtml(att.name)}</span></div>`;
      });
      html += '</div>';
    }

    if (msg.isTyping) {
      const labelText = msg.text ? msg.text.replace(/^●\s*/, '').replace(/\*/g, '').trim() : 'Sherpa думает...';
      html += `<div class="typing-indicator-bubble">` +
        `<span class="typing-label">${this.escapeHtml(labelText)}</span>` +
        `<span class="typing-dot"></span>` +
        `<span class="typing-dot"></span>` +
        `<span class="typing-dot"></span>` +
        `</div>`;
    } else {
      let parsedContent = '';
      if (isUser) {
        parsedContent = `<p>${this.escapeHtml(msg.text)}</p>`;
      } else if (this.settings.messageRenderMode === 'raw') {
        parsedContent = `<pre class="raw-message-text">${this.escapeHtml(msg.text)}</pre>`;
      } else {
        parsedContent = this.parseMarkdown(msg.text);
      }
      html += `<div class="message-bubble">${parsedContent}</div>`;
    }

    if (msg.created_at) {
      const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      html += `<div class="message-meta"><span>${timeStr}</span></div>`;
    }

    html += '</div>';
    rowDiv.innerHTML = html;

    this.feedElement.appendChild(rowDiv);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.feedElement) {
      if (typeof this.feedElement.scrollTo === 'function') {
        this.feedElement.scrollTo({
          top: this.feedElement.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        this.feedElement.scrollTop = this.feedElement.scrollHeight;
      }
    }
  }

  resetConversation() {
    this.conversationId = (this.service && typeof this.service.generateUuid === 'function')
      ? this.service.generateUuid()
      : 'c-' + Math.random().toString(36).substring(2, 9);
    this.messages = [];
    this.selectedAttachments = [];
    this.renderAttachmentBar();
    if (this.feedElement) {
      this.feedElement.innerHTML = '';
    }
    if (this.logger) {
      this.logger.log('info', 'SYS', 'Диалог сброшен. Начат новый сеанс');
    }
    this.loadInitialGreeting();
  }

  getMarkdownRenderer() {
    return (typeof globalThis !== 'undefined' && globalThis.MarkdownRenderer) || (typeof window !== 'undefined' && window.MarkdownRenderer);
  }

  escapeHtml(str) {
    const Renderer = this.getMarkdownRenderer();
    return Renderer ? Renderer.escapeHtml(str) : String(str || '');
  }

  parseMarkdown(text) {
    const Renderer = this.getMarkdownRenderer();
    return Renderer ? Renderer.render(text, {
      onUpdatePlaceholder: (p) => this.updatePlaceholder(p)
    }) : String(text || '');
  }

  formatInline(str) {
    const Renderer = this.getMarkdownRenderer();
    return Renderer ? Renderer.formatInline(str) : String(str || '');
  }
}

// Attach to globals for browser and node tests
if (typeof globalThis !== 'undefined') {
  globalThis.ChatLogger = ChatLogger;
  globalThis.HttpSherpaService = HttpSherpaService;
  globalThis.SherpaServiceFactory = SherpaServiceFactory;
  globalThis.MarkdownRenderer = MarkdownRenderer;
  globalThis.SherpaChatApp = SherpaChatApp;
}
if (typeof window !== 'undefined') {
  window.ChatLogger = ChatLogger;
  window.HttpSherpaService = HttpSherpaService;
  window.SherpaServiceFactory = SherpaServiceFactory;
  window.MarkdownRenderer = MarkdownRenderer;
  window.SherpaChatApp = SherpaChatApp;
}

if (typeof document !== 'undefined') {
  const initApp = () => {
    const container = document.querySelector('.chat-app-container') || document.body;
    if (typeof window !== 'undefined' && !window.sherpaApp) {
      window.sherpaApp = new SherpaChatApp({ container });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
