import React, { useState } from 'react';
import {
  Spinner,
  makeStyles,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  DismissCircle16Filled,
  ChevronDown16Regular,
  ChevronUp16Regular,
} from '@fluentui/react-icons';
import { StepItem } from '../../contracts/front/types';

const useStyles = makeStyles({
  container: {
    ...shorthands.margin(tokens.spacingVerticalXS, 0),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    fontSize: tokens.fontSizeBase200,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: tokens.spacingVerticalXS,
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase200,
  },
  completedIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '16px',
    flexShrink: 0,
  },
  failedIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '16px',
    flexShrink: 0,
  },
  runningText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightMedium,
  },
  toggleBtn: {
    minWidth: 'auto',
    padding: '2px',
  },
});

interface StreamingStepsProps {
  steps: StepItem[];
  defaultExpanded?: boolean;
}

export const StreamingSteps: React.FC<StreamingStepsProps> = ({
  steps,
  defaultExpanded = true,
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!steps || steps.length === 0) return null;

  const runningStep = steps.find((s) => s.status === 'running');
  const allCompleted = steps.every((s) => s.status === 'completed');

  return (
    <div className={styles.container} data-testid="streaming-steps">
      <div
        className={styles.header}
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          {runningStep ? (
            <>
              <Spinner size="extra-tiny" />
              <span className={styles.runningText}>{runningStep.title}</span>
            </>
          ) : allCompleted ? (
            <>
              <CheckmarkCircle16Filled className={styles.completedIcon} />
              <span>Шаги выполнения ({steps.length})</span>
            </>
          ) : (
            <span>Шаги выполнения ({steps.length})</span>
          )}
        </div>
        <Button
          appearance="subtle"
          size="small"
          className={styles.toggleBtn}
          icon={isExpanded ? <ChevronUp16Regular /> : <ChevronDown16Regular />}
          aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
        />
      </div>

      {isExpanded && (
        <div className={styles.stepList}>
          {steps.map((step) => (
            <div key={step.step_id} className={styles.stepItem} data-testid={`step-${step.step_id}`}>
              {step.status === 'running' && <Spinner size="extra-tiny" />}
              {step.status === 'completed' && (
                <CheckmarkCircle16Filled className={styles.completedIcon} />
              )}
              {step.status === 'failed' && (
                <DismissCircle16Filled className={styles.failedIcon} />
              )}
              <span
                className={step.status === 'running' ? styles.runningText : undefined}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
