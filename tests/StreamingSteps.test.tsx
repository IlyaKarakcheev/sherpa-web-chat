import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { StreamingSteps } from '../src/components/StreamingSteps';
import { StepItem } from '../contracts/front/types';

describe('StreamingSteps', () => {
  const mockSteps: StepItem[] = [
    {
      step_id: 'step_1',
      node_name: 'extract_entities',
      title: 'Обрабатываю письмо...',
      status: 'completed',
    },
    {
      step_id: 'step_2',
      node_name: 'find_deals',
      title: 'Ищу подходящие сделки в 1С...',
      status: 'running',
    },
  ];

  it('renders step items with correct titles and statuses', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <StreamingSteps steps={mockSteps} defaultExpanded={true} />
      </FluentProvider>
    );

    expect(screen.getByTestId('step-step_1')).toHaveTextContent('Обрабатываю письмо...');
    expect(screen.getByTestId('step-step_2')).toHaveTextContent('Ищу подходящие сделки в 1С...');
  });

  it('renders nothing when steps list is empty', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <StreamingSteps steps={[]} />
      </FluentProvider>
    );

    expect(screen.queryByTestId('streaming-steps')).not.toBeInTheDocument();
  });
});
