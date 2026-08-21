import {
  InitSessionRequest,
  InitSessionResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  SSEEvent,
  MessageItem,
  StepItem,
} from '../contracts/front/types';
import {
  MOCK_INIT_RESPONSE,
  MOCK_COLLISION_409_ERROR,
  MOCK_VALIDATION_400_ERROR,
  MOCK_STREAMING_EVENTS_SEQUENCE,
} from './fixtures';

export interface MockServiceOptions {
  streamingStepDelayMs?: number;
  simulateCollision?: boolean;
  simulateValidationError?: boolean;
  simulateNetworkError?: boolean;
}

export class MockChatService {
  private options: MockServiceOptions;
  private currentSession: InitSessionResponse | ChatMessageResponse | null = null;
  private activeSteps: StepItem[] = [];
  private activeMessages: MessageItem[] = [];
  private activeSuggestions: string[] = [];

  constructor(options: MockServiceOptions = {}) {
    this.options = {
      streamingStepDelayMs: options.streamingStepDelayMs ?? 400,
      simulateCollision: options.simulateCollision ?? false,
      simulateValidationError: options.simulateValidationError ?? false,
      simulateNetworkError: options.simulateNetworkError ?? false,
    };
  }

  setOptions(options: Partial<MockServiceOptions>) {
    this.options = { ...this.options, ...options };
  }

  async healthCheck(): Promise<{ status: string; version: string; mock_mode: boolean }> {
    return {
      status: 'ok',
      version: '1.0.0',
      mock_mode: true,
    };
  }

  async initSession(req: InitSessionRequest): Promise<InitSessionResponse> {
    if (this.options.simulateNetworkError) {
      throw new Error('Network error: Failed to fetch');
    }
    if (this.options.simulateValidationError || !req.manager_email) {
      const err = new Error(MOCK_VALIDATION_400_ERROR.error.message) as any;
      err.envelope = MOCK_VALIDATION_400_ERROR;
      err.status = 400;
      throw err;
    }
    if (this.options.simulateCollision) {
      const err = new Error(MOCK_COLLISION_409_ERROR.error.message) as any;
      err.envelope = MOCK_COLLISION_409_ERROR;
      err.status = 409;
      throw err;
    }

    this.activeMessages = [...MOCK_INIT_RESPONSE.messages];
    this.activeSteps = [...MOCK_INIT_RESPONSE.steps];
    this.activeSuggestions = [...MOCK_INIT_RESPONSE.suggestions];
    this.currentSession = { ...MOCK_INIT_RESPONSE };
    return this.currentSession as InitSessionResponse;
  }

  async initSessionUpload(file: File, manager_email: string): Promise<InitSessionResponse> {
    if (this.options.simulateNetworkError) {
      throw new Error('Network error: Failed to fetch');
    }
    if (!file || !manager_email) {
      const err = new Error('File or manager_email is missing') as any;
      err.envelope = MOCK_VALIDATION_400_ERROR;
      err.status = 400;
      throw err;
    }

    const customMessage: MessageItem = {
      id: `msg-upload-${Date.now()}`,
      role: 'assistant',
      content: `Файл **${file.name}** (${(file.size / 1024).toFixed(1)} КБ) успешно загружен и проанализирован.\n\nНайдены связанные сделки в 1С:`,
      metadata: {
        extracted_summary: {
          companies: ['ООО Ромашка', 'ПАО Сбер'],
          deal_numbers: ['105-К'],
          amount: '500 000 ₽',
        },
        expected_input: 'partner_selection',
        reference_link: 'e1cib/data/Документ.Сделка?ref=deal-001-guid',
      },
    };

    this.activeMessages = [customMessage];
    this.activeSteps = [...MOCK_INIT_RESPONSE.steps];
    this.activeSuggestions = [...MOCK_INIT_RESPONSE.suggestions];

    return {
      session_id: `upload-session-${Date.now()}`,
      status: 'completed',
      is_new_session: true,
      existing_link: null,
      messages: this.activeMessages,
      steps: this.activeSteps,
      suggestions: this.activeSuggestions,
    };
  }

