import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Button,
  Spinner,
  Toaster,
  Toast,
  ToastTitle,
  useToastController,
  useId,
  Tooltip,
} from '@fluentui/react-components';
import {
  Send20Regular,
  ArrowClockwise20Regular,
  Mail20Regular,
} from '@fluentui/react-icons';
import {
  InitSessionRequest,
  MessageItem,
  StepItem,
  ProtocolErrorEnvelope,
  SSEEvent,
} from '../../contracts/front/types';
import { IChatService } from '../services/chatService';
import { MessageItemView } from './MessageItemView';
import { StreamingSteps } from './StreamingSteps';
import { QuickReplies } from './QuickReplies';
import { ReplyBanner } from './ReplyBanner';
import { ErrorBanner } from './ErrorBanner';
import { EmailUpload, DragDropZoneOverlay } from './EmailUpload';

const DEFAULT_EMAIL_CONTEXT: InitSessionRequest = {
  subject: 'Re: Запрос на поставку серверного оборудования по сделке 105-К',
  sender: 'client@partner.ru',
  body: "Добрый день! Направляем уточнения по спецификации для ООО 'Ромашка'. Сумма 500 000 руб.",
  manager_email: 'manager@corp.local',
};

const useStyles = makeStyles({
  root: {
    width: '100%',
    maxWidth: '360px',
    minWidth: '320px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2,
    position: 'relative',
    boxSizing: 'border-box',
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    fontFamily: tokens.fontFamilyBase,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    flexShrink: 0,
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('6px', tokens.spacingHorizontalM, tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    flexShrink: 0,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    width: '100%',
  },
  input: {
    flexGrow: 1,
  },
  sendBtn: {
    minWidth: '32px',
    width: '32px',
    height: '32px',
    padding: '0',
  },
  reloadBtn: {
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
  },
});

export interface ChatPanelProps {
  chatService: IChatService;
  initialEmailContext?: InitSessionRequest;
  managerEmail?: string;
  enableSSEStream?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatService,
  initialEmailContext = DEFAULT_EMAIL_CONTEXT,
  managerEmail = 'manager@corp.local',
  enableSSEStream = true,
}) => {
  const styles = useStyles();
  const toasterId = useId('chat-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<ProtocolErrorEnvelope | string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, steps, suggestions, scrollToBottom]);

  const showToast = useCallback(
    (message: string, intent: 'success' | 'error' | 'info' = 'success') => {
      dispatchToast(
        <Toast>
          <ToastTitle>{message}</ToastTitle>
        </Toast>,
        { intent, timeout: 2500 }
      );
    },
    [dispatchToast]
  );

  const handleCopyE1cib = useCallback(
    async (url: string) => {
      try {
        if (navigator?.clipboard) {
          await navigator.clipboard.writeText(url);
        }
        showToast('✔ Скопировано', 'success');
      } catch {
        showToast('Не удалось скопировать', 'error');
      }
    },
    [showToast]
  );

  const checkAutoReply = useCallback((newMessages: MessageItem[]) => {
    const lastAssistant = [...newMessages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant && lastAssistant.metadata?.expected_input) {
      setReplyTo(lastAssistant);
    }
  }, []);

  const initChatSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setReplyTo(null);
    setMessages([]);
    setSteps([]);
    setSuggestions([]);

    try {
      const resp = await chatService.initSession(initialEmailContext);
      setSessionId(resp.session_id);
      setMessages(resp.messages || []);
      setSteps(resp.steps || []);
      setSuggestions(resp.suggestions || []);
      checkAutoReply(resp.messages || []);

      // If SSE streaming is enabled and session is created
      if (enableSSEStream && resp.session_id) {
        chatService.streamSessionEvents(
          resp.session_id,
          (event: SSEEvent) => {
            if (event.type === 'step') {
              setSteps((prev) => {
                const idx = prev.findIndex((s) => s.step_id === event.data.step_id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = event.data;
                  return updated;
                }
                return [...prev, event.data];
              });
            } else if (event.type === 'message') {
              setMessages((prev) => {
                if (prev.some((m) => m.id === event.data.id)) return prev;
                const next = [...prev, event.data];
                checkAutoReply(next);
                return next;
              });
            } else if (event.type === 'suggestions') {
              setSuggestions(event.data);
            }
          },
          (streamErr) => {
            console.warn('SSE stream error:', streamErr);
          }
        );
      }
    } catch (err: any) {
      if (err.envelope) {
        setError(err.envelope);
      } else {
        setError(err.message || 'Ошибка инициализации сессии');
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatService, initialEmailContext, enableSSEStream, checkAutoReply]);

  useEffect(() => {
    initChatSession();
  }, [initChatSession]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend ?? inputText).trim();
    if (!messageText || !sessionId || isSending) return;

    setIsSending(true);
    setError(null);

    // Capture reply_to if any, then clear it
    const replyTarget = replyTo;
    setReplyTo(null);
    setInputText('');

    // Optimistically show user message
    const tempUserMsg: MessageItem = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const resp = await chatService.sendMessage({
        session_id: sessionId,
        text: messageText,
        reply_to_message_id: replyTarget ? replyTarget.id : null,
        manager_email: managerEmail,
      });

      setMessages(resp.messages || []);
      setSteps(resp.steps || []);
      setSuggestions(resp.suggestions || []);
      checkAutoReply(resp.messages || []);
    } catch (err: any) {
      if (err.envelope) {
        setError(err.envelope);
      } else {
        setError(err.message || 'Ошибка отправки сообщения');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleReplyAction = (message: MessageItem) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setReplyTo(null);

    try {
      const resp = await chatService.initSessionUpload(file, managerEmail);
      setSessionId(resp.session_id);
      setMessages(resp.messages || []);
      setSteps(resp.steps || []);
      setSuggestions(resp.suggestions || []);
      checkAutoReply(resp.messages || []);
      showToast(`Файл "${file.name}" загружен`, 'success');
    } catch (err: any) {
      if (err.envelope) {
        setError(err.envelope);
      } else {
        setError(err.message || 'Ошибка загрузки файла письма');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div
      className={styles.root}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="chat-panel"
    >
      <Toaster toasterId={toasterId} />
      <DragDropZoneOverlay isDragging={isDragging} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Mail20Regular style={{ color: tokens.colorBrandForeground1 }} />
          <span className={styles.title}>1С:CRM Ассистент</span>
        </div>
        <Tooltip content="Сбросить и перезапустить сессию" relationship="label">
          <Button
            appearance="subtle"
            size="small"
            className={styles.reloadBtn}
            icon={<ArrowClockwise20Regular />}
            onClick={initChatSession}
            disabled={isLoading || isSending}
            aria-label="Перезапустить чат"
            data-testid="reload-session-btn"
          />
        </Tooltip>
      </div>

      {/* Message List */}
      <div className={styles.messagesContainer} data-testid="message-list">
        {isLoading && messages.length === 0 ? (
          <div className={styles.loadingContainer}>
            <Spinner label="Анализирую контекст письма..." size="medium" />
          </div>
        ) : (
          <>
            <StreamingSteps steps={steps} />

            {error && (
              <ErrorBanner
                error={error}
                onDismiss={() => setError(null)}
                onCopyE1cib={handleCopyE1cib}
              />
            )}

            {messages.map((msg) => (
              <MessageItemView
                key={msg.id}
                message={msg}
                onReply={handleReplyAction}
                onCopyE1cib={handleCopyE1cib}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {/* Quick Replies */}
        <QuickReplies
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
          disabled={isLoading || isSending}
        />

        {/* Reply Banner */}
        {replyTo && (
          <ReplyBanner
            replyText={
              replyTo.metadata?.expected_input === 'partner_search'
                ? 'Уточнение контрагента / ИНН'
                : replyTo.content.slice(0, 45) + (replyTo.content.length > 45 ? '...' : '')
            }
            onClose={() => setReplyTo(null)}
          />
        )}

        {/* Input bar */}
        <div className={styles.inputRow}>
          <EmailUpload
            onFileUpload={handleFileUpload}
            disabled={isLoading || isSending}
          />
          <Input
            ref={inputRef}
            className={styles.input}
            placeholder={
              replyTo
                ? 'Введите уточнение...'
                : 'Напишите вопрос или выберите номер...'
            }
            value={inputText}
            onChange={(_, data) => setInputText(data.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || isSending}
            input={{ 'data-testid': 'chat-input' } as any}
          />
          <Button
            appearance="primary"
            className={styles.sendBtn}
            icon={isSending ? <Spinner size="extra-tiny" /> : <Send20Regular />}
            onClick={() => handleSendMessage()}
            disabled={isLoading || isSending || !inputText.trim()}
            title="Отправить (Enter)"
            aria-label="Отправить сообщение"
            data-testid="send-message-btn"
          />
        </div>
      </div>
    </div>
  );
};
