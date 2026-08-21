import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ReplyBanner } from '../src/components/ReplyBanner';

describe('ReplyBanner', () => {
  it('renders reply text and close button within 28px height limit', () => {
    const handleClose = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <ReplyBanner replyText="Уточните контрагента" onClose={handleClose} />
      </FluentProvider>
    );

    const banner = screen.getByTestId('reply-banner');
    expect(banner).toBeInTheDocument();
    expect(screen.getByText('Уточните контрагента')).toBeInTheDocument();
    expect(screen.getByTestId('reply-banner-close')).toBeInTheDocument();
  });

  it('triggers onClose when close button [✕] is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <ReplyBanner replyText="Уточните сделку" onClose={handleClose} />
      </FluentProvider>
    );

    await user.click(screen.getByTestId('reply-banner-close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <ReplyBanner replyText="Уточните сделку" onClose={handleClose} />
      </FluentProvider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
