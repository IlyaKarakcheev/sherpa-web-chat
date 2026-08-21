import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { EntityChips } from '../src/components/EntityChips';
import { ExtractedSummary } from '../contracts/front/types';

describe('EntityChips', () => {
  it('renders companies, deal numbers, inn, amount tags', () => {
    const summary: ExtractedSummary = {
      companies: ['ООО Ромашка'],
      deal_numbers: ['105-К'],
      inn: ['7701234567'],
      amount: '500 000 руб',
    };

    render(
      <FluentProvider theme={webLightTheme}>
        <EntityChips summary={summary} />
      </FluentProvider>
    );

    expect(screen.getByText('ООО Ромашка')).toBeInTheDocument();
    expect(screen.getByText('Сделка 105-К')).toBeInTheDocument();
    expect(screen.getByText('ИНН: 7701234567')).toBeInTheDocument();
    expect(screen.getByText('500 000 руб')).toBeInTheDocument();
  });

  it('renders nothing when summary is null or empty', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <EntityChips summary={null} />
      </FluentProvider>
    );

    expect(screen.queryByTestId('entity-chips')).not.toBeInTheDocument();
  });
});
