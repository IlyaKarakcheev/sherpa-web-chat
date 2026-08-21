import React, { useEffect } from 'react';
import {
  Button,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    ...shorthands.margin(tokens.spacingVerticalXS, 0),
  },
  button: {
    fontSize: tokens.fontSizeBase200,
    height: '28px',
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    textAlign: 'left',
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: '100%',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  numberBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    marginRight: '6px',
    flexShrink: 0,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string, index: number) => void;
  disabled?: boolean;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  suggestions,
  onSelect,
  disabled = false,
}) => {
  const styles = useStyles();

  useEffect(() => {
    if (disabled || !suggestions || suggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is currently typing in an input or textarea that has content, don't hijack unless modifier not pressed
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // If active target is an input and has non-empty value, allow normal number typing
      if (isInput) {
        const inputElem = target as HTMLInputElement | HTMLTextAreaElement;
        if (inputElem.value && inputElem.value.trim().length > 0) {
          return;
        }
      }

      // Check if pressed key is 1..9
      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= suggestions.length) {
        // Prevent default only if we handle it
        e.preventDefault();
        const index = digit - 1;
        onSelect(suggestions[index], index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [suggestions, onSelect, disabled]);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={styles.container} data-testid="quick-replies">
      {suggestions.map((suggestion, idx) => {
        // Clean suggestion label if it already has leading "1. " or "2. "
        const cleanedLabel = suggestion.replace(/^\d+\.\s*/, '');
        const itemNumber = idx + 1;

        return (
          <Button
            key={`sug-${idx}`}
            appearance="secondary"
            size="small"
            className={styles.button}
            disabled={disabled}
            onClick={() => onSelect(suggestion, idx)}
            data-testid={`quick-reply-${itemNumber}`}
            title={`Нажмите ${itemNumber} на клавиатуре`}
          >
            <span className={styles.numberBadge}>{itemNumber}</span>
            <span className={styles.label}>{cleanedLabel}</span>
          </Button>
        );
      })}
    </div>
  );
};
