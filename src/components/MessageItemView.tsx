import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
} from '@fluentui/react-components';
import {
  Bot20Regular,
  Person20Regular,
  ArrowReply16Regular,
  Info20Regular,
} from '@fluentui/react-icons';
import { MessageItem } from '../../contracts/front/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { EntityChips } from './EntityChips';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.margin(tokens.spacingVerticalS, 0),
    maxWidth: '100%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    maxWidth: '85%',
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    maxWidth: '96%',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.padding('4px', tokens.spacingHorizontalS),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    maxWidth: '90%',
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalXS,
    marginBottom: '4px',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: tokens.spacingVerticalXS,
    paddingTop: '4px',
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  replyBtn: {
    fontSize: tokens.fontSizeBase100,
    height: '22px',
    padding: '0 6px',
  },
  icon: {
    fontSize: '14px',
  },
});

interface MessageItemViewProps {
  message: MessageItem;
  onReply?: (message: MessageItem) => void;
  onCopyE1cib?: (url: string) => void;
}

export const MessageItemView: React.FC<MessageItemViewProps> = ({
  message,
  onReply,
  onCopyE1cib,
}) => {
  const styles = useStyles();

  if (message.role === 'system') {
    return (
      <div className={`${styles.container} ${styles.systemMessage}`} data-testid={`message-${message.id}`}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Info20Regular className={styles.icon} />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className={`${styles.container} ${styles.userMessage}`} data-testid={`message-${message.id}`}>
        <div className={styles.header}>
          <div className={styles.author}>
            <Person20Regular className={styles.icon} />
            <span>Вы</span>
          </div>
        </div>
        <MarkdownRenderer content={message.content} onCopyE1cib={onCopyE1cib} />
      </div>
    );
  }

  // Assistant message
  const expectedInputLabel =
    message.metadata?.expected_input === 'partner_search'
      ? 'Указать партнера'
      : message.metadata?.expected_input === 'deal_search'
      ? 'Указать сделку'
      : message.metadata?.expected_input === 'amount_input'
      ? 'Уточнить сумму'
      : 'Ответить';

  return (
    <div className={`${styles.container} ${styles.assistantMessage}`} data-testid={`message-${message.id}`}>
      <div className={styles.header}>
        <div className={styles.author}>
          <Bot20Regular className={styles.icon} />
          <span>Sherpa 1С Ассистент</span>
        </div>
      </div>

      <EntityChips summary={message.metadata?.extracted_summary} />

      <MarkdownRenderer content={message.content} onCopyE1cib={onCopyE1cib} />

      {onReply && (
        <div className={styles.actions}>
          <Button
            appearance="subtle"
            size="small"
            className={styles.replyBtn}
            icon={<ArrowReply16Regular />}
            onClick={() => onReply(message)}
            data-testid={`reply-action-${message.id}`}
            title="Ответить с цитированием контекста"
          >
            {expectedInputLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
