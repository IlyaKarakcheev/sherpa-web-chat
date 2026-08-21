import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ChatPanel } from '../src/components/ChatPanel';
import { MockChatService } from '../mocks/mockService';

describe('ChatPanel Integration Tests (initial-spec.md)', () => {
  let mockService: MockChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new MockChatService({
      streamingStepDelayMs: 0,
    });
  });

  const renderPanel = (service: MockChatService = mockService) => {
    return render(
      <FluentProvider theme={webLightTheme}>
        <ChatPanel chatService={service} enableSSEStream={false} />
      </FluentProvider>
    );
  };

  it('Positive 1: Zero-Click initialization renders steps, assistant message with deals and quick reply buttons', async () => {
    renderPanel();

    expect(screen.getByText('1С:CRM Ассистент')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('streaming-steps')).toBeInTheDocument();
    });

    expect(screen.getByText('Шаги выполнения (2)')).toBeInTheDocument();
    expect(screen.getByText(/Я проанализировал письмо и нашел подходящие сделки/)).toBeInTheDocument();
    expect(screen.getByText('Поставка серверного оборудования')).toBeInTheDocument();

    expect(screen.getByText('ООО Ромашка')).toBeInTheDocument();
    expect(screen.getByText('Сделка 105-К')).toBeInTheDocument();

    expect(screen.getByTestId('quick-reply-1')).toBeInTheDocument();
    expect(screen.getByTestId('quick-reply-2')).toBeInTheDocument();
  });

  it('Positive 2: Intercepts e1cib link click, copies URL to clipboard and shows toast', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByTestId('e1cib-link').length).toBeGreaterThan(0);
    });

    const links = screen.getAllByTestId('e1cib-link');
    fireEvent.click(links[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'e1cib/data/Документ.Сделка?ref=deal-001-guid'
    );

    await waitFor(() => {
      expect(screen.getByText('✔ Скопировано')).toBeInTheDocument();
    });
  });

  it('Positive 3: Reply UX activated automatically for expected_input, closed with Esc and allows freeform question', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('reply-banner')).toBeInTheDocument();
    });

    // Close banner via Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('reply-banner')).not.toBeInTheDocument();
    });

    // Type freeform question into chat input
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Какой общий долг клиента?' } });
    fireEvent.click(screen.getByTestId('send-message-btn'));

    await waitFor(() => {
      expect(screen.getByText('Какой общий долг клиента?')).toBeInTheDocument();
      expect(screen.getByText(/Ответ на ваш вопрос/)).toBeInTheDocument();
    });
  });

  it('Positive 4: Keyboard-First sends option 1 when digit 1 is pressed on keyboard', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('quick-reply-1')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: '1' });

    await waitFor(() => {
      expect(screen.getByText(/Письмо успешно привязано к сделке/)).toBeInTheDocument();
    });
  });

  it('Negative 1: Handles 409 collision (ALREADY_PROCESSED) with error banner and 1C deal link', async () => {
    const collisionService = new MockChatService({
      simulateCollision: true,
      streamingStepDelayMs: 0,
    });
    renderPanel(collisionService);

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-banner')).toHaveAttribute('data-error-code', 'ALREADY_PROCESSED');
    expect(screen.getByText('Письмо уже связано')).toBeInTheDocument();
    expect(screen.getByText(/Письмо уже связано со сделкой/)).toBeInTheDocument();
    expect(screen.getByText(/Рекомендация:/)).toBeInTheDocument();
  });

  it('Negative 2: Handles 400 validation error cleanly', async () => {
    const validationErrService = new MockChatService({
      simulateValidationError: true,
      streamingStepDelayMs: 0,
    });
    renderPanel(validationErrService);

    await waitFor(() => {
      expect(screen.getByTestId('error-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/Обязательный параметр manager_email не указан/)).toBeInTheDocument();
  });

  it('File Upload: Uploads .msg/.eml file and initializes session with parsed entities', async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByTestId('file-upload-input')).toBeInTheDocument();
    });

    const file = new File(['dummy email content'], 'invoice_request.msg', {
      type: 'application/vnd.ms-outlook',
    });

    const fileInput = screen.getByTestId('file-upload-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getAllByText(/invoice_request.msg/).length).toBeGreaterThan(0);
      expect(screen.getByText('ПАО Сбер')).toBeInTheDocument();
    });
  });
});
