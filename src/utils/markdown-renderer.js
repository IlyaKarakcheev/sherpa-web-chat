/**
 * MarkdownRenderer — утилитный рендерер безопасного парсинга Markdown,
 * таблиц, инлайн-кнопок [Label](cmd:Command) и директив блоков (:::deal-card, :::facts, :::placeholder).
 * Conforms to contracts/markdown-ui-spec.md
 */

class MarkdownRenderer {
  static escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static formatInline(str) {
    if (!str) return '';

    let formatted = this.escapeHtml(str);

    // Command links [Label](cmd:Command) -> <button class="chip-button suggestion-chip" data-chip="Command">Label</button>
    formatted = formatted.replace(/\[([^\]]+)\]\(cmd:([^)]+)\)/g, (match, label, cmd) => {
      let variantClass = '';
      let cleanLabel = label.trim();
      if (cleanLabel.startsWith('!')) {
        variantClass = ' primary';
        cleanLabel = cleanLabel.slice(1).trim();
      } else if (cleanLabel.startsWith('~')) {
        variantClass = ' subtle';
        cleanLabel = cleanLabel.slice(1).trim();
      }
      return `<button type="button" class="chip-button suggestion-chip${variantClass}" data-chip="${cmd}">${cleanLabel}</button>`;
    });

    // Bold + Italic
    formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline Code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return formatted;
  }

  static render(text, options = {}) {
    if (!text) return '';
    const updatePlaceholderFn = options.onUpdatePlaceholder || null;

    const lines = text.split('\n');
    const output = [];
    let inList = false;
    let listType = 'ul';
    let inTable = false;
    let tableRows = [];
    let inFactsBlock = false;
    let factsItems = [];
    let inDealCardBlock = false;
    let dealCardData = { title: '', match: '', meta: '', reasons: '' };
    let inPlaceholderBlock = false;
    let placeholderTextBuf = '';

    const flushList = () => {
      if (inList) {
        output.push(`</${listType}>`);
        inList = false;
      }
    };

    const flushFacts = () => {
      if (inFactsBlock && factsItems.length > 0) {
        let factsHtml = '<div class="facts">';
        factsItems.forEach(({ label, value }) => {
          factsHtml += `<div class="fact"><span>${this.escapeHtml(label)}</span><strong>${this.formatInline(value)}</strong></div>`;
        });
        factsHtml += '</div>';
        output.push(factsHtml);
        inFactsBlock = false;
        factsItems = [];
      }
    };

    const flushDealCard = () => {
      if (inDealCardBlock) {
        const cmdMatch = dealCardData.title.match(/\[([^\]]+)\]\(cmd:([^)]+)\)/);
        if (cmdMatch) {
          const rawLabel = cmdMatch[1].trim();
          const cmdText = cmdMatch[2].trim();
          let titleHtml = this.formatInline(rawLabel);
          if (!titleHtml.startsWith('<strong>')) {
            titleHtml = `<strong>${titleHtml}</strong>`;
          }
          let cardHtml = `<button type="button" class="option-card deal-card" data-chip="${this.escapeHtml(cmdText)}">`;
          cardHtml += `<div class="deal-top">${titleHtml}`;
          if (dealCardData.match) {
            cardHtml += `<span class="match">${this.escapeHtml(dealCardData.match)}</span>`;
          }
          cardHtml += '</div>';
          if (dealCardData.meta) {
            cardHtml += `<div class="deal-meta">${this.formatInline(dealCardData.meta)}</div>`;
          }
          if (dealCardData.reasons) {
            cardHtml += `<div class="reasons">${this.formatInline(dealCardData.reasons)}</div>`;
          }
          cardHtml += '</button>';
          output.push(cardHtml);
        } else {
          let titleHtml = this.formatInline(dealCardData.title);
          if (!titleHtml.startsWith('<strong>')) {
            titleHtml = `<strong>${titleHtml}</strong>`;
          }
          let cardHtml = '<div class="static-deal-card">';
          cardHtml += `<div class="deal-top">${titleHtml}`;
          if (dealCardData.match) {
            cardHtml += `<span class="match">${this.escapeHtml(dealCardData.match)}</span>`;
          }
          cardHtml += '</div>';
          if (dealCardData.meta) {
            cardHtml += `<div class="deal-meta">${this.formatInline(dealCardData.meta)}</div>`;
          }
          if (dealCardData.reasons) {
            cardHtml += `<div class="reasons">${this.formatInline(dealCardData.reasons)}</div>`;
          }
          cardHtml += '</div>';
          output.push(cardHtml);
        }
        inDealCardBlock = false;
        dealCardData = { title: '', match: '', meta: '', reasons: '' };
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        let tableHtml = '<div class="table-container"><table>';
        const [headerRow, ...bodyRows] = tableRows;

        if (headerRow) {
          tableHtml += '<thead><tr>';
          headerRow.forEach((cell) => {
            tableHtml += `<th>${this.formatInline(cell.trim())}</th>`;
          });
          tableHtml += '</tr></thead>';
        }

        if (bodyRows.length > 0) {
          tableHtml += '<tbody>';
          bodyRows.forEach((row) => {
            tableHtml += '<tr>';
            row.forEach((cell) => {
              tableHtml += `<td>${this.formatInline(cell.trim())}</td>`;
            });
            tableHtml += '</tr>';
          });
          tableHtml += '</tbody>';
        }

        tableHtml += '</table></div>';
        output.push(tableHtml);
        inTable = false;
        tableRows = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Placeholder block container (:::placeholder ... :::)
      if (trimmed.startsWith(':::placeholder')) {
        flushList();
        flushTable();
        flushFacts();
        flushDealCard();
        const inlineText = trimmed.replace(/^:::placeholder\s*/, '').replace(/\s*:::$/, '').trim();
        if (inlineText && inlineText !== ':::placeholder') {
          if (typeof updatePlaceholderFn === 'function') {
            updatePlaceholderFn(inlineText);
          }
        } else {
          inPlaceholderBlock = true;
          placeholderTextBuf = '';
        }
        continue;
      }
      if (trimmed === ':::' && inPlaceholderBlock) {
        if (placeholderTextBuf.trim() && typeof updatePlaceholderFn === 'function') {
          updatePlaceholderFn(placeholderTextBuf.trim());
        }
        inPlaceholderBlock = false;
        placeholderTextBuf = '';
        continue;
      }
      if (inPlaceholderBlock) {
        placeholderTextBuf += (placeholderTextBuf ? '\n' : '') + trimmed;
        continue;
      }

      // Facts block container (:::facts ... :::)
      if (trimmed === ':::facts') {
        flushList();
        flushTable();
        flushDealCard();
        inFactsBlock = true;
        factsItems = [];
        continue;
      }
      if (trimmed === ':::' && inFactsBlock) {
        flushFacts();
        continue;
      }
      if (inFactsBlock) {
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          const parts = itemText.split(/\s*::\s*/);
          if (parts.length >= 2) {
            const label = parts[0].replace(/\*\*/g, '').trim();
            const value = parts.slice(1).join(' :: ').trim();
            factsItems.push({ label, value });
          }
        }
        continue;
      }

      // Deal card container (:::deal-card ... :::)
      if (trimmed === ':::deal-card') {
        flushList();
        flushTable();
        flushFacts();
        inDealCardBlock = true;
        dealCardData = { title: '', match: '', meta: '', reasons: '' };
        continue;
      }
      if (trimmed === ':::' && inDealCardBlock) {
        flushDealCard();
        continue;
      }
      if (inDealCardBlock) {
        if (trimmed.includes('::')) {
          const parts = trimmed.split(/\s*::\s*/);
          dealCardData.title = parts[0].trim();
          dealCardData.match = parts[1].trim();
        } else if (!dealCardData.meta) {
          dealCardData.meta = trimmed;
        } else if (!dealCardData.reasons) {
          dealCardData.reasons = trimmed;
        }
        continue;
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        if (/^\|(\s*[-:]+\s*\|)+$/.test(trimmed)) {
          continue;
        }

        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(cells);
        continue;
      } else {
        flushTable();
      }

      // Unordered list
      if (/^[-*•]\s+(.*)/.test(trimmed)) {
        const match = trimmed.match(/^[-*•]\s+(.*)/);
        if (!inList || listType !== 'ul') {
          flushList();
          output.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        output.push(`<li>${this.formatInline(match[1])}</li>`);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+(.*)/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s+(.*)/);
        if (!inList || listType !== 'ol') {
          flushList();
          output.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        output.push(`<li>${this.formatInline(match[1])}</li>`);
        continue;
      }

      flushList();

      if (!trimmed) {
        continue;
      }

      // Headings
      if (/^###\s+(.*)/.test(trimmed)) {
        output.push(`<h3 class="bubble-heading">${this.formatInline(trimmed.replace(/^###\s+/, ''))}</h3>`);
        continue;
      }
      if (/^##\s+(.*)/.test(trimmed)) {
        output.push(`<h2 class="bubble-heading">${this.formatInline(trimmed.replace(/^##\s+/, ''))}</h2>`);
        continue;
      }
      if (/^#\s+(.*)/.test(trimmed)) {
        output.push(`<h1 class="bubble-heading">${this.formatInline(trimmed.replace(/^#\s+/, ''))}</h1>`);
        continue;
      }

      // Divider
      if (/^---$/.test(trimmed)) {
        output.push('<hr class="bubble-divider" />');
        continue;
      }

      if (/^●\s+(.*)/.test(trimmed)) {
        output.push(`<div class="analysis-status">${this.formatInline(trimmed.replace(/^●\s+/, ''))}</div>`);
        continue;
      }

      if (/^✓\s+(.*)/.test(trimmed)) {
        output.push(`<p class="done-line"><span class="done-mark" aria-hidden="true">✓</span>${this.formatInline(trimmed.replace(/^✓\s+/, ''))}</p>`);
        continue;
      }

      // Paragraph
      output.push(`<p>${this.formatInline(trimmed)}</p>`);
    }

    flushList();
    flushTable();
    flushFacts();
    flushDealCard();

    return output.join('');
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.MarkdownRenderer = MarkdownRenderer;
}
if (typeof window !== 'undefined') {
  window.MarkdownRenderer = MarkdownRenderer;
}
