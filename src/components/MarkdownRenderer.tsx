import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Link,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { Copy16Regular, DocumentSearch16Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground1,
    '& p': {
      ...shorthands.margin(0, 0, tokens.spacingVerticalS, 0),
      '&:last-child': {
        marginBottom: 0,
      },
    },
    '& strong': {
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& ul, & ol': {
      ...shorthands.margin(0, 0, tokens.spacingVerticalS, 0),
      ...shorthands.padding(0, 0, 0, tokens.spacingHorizontalL),
    },
    '& li': {
      marginBottom: tokens.spacingVerticalXS,
    },
    '& blockquote': {
      ...shorthands.margin(0, 0, tokens.spacingVerticalS, 0),
      ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalM),
      borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground2,
    },
    '& code': {
      fontFamily: tokens.fontFamilyMonospace,
      backgroundColor: tokens.colorNeutralBackground3,
      ...shorthands.padding('2px', '4px'),
      ...shorthands.borderRadius(tokens.borderRadiusSmall),
      fontSize: tokens.fontSizeBase200,
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      ...shorthands.margin(tokens.spacingVerticalS, 0),
      fontSize: tokens.fontSizeBase200,
    },
    '& th': {
      backgroundColor: tokens.colorNeutralBackground4,
      ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
      ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
      textAlign: 'left',
      fontWeight: tokens.fontWeightSemibold,
    },
    '& td': {
      ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
      ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    },
  },
  e1cibLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorBrandForeground1,
    textDecorationLine: 'underline',
    ':hover': {
      color: tokens.colorBrandForeground2,
    },
  },
  linkIcon: {
    fontSize: '14px',
    verticalAlign: 'middle',
  },
});

interface MarkdownRendererProps {
  content: string;
  onCopyE1cib?: (url: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCopyE1cib,
}) => {
  const styles = useStyles();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, rawHref?: string) => {
    if (!rawHref) return;
    const decodedHref = decodeURI(rawHref);
    // Intercept 1C e1cib links
    if (decodedHref.startsWith('e1cib') || decodedHref.includes('e1cib/data')) {
      e.preventDefault();
      e.stopPropagation();
      if (onCopyE1cib) {
        onCopyE1cib(decodedHref);
      } else if (navigator?.clipboard) {
        navigator.clipboard.writeText(decodedHref);
      }
    }
  };

  return (
    <div className={styles.container}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const rawHref = href || '';
            const decodedHref = decodeURI(rawHref);
            const isE1cib = decodedHref.startsWith('e1cib') || decodedHref.includes('e1cib/data');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { node, ref: _ref, ...rest } = props as any;
            if (isE1cib) {
              return (
                <a
                  href={decodedHref}
                  className={styles.e1cibLink}
                  onClick={(e) => handleLinkClick(e, rawHref)}
                  title={`1С Ссылка: ${decodedHref} (кликните для копирования)`}
                  data-testid="e1cib-link"
                  {...rest}
                >
                  <DocumentSearch16Regular className={styles.linkIcon} />
                  <span>{children}</span>
                  <Copy16Regular className={styles.linkIcon} />
                </a>
              );
            }
            return (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...rest}
              >
                {children}
              </Link>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
