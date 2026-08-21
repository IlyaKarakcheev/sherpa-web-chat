import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders standard markdown elements (bold, tables, lists)', () => {
    const md = `
**Жирный текст**

| Колонка 1 | Колонка 2 |
|---|---|
| Значение 1 | Значение 2 |

- Пункт 1
- Пункт 2
`;
    render(
      <FluentProvider theme={webLightTheme}>
        <MarkdownRenderer content={md} />
      </FluentProvider>
    );

    expect(screen.getByText('Жирный текст')).toBeInTheDocument();
    expect(screen.getByText('Колонка 1')).toBeInTheDocument();
    expect(screen.getByText('Значение 1')).toBeInTheDocument();
    expect(screen.getByText('Пункт 1')).toBeInTheDocument();
  });

  it('intercepts e1cib 1C links and triggers onCopyE1cib callback instead of native navigation', async () => {
    const user = userEvent.setup();
    const handleCopy = vi.fn();
    const md = `Пожалуйста, проверьте сделку [Открыть 105-К](e1cib/data/Документ.Сделка?ref=deal-001-guid).`;

    render(
      <FluentProvider theme={webLightTheme}>
        <MarkdownRenderer content={md} onCopyE1cib={handleCopy} />
      </FluentProvider>
    );

    const link = screen.getByTestId('e1cib-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Открыть 105-К');

    await user.click(link);

    expect(handleCopy).toHaveBeenCalledWith('e1cib/data/Документ.Сделка?ref=deal-001-guid');
  });

  it('renders external links with target _blank and no copy interception', () => {
    const md = `Внешний ресурс: [Google](https://google.com).`;
    render(
      <FluentProvider theme={webLightTheme}>
        <MarkdownRenderer content={md} />
      </FluentProvider>
    );

    const link = screen.getByRole('link', { name: 'Google' });
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
