import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import {
  ErrorCircle20Filled,
  Warning20Filled,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { ProtocolErrorEnvelope } from '../../contracts/front/types';
import { MarkdownRenderer } from './MarkdownRenderer';

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.margin(tokens.spacingVerticalS, 0),
    backgroundColor: tokens.colorPaletteRedBackground2,
    border: `1px solid ${tokens.colorPaletteRedBorder2}`,
    color: tokens.colorNeutralForeground1,
  },
  collisionBanner: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground2,
    border: `1px solid ${tokens.colorPaletteDarkOrangeBorder2}`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  warningIcon: {
    color: tokens.colorPaletteDarkOrangeForeground1,
  },
  message: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
  },
  recovery: {
    fontSize: tokens.fontSizeBase200,
    marginTop: '4px',
    paddingTop: '4px',
    borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
  },
  closeBtn: {
    minWidth: '20px',
    width: '20px',
    height: '20px',
    padding: '0',
  },
});

interface ErrorBannerProps {
  error: ProtocolErrorEnvelope | string | null;
  onDismiss?: () => void;
  onCopyE1cib?: (url: string) => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  onCopyE1cib,
}) => {
  const styles = useStyles();

  if (!error) return null;

  const isEnvelope = typeof error !== 'string' && 'error' in error;
  const errorDetail = isEnvelope ? error.error : null;
  const isCollision = errorDetail?.code === 'ALREADY_PROCESSED';
  const errorMessage = isEnvelope ? errorDetail?.message : error;
  const recoveryText = errorDetail?.suggested_recovery;

  return (
    <div
      className={`${styles.banner} ${isCollision ? styles.collisionBanner : ''}`}
      data-testid="error-banner"
      data-error-code={errorDetail?.code}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {isCollision ? (
            <Warning20Filled className={styles.warningIcon} />
          ) : (
            <ErrorCircle20Filled className={styles.errorIcon} />
          )}
          <span>
            {isCollision
              ? 'Письмо уже связано'
              : errorDetail?.code
              ? `Ошибка (${errorDetail.code})`
              : 'Ошибка'}
          </span>
        </div>
        {onDismiss && (
          <Button
            appearance="subtle"
            size="small"
            className={styles.closeBtn}
            icon={<Dismiss16Regular />}
            onClick={onDismiss}
            aria-label="Закрыть уведомление"
          />
        )}
      </div>

      <div className={styles.message}>
        <MarkdownRenderer content={errorMessage || 'Произошла непредвиденная ошибка'} onCopyE1cib={onCopyE1cib} />
      </div>

      {recoveryText && (
        <div className={styles.recovery}>
          <strong>Рекомендация: </strong>
          <MarkdownRenderer content={recoveryText} onCopyE1cib={onCopyE1cib} />
        </div>
      )}
    </div>
  );
};
