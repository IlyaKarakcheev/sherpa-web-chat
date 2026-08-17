/**
 * Mock Service Provider for Sherpa Assistant
 * Conforms to contracts/api/sherpa-chat-api-v1.yaml
 */

export class MockSherpaService {
  constructor(options = {}) {
    this.delayMs = options.delayMs ?? 500;
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
