import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { QuickReplies } from '../src/components/QuickReplies';

describe('QuickReplies', () => {
  const suggestions = [
    '1. ⭐ 105-К Поставка серверов',
    '2. 106-К Лицензии ПО',
    '3. + Создать сделку',
  ];

  it('renders numbered buttons with cleaned labels', () => {
    const handleSelect = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <QuickReplies suggestions={suggestions} onSelect={handleSelect} />
      </FluentProvider>
    );

    expect(screen.getByTestId('quick-reply-1')).toHaveTextContent('⭐ 105-К Поставка серверов');
    expect(screen.getByTestId('quick-reply-2')).toHaveTextContent('106-К Лицензии ПО');
    expect(screen.getByTestId('quick-reply-3')).toHaveTextContent('+ Создать сделку');
  });

  it('triggers onSelect when button is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <QuickReplies suggestions={suggestions} onSelect={handleSelect} />
      </FluentProvider>
    );

    await user.click(screen.getByTestId('quick-reply-2'));
    expect(handleSelect).toHaveBeenCalledWith('2. 106-К Лицензии ПО', 1);
  });

  it('triggers onSelect when hotkey 1 is pressed on keyboard (Keyboard-First)', () => {
    const handleSelect = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <QuickReplies suggestions={suggestions} onSelect={handleSelect} />
      </FluentProvider>
    );

    fireEvent.keyDown(window, { key: '1' });
    expect(handleSelect).toHaveBeenCalledWith('1. ⭐ 105-К Поставка серверов', 0);

    fireEvent.keyDown(window, { key: '3' });
    expect(handleSelect).toHaveBeenCalledWith('3. + Создать сделку', 2);
  });

  it('does not trigger hotkey if focus is inside an input with text', () => {
    const handleSelect = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <div>
          <input data-testid="test-input" defaultValue="some query" />
          <QuickReplies suggestions={suggestions} onSelect={handleSelect} />
        </div>
      </FluentProvider>
    );

    const input = screen.getByTestId('test-input');
    fireEvent.keyDown(input, { key: '1' });
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
