/**
 * Mock Service Provider for Sherpa Assistant
 * Conforms to contracts/api/sherpa-chat-api-v1.yaml
 * Implements full 5-step Sales Assistant & 1C CRM Workflow with GliNER NER service
 */

class MockSherpaService {
  constructor(options = {}) {
    this.delayMs = options.delayMs ?? 400;
    this.userName = options.userName ?? 'Илья';
    this.logger = options.logger ?? null;
    this.customServices = options.services ?? null;

    // Attached status (whether service module is connected to orchestrator)
    if (options.mock1cStatus === 'detached') {
      this.is1cAttached = false;
      this.is1cConnected = false;
    } else if (options.mock1cStatus === 'offline') {
      this.is1cAttached = true;
      this.is1cConnected = false;
    } else {
      this.is1cAttached = options.is1cAttached !== undefined ? Boolean(options.is1cAttached) : true;
      this.is1cConnected = options.is1cConnected !== undefined ? Boolean(options.is1cConnected) : true;
    }

    if (options.mockGlinerStatus === 'detached') {
      this.isGlinerAttached = false;
      this.isGlinerConnected = false;
    } else if (options.mockGlinerStatus === 'offline') {
      this.isGlinerAttached = true;
      this.isGlinerConnected = false;
    } else {
      this.isGlinerAttached = options.isGlinerAttached !== undefined ? Boolean(options.isGlinerAttached) : true;
      this.isGlinerConnected = options.isGlinerConnected !== undefined ? Boolean(options.isGlinerConnected) : true;
    }

    if (options.mockServerStatus === 'offline') {
      this.isServerConnected = false;
    } else {
      this.isServerConnected = options.isServerConnected !== undefined ? Boolean(options.isServerConnected) : true;
    }

    // Backward compatibility with status string
    if (options.status === '1c-offline') {
      this.is1cAttached = true;
      this.is1cConnected = false;
      this.isServerConnected = true;
    } else if (options.status === 'server-offline' || options.failNext === true) {
      this.isServerConnected = false;
    }

    this.pendingLinkDeal = null;
    this.lastLinkedDeal = null;
    this.lastAttachedFile = null;
    this.lastSuggestions = [];
    this.awaitingAmountChoice = false;
    this.awaitingCustomAmount = false;
    this.customDealAmount = null;

    if (this.logger) {
      this.logger.log('info', 'MOCK', `MockSherpaService инициализирован (1C: ${this.is1cAttached ? (this.is1cConnected ? 'Online' : 'Offline') : 'Detached'}, GliNER: ${this.isGlinerAttached ? (this.isGlinerConnected ? 'Online' : 'Offline') : 'Detached'}, Сервер: ${this.isServerConnected ? 'ON' : 'OFF'})`);
    }
  }

  resolveDeal(text) {
    const titles = {
      '#CRM-2026-0891': 'ПАО «Северсталь»',
      '#CRM-2026-0854': 'АО «ТрансНефть»',
      '#CRM-2026-0790': 'ООО «Газпром Автоматизация»'
    };
    const match = String(text || '').match(/#CRM-\d+-\d+/i);
    const number = match
      ? match[0].replace(/^#crm/i, '#CRM')
      : (this.pendingLinkDeal && this.pendingLinkDeal.number)
        || (this.lastLinkedDeal && this.lastLinkedDeal.number)
        || '#CRM-2026-0891';
    const title = titles[number]
      || (this.pendingLinkDeal && this.pendingLinkDeal.title)
      || (this.lastLinkedDeal && this.lastLinkedDeal.title)
      || number;
    return { number, title };
  }

  getServices() {
    if (Array.isArray(this.customServices)) {
      return this.customServices;
    }
    const services = [];
    if (this.is1cAttached) {
      services.push({
        id: '1c_crm',
        name: '1C CRM'
      });
    }
    if (this.isGlinerAttached) {
      services.push({
        id: 'gliner',
        name: 'GliNER'
      });
    }
    return services;
  }

  getStatus() {
    if (!this.isServerConnected) return 'server-offline';
    if (!this.is1cConnected) return '1c-offline';
    return 'full';
  }

  setStatus(status) {
    if (status === 'server-offline') {
      this.isServerConnected = false;
    } else if (status === '1c-offline') {
      this.isServerConnected = true;
      this.is1cAttached = true;
      this.is1cConnected = false;
    } else {
      this.isServerConnected = true;
      this.is1cAttached = true;
      this.is1cConnected = true;
    }
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Статус сервиса установлен: ${status}`);
    }
  }

  get failNext() {
    return !this.isServerConnected;
  }

  set failNext(val) {
    this.isServerConnected = !val;
  }

  setFailNext(shouldFail) {
    this.isServerConnected = !shouldFail;
  }

  set1cAttached(attached) {
    this.is1cAttached = Boolean(attached);
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Подключение модуля 1С CRM к оркестратору: ${this.is1cAttached ? 'Подключен' : 'Отключен'}`);
    }
  }