  async sendMessage(req: ChatMessageRequest): Promise<ChatMessageResponse> {
    if (this.options.simulateNetworkError) {
      throw new Error('Network error: Failed to fetch');
    }
    if (!req.text || !req.session_id) {
      const err = new Error('Invalid chat message request') as any;
      err.envelope = MOCK_VALIDATION_400_ERROR;
      err.status = 400;
      throw err;
    }

    const userMsg: MessageItem = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: req.text,
    };
    this.activeMessages.push(userMsg);

    // If user clicked 1 or "1. ⭐ 105-К Поставка серверов"
    if (req.text.startsWith('1') || req.text.includes('105-К')) {
      const assistantMsg: MessageItem = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: '✅ Письмо успешно привязано к сделке: **Поставка серверного оборудования (105-К)**.\n\nСсылка в 1С: [Открыть сделку](e1cib/data/Документ.Сделка?ref=deal-001-guid)',
        metadata: {
          reference_link: 'e1cib/data/Документ.Сделка?ref=deal-001-guid',
          deal_id: 'deal-001-guid',
        },
      };
      this.activeMessages.push(assistantMsg);
      this.activeSuggestions = [];
      const newStep: StepItem = {
        step_id: `step_${this.activeSteps.length + 1}`,
        node_name: 'link_deal',
        title: 'Связываю письмо со сделкой в 1С...',
        status: 'completed',
      };
      this.activeSteps.push(newStep);

      const resp: ChatMessageResponse = {
        session_id: req.session_id,
        status: 'completed',
        current_stage: 'DEAL_LINKED',
        messages: [...this.activeMessages],
        steps: [...this.activeSteps],
        suggestions: [],
        final_output: 'Связал письмо со сделкой: Поставка серверного оборудования (105-К)',
      };
      this.currentSession = resp;
      return resp;
    }

    // If reply / clarification
    if (req.reply_to_message_id || req.text.toLowerCase().includes('партнер') || req.text.toLowerCase().includes('инн')) {
      const assistantMsg: MessageItem = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: `Принято! Выполняю повторный поиск сделок по запросу: *"${req.text}"*...\n\nНайдена сделка: [105-К Поставка оборудования](e1cib/data/Документ.Сделка?ref=deal-001-guid)`,
        metadata: {
          extracted_summary: {
            companies: [req.text],
          },
          expected_input: null,
          reference_link: 'e1cib/data/Документ.Сделка?ref=deal-001-guid',
        },
      };
      this.activeMessages.push(assistantMsg);
      this.activeSuggestions = ['1. Связать с 105-К', '2. Создать новую сделку'];

      const resp: ChatMessageResponse = {
        session_id: req.session_id,
        status: 'completed',
        current_stage: 'PARTNER_RESOLVED',
        messages: [...this.activeMessages],
        steps: [...this.activeSteps],
        suggestions: this.activeSuggestions,
      };
      this.currentSession = resp;
      return resp;
    }

    // Default LLM answer for freeform query
    const freeformMsg: MessageItem = {
      id: `msg-assistant-${Date.now()}`,
      role: 'assistant',
      content: `Ответ на ваш вопрос: **"${req.text}"**.\n\nВы можете связать письмо с найденными сделками или продолжить диалог.`,
      metadata: {
        expected_input: null,
      },
    };
    this.activeMessages.push(freeformMsg);

    const resp: ChatMessageResponse = {
      session_id: req.session_id,
      status: 'completed',
      current_stage: 'CONVERSATION',
      messages: [...this.activeMessages],
      steps: [...this.activeSteps],
      suggestions: ['1. ⭐ 105-К Поставка серверов', '2. 106-К Лицензии ПО'],
    };
    this.currentSession = resp;
    return resp;
  }

  streamSessionEvents(
    _sessionId: string,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: any) => void,
    onDone?: () => void
  ): () => void {
    if (this.options.simulateNetworkError) {
      if (onError) onError(new Error('SSE connection failed'));
      return () => {};
    }

    let isCancelled = false;
    const delay = this.options.streamingStepDelayMs ?? 400;

    const runStream = async () => {
      for (const event of MOCK_STREAMING_EVENTS_SEQUENCE) {
        if (isCancelled) break;
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        if (isCancelled) break;
        onEvent(event);
      }
      if (!isCancelled && onDone) {
        onDone();
      }
    };

    runStream().catch((err) => {
      if (!isCancelled && onError) onError(err);
    });

    return () => {
      isCancelled = true;
    };
  }
}
