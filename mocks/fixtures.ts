import {
  InitSessionResponse,
  ChatMessageResponse,
  ProtocolErrorEnvelope,
  StepItem,
  MessageItem,
  SSEEvent,
} from '../contracts/front/types';

export const MOCK_SESSION_ID = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const MOCK_STEPS_INITIAL: StepItem[] = [
  {
    step_id: 'step_1',
    node_name: 'extract_entities',
    title: 'Обрабатываю письмо...',
    status: 'completed',
    output: { companies: ['ООО Ромашка'], inn: ['7701234567'], deal_numbers: ['105-К', '106-К'] },
  },
  {
    step_id: 'step_2',
    node_name: 'find_deals',
    title: 'Ищу подходящие сделки в 1С...',
    status: 'completed',
    output: { found_deals_count: 2 },
  },
];

export const MOCK_MESSAGE_DEALS: MessageItem = {
  id: 'msg-001',
  role: 'assistant',
  content: `Я проанализировал письмо и нашел подходящие сделки в 1С:

| Номер | Сделка | Сумма | Ссылка |
|---|---|---|---|
| 105-К | Поставка серверного оборудования | 500 000 ₽ | [Открыть в 1С](e1cib/data/Документ.Сделка?ref=deal-001-guid) |
| 106-К | Лицензии ПО | 120 000 ₽ | [Открыть в 1С](e1cib/data/Документ.Сделка?ref=deal-002-guid) |

Выберите вариант из предложенных кнопок или уточните запрос.`,
  metadata: {
    extracted_summary: {
      companies: ['ООО Ромашка'],
      deal_numbers: ['105-К', '106-К'],
      inn: ['7701234567'],
      amount: '500 000 руб',
    },
    expected_input: 'partner_selection',
    reference_link: 'e1cib/data/Документ.Сделка?ref=deal-001-guid',
    deal_id: 'deal-001-guid',
  },
};

export const MOCK_SUGGESTIONS_INITIAL: string[] = [
  '1. ⭐ 105-К Поставка серверов',
  '2. 106-К Лицензии ПО',
  '3. + Создать сделку',
  '4. 🔍 Искать вручную',
];

export const MOCK_INIT_RESPONSE: InitSessionResponse = {
  session_id: MOCK_SESSION_ID,
  status: 'completed',
  is_new_session: true,
  existing_link: null,
  messages: [MOCK_MESSAGE_DEALS],
  steps: MOCK_STEPS_INITIAL,
  suggestions: MOCK_SUGGESTIONS_INITIAL,
};

export const MOCK_CLARIFY_MESSAGE: MessageItem = {
  id: 'msg-clarify-002',
  role: 'assistant',
  content: 'Пожалуйста, уточните ИНН контрагента или номер счета для поиска в 1С:',
  metadata: {
    expected_input: 'partner_search',
  },
};

export const MOCK_LINKED_RESPONSE: ChatMessageResponse = {
  session_id: MOCK_SESSION_ID,
  status: 'completed',
  current_stage: 'DEAL_LINKED',
  messages: [
    MOCK_MESSAGE_DEALS,
    {
      id: 'msg-user-choice',
      role: 'user',
      content: '1. ⭐ 105-К Поставка серверов',
    },
    {
      id: 'msg-assistant-confirmed',
      role: 'assistant',
      content: '✅ Письмо успешно привязано к сделке: **Поставка серверного оборудования (105-К)**.\n\nСсылка в 1С: [Открыть сделку](e1cib/data/Документ.Сделка?ref=deal-001-guid)',
      metadata: {
        reference_link: 'e1cib/data/Документ.Сделка?ref=deal-001-guid',
        deal_id: 'deal-001-guid',
      },
    },
  ],
  steps: [
    ...MOCK_STEPS_INITIAL,
    {
      step_id: 'step_3',
      node_name: 'link_deal',
      title: 'Связываю письмо со сделкой в 1С...',
      status: 'completed',
    },
  ],
  suggestions: [],
  final_output: 'Связал письмо со сделкой: Поставка серверного оборудования (105-К)',
};

export const MOCK_COLLISION_409_ERROR: ProtocolErrorEnvelope = {
  status: 'error',
  session_id: MOCK_SESSION_ID,
  error: {
    code: 'ALREADY_PROCESSED',
    message: 'Письмо уже связано со сделкой \'Поставка оборудования\' (105-К) пользователем manager@corp.local.',
    failed_parameter: 'session_id',
    suggested_recovery: 'Используйте ссылку e1cib/data/Документ.Сделка?ref=deal-001-guid для перехода в 1С.',
  },
};

export const MOCK_VALIDATION_400_ERROR: ProtocolErrorEnvelope = {
  status: 'error',
  session_id: null,
  error: {
    code: 'INVALID_EMAIL',
    message: 'Обязательный параметр manager_email не указан или имеет неверный формат.',
    failed_parameter: 'manager_email',
    suggested_recovery: 'Проверьте настройки авторизации пользователя.',
  },
};

export const MOCK_STREAMING_EVENTS_SEQUENCE: SSEEvent[] = [
  {
    type: 'step',
    data: {
      step_id: 'step_1',
      node_name: 'extract_entities',
      title: 'Обрабатываю письмо...',
      status: 'running',
    },
  },
  {
    type: 'step',
    data: {
      step_id: 'step_1',
      node_name: 'extract_entities',
      title: 'Обрабатываю письмо...',
      status: 'completed',
      output: { companies: ['ООО Ромашка'] },
    },
  },
  {
    type: 'step',
    data: {
      step_id: 'step_2',
      node_name: 'find_deals',
      title: 'Ищу подходящие сделки в 1С...',
      status: 'running',
    },
  },
  {
    type: 'step',
    data: {
      step_id: 'step_2',
      node_name: 'find_deals',
      title: 'Ищу подходящие сделки в 1С...',
      status: 'completed',
      output: { found_deals_count: 2 },
    },
  },
  {
    type: 'message',
    data: MOCK_MESSAGE_DEALS,
  },
  {
    type: 'suggestions',
    data: MOCK_SUGGESTIONS_INITIAL,
  },
  {
    type: 'done',
    data: {
      status: 'completed',
      current_stage: 'SUGGESTIONS_READY',
    },
  },
];
