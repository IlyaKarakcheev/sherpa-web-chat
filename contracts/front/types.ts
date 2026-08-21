/**
 * DTO and Types for Sherpa Thin Chat Protocol
 * Source: contracts/front/sherpa-chat-protocol-v1.yaml
 */

export interface ExtractedSummary {
  companies?: string[];
  deal_numbers?: string[];
  inn?: string[];
  amount?: string | null;
}

export interface MessageMetadata {
  extracted_summary?: ExtractedSummary;
  expected_input?: 'partner_search' | 'deal_search' | 'amount_input' | 'partner_selection' | string | null;
  reference_link?: string | null;
  deal_id?: string | null;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // Markdown GFM
  metadata?: MessageMetadata;
}

export interface StepItem {
  step_id: string;
  node_name: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  output?: Record<string, any> | null;
}

export interface InitSessionRequest {
  subject: string;
  sender: string;
  body: string;
  manager_email: string;
}

export interface InitSessionResponse {
  session_id: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  is_new_session: boolean;
  existing_link?: Record<string, any> | null;
  messages: MessageItem[];
  steps: StepItem[];
  suggestions: string[];
}

export interface ChatMessageRequest {
  session_id: string;
  text: string;
  reply_to_message_id?: string | null;
  manager_email: string;
}

export interface ChatMessageResponse {
  session_id: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  current_stage: string;
  messages: MessageItem[];
  steps: StepItem[];
  suggestions: string[];
  final_output?: string | null;
}

export interface ErrorDetail {
  code: string;
  message: string;
  failed_parameter?: string | null;
  suggested_recovery?: string | null;
}

export interface ProtocolErrorEnvelope {
  status: 'error';
  session_id?: string | null;
  error: ErrorDetail;
}

export type SSEEvent =
  | { type: 'step'; data: StepItem }
  | { type: 'message'; data: MessageItem }
  | { type: 'suggestions'; data: string[] }
  | { type: 'done'; data: { status: string; current_stage: string } };
