import {
  InitSessionRequest,
  InitSessionResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ProtocolErrorEnvelope,
  SSEEvent,
} from '../../contracts/front/types';
import { MockChatService } from '../../mocks/mockService';

export interface IChatService {
  healthCheck(): Promise<{ status: string; version: string; mock_mode: boolean }>;
  initSession(req: InitSessionRequest): Promise<InitSessionResponse>;
  initSessionUpload(file: File, manager_email: string): Promise<InitSessionResponse>;
  sendMessage(req: ChatMessageRequest): Promise<ChatMessageResponse>;
  streamSessionEvents(
    sessionId: string,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: any) => void,
    onDone?: () => void
  ): () => void;
}

export class ChatServiceError extends Error {
  status: number;
  envelope?: ProtocolErrorEnvelope;

  constructor(message: string, status: number, envelope?: ProtocolErrorEnvelope) {
    super(message);
    this.name = 'ChatServiceError';
    this.status = status;
    this.envelope = envelope;
  }
}

export class HttpChatService implements IChatService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let envelope: ProtocolErrorEnvelope | undefined;
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const json = await res.json();
        if (json && json.status === 'error' && json.error) {
          envelope = json as ProtocolErrorEnvelope;
          errorMsg = json.error.message || errorMsg;
        }
      } catch {
        // Not JSON
      }
      throw new ChatServiceError(errorMsg, res.status, envelope);
    }
    return res.json() as Promise<T>;
  }

  async healthCheck(): Promise<{ status: string; version: string; mock_mode: boolean }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return this.handleResponse<{ status: string; version: string; mock_mode: boolean }>(res);
  }

  async initSession(req: InitSessionRequest): Promise<InitSessionResponse> {
    const res = await fetch(`${this.baseUrl}/v1/chat/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    return this.handleResponse<InitSessionResponse>(res);
  }

  async initSessionUpload(file: File, manager_email: string): Promise<InitSessionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('manager_email', manager_email);

    const res = await fetch(`${this.baseUrl}/v1/chat/session/upload`, {
      method: 'POST',
      body: formData,
    });
    return this.handleResponse<InitSessionResponse>(res);
  }

  async sendMessage(req: ChatMessageRequest): Promise<ChatMessageResponse> {
    const res = await fetch(`${this.baseUrl}/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    return this.handleResponse<ChatMessageResponse>(res);
  }

  streamSessionEvents(
    sessionId: string,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: any) => void,
    onDone?: () => void
  ): () => void {
    const url = `${this.baseUrl}/v1/chat/stream?session_id=${encodeURIComponent(sessionId)}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as SSEEvent;
        onEvent(parsed);
        if (parsed.type === 'done') {
          eventSource.close();
          if (onDone) onDone();
        }
      } catch (err) {
        if (onError) onError(err);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  }
}

export function createChatService(isMock: boolean = true, mockOptions = {}): IChatService {
  if (isMock) {
    return new MockChatService(mockOptions);
  }
  const apiUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : 'http://localhost:8000';
  return new HttpChatService(apiUrl);
}
