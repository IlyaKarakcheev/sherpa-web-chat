import React, { useEffect } from 'react';
import {
  Button,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { ArrowReply16Regular, Dismiss16Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  banner: {
    height: '28px',
    maxHeight: '28px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    backgroundColor: tokens.colorBrandBackground2,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground2,
    overflow: 'hidden',
    ...shorthands.margin(0, 0, '4px', 0),
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexGrow: 1,
  },
  icon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0,
  },
  text: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    minWidth: '20px',
    width: '20px',
    height: '20px',
    padding: '0',
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
});

interface ReplyBannerProps {
  replyText: string;
  onClose: () => void;
}

export const ReplyBanner: React.FC<ReplyBannerProps> = ({
  replyText,
  onClose,
}) => {
  const styles = useStyles();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!replyText) return null;

  return (
    <div className={styles.banner} data-testid="reply-banner">
      <div className={styles.content}>
        <ArrowReply16Regular className={styles.icon} />
        <span className={styles.label}>Ответ на:</span>
        <span className={styles.text} title={replyText}>
          {replyText}
        </span>
      </div>
      <Button
        appearance="subtle"
        size="small"
        className={styles.closeBtn}
        icon={<Dismiss16Regular />}
        onClick={onClose}
        aria-label="Отменить ответ (Esc)"
        title="Отменить ответ (Esc)"
        data-testid="reply-banner-close"
      />
    </div>
  );
};