  set1cConnected(connected) {
    this.is1cConnected = Boolean(connected);
    if (connected) this.is1cAttached = true;
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Доступность 1С CRM в диалоге изменена: ${this.is1cConnected ? 'online' : 'offline'}`);
    }
  }

  setGlinerAttached(attached) {
    this.isGlinerAttached = Boolean(attached);
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Подключение модуля GliNER к оркестратору: ${this.isGlinerAttached ? 'Подключен' : 'Отключен'}`);
    }
  }

  setGlinerConnected(connected) {
    this.isGlinerConnected = Boolean(connected);
    if (connected) this.isGlinerAttached = true;
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Доступность GliNER в диалоге изменена: ${this.isGlinerConnected ? 'online' : 'offline'}`);
    }
  }

  setServerConnected(connected) {
    this.isServerConnected = Boolean(connected);
    if (this.logger) {
      this.logger.log('info', 'MOCK', `Статус сервера оркестратора изменен: ${this.isServerConnected ? 'online' : 'offline'}`);
    }
  }

  createOrchestratorUnavailableError() {
    if (this.logger) {
      this.logger.log('error', 'MOCK', 'Сервер оркестратора недоступен (500 LLM_SERVICE_UNAVAILABLE)');
    }
    const error = new Error('Сервис генерации ассистента временно недоступен (500). Попробуйте позже.');
    error.status = 500;
    error.code = 'LLM_SERVICE_UNAVAILABLE';
    return error;
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
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.logger) {
      this.logger.log('info', 'MOCK', `Генерация приветствия для: ${userName}`);
    }

    if (!this.isServerConnected) {
      throw this.createOrchestratorUnavailableError();
    }

    let replyText = '';
    let suggestions = [];
    let placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';

    if (this.is1cAttached && !this.is1cConnected) {
      replyText = `Привет! Я твой ассистент **Sherpa**.

⚠️ **Мне не удалось подключиться к 1С CRM**, функции ассистента будут ограничены.
Операции со сделками, базой контрагентов и защитой проектов в 1С временно недоступны.

Я по-прежнему готов проконсультировать вас по **каталогу продуктов**, реестру Минцифры и расчету лицензий.`;
      suggestions = [
        'Подбор СУБД для 1С',
        'Линейка Astra Linux',
        'Офисные пакеты МойОфис и Р7',
        'Повторить подключение к 1С'
      ];
      placeholder = 'Задайте вопрос по продуктам или реестру ПО...';
    } else if (this.isGlinerAttached && !this.isGlinerConnected) {
      replyText = `Привет, ${userName}! Я твой ассистент **Sherpa**.

⚠️ **Сервис распознавания сущностей GliNER временно недоступен.**
Автоматическое извлечение спецификаций из писем может потребовать ручного подтверждения параметров.

Я готов помочь вам с **1С CRM**, реестром отечественного ПО и консультациями:`;
      suggestions = [
        'Показать другие сделки',
        'Создать сделку в 1С',
        'Подбор СУБД для 1С'
      ];
      placeholder = 'Введите параметры сделки или выберите действие...';
    } else if (!this.is1cAttached && !this.isGlinerAttached) {
      replyText = `Привет, ${userName}! Я твой ассистент **Sherpa** (Автономный режим).

Я готов проконсультировать вас по **каталогу продуктов**, реестру отечественного ПО, правилам лицензирования и спецификациям.`;
      suggestions = [
        'Подбор СУБД для 1С',
        'Линейка Astra Linux',
        'Офисные пакеты МойОфис и Р7'
      ];
      placeholder = 'Задайте вопрос по продуктам или реестру ПО...';
    } else if (!this.is1cAttached) {
      replyText = `Привет, ${userName}! Я твой ассистент **Sherpa**.

Я помогу:
- **Получить данные из письма** (модель GliNER) и рассчитать черновик спецификации.
- **Проконсультировать по продуктам**, реестру отечественного ПО и правилам лицензирования.
- **Рассчитать спецификации** и партнерские скидки дистрибутора.

*(Модуль 1С CRM отключен в текущей конфигурации)*`;
      suggestions = [
        'Обработать открытое письмо',
        'Подбор СУБД для 1С',
        'Линейка Astra Linux'
      ];
      placeholder = 'Прикрепите письмо или запросите подбор ПО...';
    } else {
      replyText = `Привет, ${userName}! Я твой ассистент **Sherpa**.

Я помогу:
- **Получить данные из письма** (модель GliNER) и связать его со сделкой в **1С CRM**.
- **Проконсультировать по продуктам**, реестру отечественного ПО и правилам лицензирования.
- **Рассчитать спецификации** и проверить партнерские скидки дистрибутора.

Введите запрос или выберите действие ниже:`;
      suggestions = [
        'Обработать открытое письмо',
        'Показать другие сделки',
        'Создать сделку в 1С',
        'Подбор СУБД для 1С'
      ];
      placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';
    }

    const fullText = this.formatResponseText(replyText, suggestions, placeholder);

    return {
      id: this.generateUuid(),
      sender: 'assistant',
      text: fullText,
      services: this.getServices(),
      created_at: new Date().toISOString()
    };
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

  async sendMessage(request) {
    let text = (request.message || '').trim();

    // If input is a option/command index number (e.g. "1", "2", "3", "1.", "[1]"), resolve against lastSuggestions
    const numberMatch = text.match(/^\[?№?\s*([1-9]\d*)\s*\]?\.?$/);
    if (numberMatch && Array.isArray(this.lastSuggestions) && this.lastSuggestions.length > 0 && !this.awaitingCustomAmount && !this.awaitingAmountChoice) {
      const index = parseInt(numberMatch[1], 10) - 1;
      if (index >= 0 && index < this.lastSuggestions.length) {
        const rawSuggestion = this.lastSuggestions[index];
        const commandText = this.extractSuggestionCommandText(rawSuggestion);
        if (commandText) {
          text = commandText;
        }
      }
    }

    const lowerText = text.toLowerCase();
    const conversationId = request.conversation_id || this.generateUuid();

    if (this.logger) {
      this.logger.log('info', 'USER', `Запрос: "${text}"`, { conversation_id: conversationId });
    }

    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (!this.isServerConnected) {
      throw this.createOrchestratorUnavailableError();
    }

    let replyText = '';
    let suggestions = [];
    let placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';

    const hasAttachments = Array.isArray(request.attachments) && request.attachments.length > 0;
    const attachmentName = hasAttachments && request.attachments[0] && request.attachments[0].name ? request.attachments[0].name : '';

    const isExplicitProcessRequest = lowerText.includes('обработать') || lowerText.includes('извлечь');

    // 1. Повторное подключение к 1С или GliNER
    if (lowerText.includes('повторить подключение к 1с') || lowerText.includes('подключить 1с')) {
      this.is1cConnected = true;
      if (this.logger) {
        this.logger.log('info', '1C', 'Соединение с 1С CRM восстановлено');
      }
      replyText = `✅ **Подключение к 1С CRM успешно восстановлено!**\n\nАвторизован менеджер: **${this.userName}**.\nДоступны операции поиска сделок, привязки входящих писем и регистрации новых проектов.`;
      suggestions = [
        'Обработать открытое письмо',
        'Показать другие сделки',
        'Создать сделку в 1С'
      ];
      placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';
    } else if (lowerText.includes('подключить gliner') || lowerText.includes('включить gliner')) {
      this.isGlinerConnected = true;
      if (this.logger) {
        this.logger.log('info', 'GLINER', 'Сервис GliNER NER подключен');
      }
      replyText = `✅ **Сервис распознавания сущностей GliNER активен!**\n\nТеперь поддерживается интеллектуальное извлечение названий компаний, ИНН и списка программных продуктов из писем.`;
      suggestions = [
        'Обработать открытое письмо',
        'Показать другие сделки'
      ];
      placeholder = 'Прикрепите письмо или выберите действие...';
    }
    // 2. Обработка / извлечение данных из входящего письма или прикрепленного файла
    else if (hasAttachments && !isExplicitProcessRequest) {
      this.lastAttachedFile = attachmentName;
      replyText = `📎 **Получен файл:** **${attachmentName}**\n\nФайл принят как входящее письмо. Желаете обработать спецификацию с помощью GliNER и проверить совпадения в 1С CRM?`;
      suggestions = [
        '!Обработать прикрепленное письмо => Обработать прикрепленное письмо',
        'Отмена'
      ];
      placeholder = 'Подтвердите обработку файла или выберите действие...';
    } else if (hasAttachments || this.lastAttachedFile || isExplicitProcessRequest || lowerText.includes('письмо') || lowerText.includes('скрепк') || lowerText.includes('вложить') || lowerText.includes('файл')) {
      const activeFile = attachmentName || this.lastAttachedFile;
      this.lastAttachedFile = null;

      if (!this.isGlinerAttached) {
        if (this.logger) {
          this.logger.log('warn', 'GLINER', 'Сервис GliNER не подключен к оркестратору');
        }
        replyText = `⚠️ **Модуль распознавания сущностей GliNER не подключен.**

Автоматический разбор спецификаций из писем и прикрепленных файлов отключен в конфигурации оркестратора. Пожалуйста, введите параметры сделки (партнер, заказчик, состав ПО) вручную.`;
        suggestions = [
          'Подбор СУБД для 1С',
          'Линейка Astra Linux'
        ];
        placeholder = 'Введите параметры сделки вручную...';
      } else if (!this.isGlinerConnected) {
        if (this.logger) {
          this.logger.log('warn', 'GLINER', 'Сервис GliNER выключен, автоматический NER невозможен');
        }
        replyText = `⚠️ **Сервис GliNER временно отключен.**

Автоматическое извлечение именованных сущностей (NER) из прикрепленного файла или письма невозможно. Пожалуйста, введите параметры сделки (партнер, заказчик, состав ПО) вручную или включите GliNER в параметрах.`;
        suggestions = [
          'Подключить GliNER',
          'Показать другие сделки',
          'Подбор СУБД для 1С'
        ];
        placeholder = 'Введите параметры сделки вручную (партнер, заказчик, ПО)...';
      } else if (!this.is1cAttached) {
        if (this.logger) {
          this.logger.log('info', 'GLINER', 'Сущности успешно извлечены через GliNER (1C CRM модуль не подключен)');
        }
        const sourceDoc = activeFile ? `прикрепленного файла **${activeFile}**` : 'открытого письма';
        replyText = `### 📨 Черновик спецификации (Распознано GliNER)

Из ${sourceDoc} нейросетевой моделью извлечены сущности:
- **Партнер (покупатель):** ООО «Системные Решения» (ИНН 7701234567)
- **Конечный заказчик:** ПАО «Северсталь» (ИНН 3528000597)
- **Состав спецификации:** Postgres Pro Enterprise (2 шт.), Astra Linux SE Server (4 шт.)
- **Оценка бюджета:** ~ 3 150 000 ₽

*(Модуль 1С CRM отключен в конфигурации, привязка к базе 1С недоступна)*`;
        suggestions = [
          'Подбор СУБД для 1С',
          'Линейка Astra Linux',
          'Офисные пакеты МойОфис и Р7'
        ];
        placeholder = 'Задайте вопрос по спецификации или каталогу ПО...';
      } else if (!this.is1cConnected) {
        if (this.logger) {
          this.logger.log('info', 'GLINER', 'Сущности успешно извлечены через GliNER (1C CRM offline)');
        }
        const sourceDoc = activeFile ? `прикрепленного файла **${activeFile}**` : 'открытого письма';
        replyText = `### 📨 Черновик спецификации (Распознано GliNER)

Из ${sourceDoc} нейросетевой моделью извлечены сущности:
- **Партнер (покупатель):** ООО «Системные Решения» (ИНН 7701234567)
- **Конечный заказчик:** ПАО «Северсталь» (ИНН 3528000597)
- **Состав спецификации:** Postgres Pro Enterprise (2 шт.), Astra Linux SE Server (4 шт.)
- **Оценка бюджета:** ~ 3 150 000 ₽

⚠️ **Внимание:** Так как связь с 1С CRM отсутствует, связать письмо со сделкой или создать проект в базе сейчас невозможно. Восстановите подключение к 1С для записи.`;
        suggestions = [
          'Повторить подключение к 1С',
          'Подбор СУБД для 1С',
          'Линейка Astra Linux'
        ];
        placeholder = 'Задайте вопрос по спецификации или каталогу ПО...';
      } else {
        if (this.logger) {
          this.logger.log('info', 'GLINER', 'Сущности извлечены через GliNER');
          this.logger.log('info', '1C', 'Поиск совпадений в базе 1С CRM: найдена сделка #CRM-2026-0891');
        }
        const sourceDocText = activeFile ? `из прикрепленного файла **${activeFile}**` : 'из письма';
        replyText = `● Анализ завершён

Я извлёк данные ${sourceDocText} и проверил CRM.

:::facts
- **Организация** :: ООО «Системные Решения»
- **Конечный заказчик** :: ПАО «Северсталь»
- **Вендоры** :: Postgres Professional, Группа Астра
- **Оценка бюджета** :: ~ 3 150 000 ₽
:::

Найдена похожая активная сделка:

:::deal-card
**#CRM-2026-0891 — ПАО «Северсталь»** :: 91% совпадение
ООО «Системные Решения» · 3 150 000 ₽ · Подготовка КП
Совпадают партнёр и продукт · сумма отличается на 8% · сделка создана 5 дней назад
:::

Как поступить?`;

        suggestions = [
          '!Связать со сделкой #CRM-2026-0891 => Связать с найденной сделкой',
          'Показать другие сделки',
          'Создать новую сделку'
        ];
        placeholder = 'Введите номер сделки для поиска или выберите действие...';
      }
    }
    // 3. Показать другие / топ активных сделок партнера
    else if (lowerText.includes('другие сделки') || lowerText.includes('показать сделки') || lowerText.includes('список сделок')) {
      if (!this.is1cAttached) {
        replyText = `⚠️ **Интеграция с 1С CRM отключена в конфигурации ассистента.** Модуль 1С не подключен к данному контуру.`;
        suggestions = ['Подбор СУБД для 1С', 'Линейка Astra Linux'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else if (!this.is1cConnected) {
        replyText = `⚠️ **1С CRM недоступна.** Список активных сделок партнера не может быть загружен из базы.`;
        suggestions = ['Повторить подключение к 1С', 'Подбор СУБД для 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else {
        replyText = `Для ООО «Системные Решения» найдены ещё две активные сделки:

:::deal-card
[**1. #CRM-2026-0854 — АО «ТрансНефть»**](cmd:Связать со сделкой #CRM-2026-0854) :: 71% совпадение
1 420 000 ₽ · Переговоры
:::

:::deal-card
[**2. #CRM-2026-0790 — ООО «Газпром Автоматизация»**](cmd:Связать со сделкой #CRM-2026-0790) :: 38% совпадение
5 800 000 ₽ · Согласование
:::`;

        suggestions = [
          'Связать со сделкой #CRM-2026-0854',
          'Связать со сделкой #CRM-2026-0790',
          'Создать новую сделку'
        ];
        placeholder = 'Выберите сделку или оформите новый проект...';
      }
    }
    // 4a. Запрос подтверждения связывания
    else if (lowerText.includes('связать со сделкой') || lowerText.includes('связать с найденной')) {
      if (!this.is1cAttached) {
        replyText = `⚠️ **Интеграция с 1С CRM отключена.** Модуль 1С не подключен к данному контуру.`;
        suggestions = ['Подбор СУБД для 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else if (!this.is1cConnected) {
        replyText = `⚠️ Ошибка: невозможно связать сделку в 1С CRM — отсутствует соединение.`;
        suggestions = ['Повторить подключение к 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else {
        const deal = this.resolveDeal(text);
        this.pendingLinkDeal = deal;
        replyText = `Связать открытое письмо со сделкой **${deal.title}**?`;
        suggestions = [
          '!Связать => Связать и обновить',
          'Отмена'
        ];
        placeholder = 'Подтвердите связывание или нажмите «Отмена»...';
      }
    }
    // 4b. Подтверждение связывания
    else if (lowerText.includes('связать и обновить') || lowerText === 'связать') {
      if (!this.is1cAttached) {
        replyText = `⚠️ **Интеграция с 1С CRM отключена.** Модуль 1С не подключен к данному контуру.`;
        suggestions = ['Подбор СУБД для 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else if (!this.is1cConnected) {
        replyText = `⚠️ Ошибка: невозможно связать сделку в 1С CRM — отсутствует соединение.`;
        suggestions = ['Повторить подключение к 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else {
        const deal = this.pendingLinkDeal || this.resolveDeal(text);
        this.pendingLinkDeal = null;
        this.lastLinkedDeal = deal;
        if (this.logger) {
          this.logger.log('info', '1C', `Письмо успешно привязано к сделке ${deal.number}`);
        }
        replyText = `✓ **Готово**\n\nПисьмо связано со сделкой **${deal.number}**, данные сделки обновлены.`;
        suggestions = ['Открыть сделку в CRM => Открыть сделку'];
        placeholder = 'Откройте сделку в CRM или задайте следующий вопрос...';
      }
    }
    // 4c. Отмена связывания
    else if ((lowerText === 'отмена' || lowerText === 'отменить') && !this.awaitingCustomAmount && !this.awaitingAmountChoice) {
      this.pendingLinkDeal = null;
      replyText = 'Хорошо. Я ничего не изменил. Можете задать другой вопрос в свободной форме.';
      suggestions = ['Показать другие сделки', 'Обработать открытое письмо'];
      placeholder = 'Задайте вопрос или выберите действие...';
    }
    // 4d. Открыть сделку в CRM
    else if (lowerText.includes('открыть сделку')) {
      const deal = this.resolveDeal(text);
      replyText = `📋 **Навигационная ссылка 1С (кликните для копирования):**\n\n\`e1cib/data/Документ.Сделка?ref=891ab45c-1234-5678-90ab-cdef12345678\`\n\nСделка **${deal.number}** откроется в 1С:Предприятие по этой ссылке (**Ctrl + G**).`;
      suggestions = [
        'Обработать открытое письмо',
        'Показать другие сделки'
      ];
      placeholder = 'Вставьте ссылку в 1С или задайте следующий вопрос...';
    }
    // 5. Создание новой сделки (Шаг выбора метода суммы)
    else if (lowerText.includes('создать сделку') || lowerText.includes('создать новую сделку') || lowerText.includes('новая сделка') || lowerText.includes('изменить сумму')) {
      if (!this.is1cAttached) {
        replyText = `⚠️ **Интеграция с 1С CRM отключена.** Модуль 1С не подключен к данному контуру.`;
        suggestions = ['Подбор СУБД для 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else if (!this.is1cConnected) {
        replyText = `⚠️ **1С CRM недоступна.** Создание документов в базе заблокировано.`;
        suggestions = ['Повторить подключение к 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else {
        this.awaitingAmountChoice = true;
        this.awaitingCustomAmount = false;
        replyText = `### 📝 Регистрация новой сделки в 1С CRM

Параметры извлечены из контекста письма:
- **Партнер (покупатель):** ООО «Системные Решения» (ИНН 7701234567)
- **Конечный заказчик:** ПАО «Северсталь» (ИНН 3528000597)
- **Ответственный менеджер:** ${this.userName}

Укажите плановую сумму сделки или выберите из предложенных вариантов:`;

        suggestions = [
          'Сумма 1 000 000 ₽',
          'Сумма 10 000 000 ₽',
          'Ввести сумму вручную',
          'Отмена'
        ];
        placeholder = 'Выберите вариант суммы (1-4) или нажмите «Ввести сумму вручную»...';
      }
    }
    // 5a. Отмена ввода суммы сделки
    else if ((this.awaitingAmountChoice || this.awaitingCustomAmount) && (
      lowerText === '4' ||
      lowerText === '4.' ||
      lowerText === '4)' ||
      lowerText === '[4]' ||
      lowerText === 'отмена' ||
      lowerText.includes('отмена') ||
      lowerText.includes('отменить') ||
      lowerText.includes('назад')
    )) {
      this.awaitingAmountChoice = false;
      this.awaitingCustomAmount = false;
      this.customDealAmount = null;

      if (this.logger) {
        this.logger.log('info', '1C', 'Ввод суммы и создание новой сделки отменены пользователем');
      }

      replyText = 'Ввод суммы и создание новой сделки отменены. Чем могу помочь?';
      suggestions = [
        'Показать активные сделки 1С',
        'Обработать открытое письмо',
        'Подбор СУБД для 1С'
      ];
      placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';
    }
    // 5b. Запрос на ввод суммы вручную (Вариант 3 или "Ввести сумму вручную")
    else if (this.awaitingAmountChoice && (
      lowerText === '3' ||
      lowerText === '3.' ||
      lowerText === '3)' ||
      lowerText === '[3]' ||
      lowerText.includes('ввести сумму') ||
      lowerText.includes('вручную')
    )) {
      this.awaitingAmountChoice = false;
      this.awaitingCustomAmount = true;

      replyText = `Пожалуйста, введите плановую сумму сделки числом (например, **2 500 000**):`;
      suggestions = [
        'Отмена'
      ];
      placeholder = 'Введите сумму числом вручную (например, 2500000)...';
    }
    // 5c. Обработка ввода пользовательской суммы сделки (пресеты 1/2 или ввод числа)
    else if ((this.awaitingAmountChoice || this.awaitingCustomAmount) && !lowerText.startsWith('подтвердить')) {
      let parsedAmount = null;

      if (this.awaitingAmountChoice && (lowerText === '1' || lowerText === '1.' || lowerText === '1)' || lowerText.includes('1 000 000') || lowerText.includes('1000000') || lowerText.includes('1 млн'))) {
        parsedAmount = 1000000;
      } else if (this.awaitingAmountChoice && (lowerText === '2' || lowerText === '2.' || lowerText === '2)' || lowerText.includes('10 000 000') || lowerText.includes('10000000') || lowerText.includes('10 млн'))) {
        parsedAmount = 10000000;
      } else if (this.awaitingCustomAmount) {
        const match = text.match(/(\d[\d\s._]*\d|\d+)/);
        if (match) {
          const rawDigits = match[1].replace(/[\s._]/g, '');
          const val = parseInt(rawDigits, 10);
          if (!isNaN(val) && val > 0) parsedAmount = val;
        }
      }

      if (parsedAmount !== null) {
        this.customDealAmount = parsedAmount;
        this.awaitingAmountChoice = false;
        this.awaitingCustomAmount = false;

        const formattedAmount = String(parsedAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        replyText = `Принято! Сумма сделки установлена: **${formattedAmount} ₽**.

Для завершения регистрации подтвердите плановые параметры сделки:`;

        suggestions = [
          `Подтвердить: Сделка Q3, ${formattedAmount} ₽`,
          'Срочная сделка: этот месяц, 95%',
          'Изменить сумму',
          'Отмена'
        ];
        placeholder = 'Подтвердите параметры создания сделки...';
      }
    }
    // 6. Подтверждение создания новой сделки
    else if (lowerText.includes('подтвердить:') || lowerText.includes('срочная сделка') || lowerText.includes('вероятность')) {
      this.awaitingCustomAmount = false;
      if (!this.is1cAttached || !this.is1cConnected) {
        replyText = `⚠️ Ошибка: соединение с 1С отсутствует или модуль 1С отключен.`;
        suggestions = ['Повторить подключение к 1С'];
        placeholder = 'Задайте вопрос по каталогу ПО...';
      } else {
        const isUrgent = lowerText.includes('срочн') || lowerText.includes('95%');
        const quarterStr = isUrgent ? 'Август 2026 (Срочная)' : 'Конец III квартала 2026';
        const probStr = isUrgent ? '95%' : '80%';
        const dealAmount = this.customDealAmount || 3150000;
        const formattedAmount = String(dealAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

        if (this.logger) {
          this.logger.log('info', '1C', `Сформирован и записан новый документ #CRM-2026-1044 на сумму ${formattedAmount} ₽`);
        }

        replyText = `🎉 **Новая сделка #CRM-2026-1044 успешно создана в 1С CRM!**

| Параметр | Значение |
| :--- | :--- |
| **Номер документа** | **#CRM-2026-1044** |
| **Партнер / Заказчик** | ООО «Системные Решения» → ПАО «Северсталь» |
| **Сумма / Вероятность** | **${formattedAmount} ₽** (${probStr}) |
| **Плановый срок закрытия** | ${quarterStr} |
| **Защита проекта (Deal Reg)** | ✅ Зарегистрировано у вендоров (Astra, Postgres Pro) |

📋 **Навигационная ссылка 1С (кликните для копирования):**
\`e1cib/data/Документ.Сделка?ref=1044ff88-99aa-44bb-88cc-0123456789ab\``;

        suggestions = [
          'Обработать открытое письмо',
          'Показать другие сделки'
        ];
        placeholder = 'Сделка зарегистрирована. Введите следующий запрос...';
      }
    }
    // 8. Консультации по СУБД
    else if (lowerText.includes('субд') || lowerText.includes('баз') || lowerText.includes('oracle') || lowerText.includes('postgres')) {
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
        'Обработать открытое письмо'
      ];
      placeholder = 'Уточните редакции, количество сокетов или введите запрос...';
    }
    // 9. Консультации по ОС
    else if (lowerText.includes('ос') || lowerText.includes('linux') || lowerText.includes('астра') || lowerText.includes('windows') || lowerText.includes('ред ос') || lowerText.includes('альт')) {
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

Нужно ли сформировать спецификацию для сделки?`;

      suggestions = [
        'Показать прайс-лист на Astra Linux SE 1.7',
        'Создать сделку в 1С',
        'Обработать открытое письмо'
      ];
      placeholder = 'Уточните количество лицензий ОС или задайте вопрос...';
    }
    // 10. Консультации по 1С
    else if (lowerText.includes('1с') || lowerText.includes('итс') || lowerText.includes('клиент-сервер')) {
      replyText = `Информация по линейке **1С:Предприятие 8**:

- **Серверные лицензии:**
  - *1С:Предприятие 8.3 ПРОФ* — ограничение до 12 ядер на рабочий процесс.
  - *1С:Предприятие 8.3 КОРП* — неограниченная масштабируемость, фоновое обновление, мониторинг кластера.
- **Клиентские лицензии:** на 1, 5, 10, 20, 50, 100, 300, 500 р.м.
- **Сервисы сопровождения:** 1С:КП ПРОФ / 1С:КП Базовый.

Уточните, требуется поставка электронных поставок (ESD) или коробочных версий?`;

      suggestions = [
        'Подобрать лицензии 1С на 50 рабочих мест',
        'Создать сделку в 1С',
        'Обработать открытое письмо'
      ];
      placeholder = 'Укажите количество рабочих мест 1С или тип лицензии...';
    }
    // 11. Консультации по офису
    else if (lowerText.includes('офис') || lowerText.includes('мойофис') || lowerText.includes('р7')) {
      replyText = `Отечественные **офисные пакеты** для корпоративной замены Microsoft 365 / Office:

| Решение | Редакции | Облачное хранилище | Корпоративная почта |
| :--- | :--- | :--- | :--- |
| **Р7-Офис** | Десктоп, Сервер документов, Профессиональный | Поддерживается | Р7-Почта / Корпоративный сервер |
| **МойОфис** | Стандартный, Профессиональный, Частное облако | МойОфис Документы | Mailion / МойОфис Почта |

Оба продукта имеют 100% совместимость с форматами \`.docx\`, \`.xlsx\`, \`.pptx\`.`;

      suggestions = [
        'Запросить триал-ключи Р7-Офис для клиента',
        'Создать сделку в 1С',
        'Обработать открытое письмо'
      ];
      placeholder = 'Укажите количество пользователей офисного пакета...';
    }
    // Fallback общий (если предложение не является известной командой или ее номером)
    else {
      replyText = `Я вас не понял.

Я готов помочь вам с оформлением сделок и подбором ПО:

- **Обработка писем Outlook** и привязка к сделке в 1С CRM.
- **Регистрация новых сделок** и проектов дистрибутора.
- **Подбор ПО из реестра Минцифры** (СУБД, ОС, офисный софт, 1С).
- **Сравнение редакций и расчет спецификаций**.

Выберите команду ниже или задайте вопрос в свободной форме:`;

      suggestions = [
        'Обработать открытое письмо',
        'Показать другие сделки',
        'Создать сделку в 1С',
        'Подбор СУБД для 1С'
      ];
      placeholder = 'Спросите о сделках 1С, обработайте письмо или запросите подбор ПО...';
    }

    if (this.logger) {
      this.logger.log('info', 'ASSISTANT', `Ответ сформирован (${replyText.length} симв.)`, { suggestionsCount: suggestions.length });
    }

    const fullText = this.formatResponseText(replyText, suggestions, placeholder);

    return {
      id: this.generateUuid(),
      conversation_id: conversationId,
      sender: 'assistant',
      text: fullText,
      services: this.getServices(),
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

if (typeof globalThis !== 'undefined') {
  globalThis.MockSherpaService = MockSherpaService;
}
if (typeof window !== 'undefined') {
  window.MockSherpaService = MockSherpaService;
}
