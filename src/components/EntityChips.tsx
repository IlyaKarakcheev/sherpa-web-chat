import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Building20Regular,
  DocumentBulletList20Regular,
  NumberSymbol20Regular,
  Money20Regular,
} from '@fluentui/react-icons';
import { ExtractedSummary } from '../../contracts/front/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    ...shorthands.margin(0, 0, tokens.spacingVerticalS, 0),
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightMedium,
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  companyChip: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
  },
  dealChip: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    border: `1px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  amountChip: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
  icon: {
    fontSize: '14px',
  },
});

interface EntityChipsProps {
  summary?: ExtractedSummary | null;
}

export const EntityChips: React.FC<EntityChipsProps> = ({ summary }) => {
  const styles = useStyles();

  if (!summary) return null;

  const { companies, deal_numbers, inn, amount } = summary;
  const hasEntities =
    (companies && companies.length > 0) ||
    (deal_numbers && deal_numbers.length > 0) ||
    (inn && inn.length > 0) ||
    amount;

  if (!hasEntities) return null;

  return (
    <div className={styles.container} data-testid="entity-chips">
      {companies?.map((company, idx) => (
        <span key={`comp-${idx}`} className={`${styles.chip} ${styles.companyChip}`} title="Контрагент">
          <Building20Regular className={styles.icon} />
          <span>{company}</span>
        </span>
      ))}

      {inn?.map((item, idx) => (
        <span key={`inn-${idx}`} className={styles.chip} title="ИНН">
          <NumberSymbol20Regular className={styles.icon} />
          <span>ИНН: {item}</span>
        </span>
      ))}

      {deal_numbers?.map((deal, idx) => (
        <span key={`deal-${idx}`} className={`${styles.chip} ${styles.dealChip}`} title="Сделка 1С">
          <DocumentBulletList20Regular className={styles.icon} />
          <span>Сделка {deal}</span>
        </span>
      ))}

      {amount && (
        <span className={`${styles.chip} ${styles.amountChip}`} title="Сумма">
          <Money20Regular className={styles.icon} />
          <span>{amount}</span>
        </span>
      )}
    </div>
  );
};
