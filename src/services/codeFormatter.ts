import jsBeautify from 'js-beautify';

export interface FormatterOptions {
  indentSize?: number;
  wrapLineLength?: number;
  preserveNewlines?: boolean;
}

/**
 * Cleanly format and indent HTML documents including embedded CSS <style> and JS <script> tags.
 */
export function formatHtmlCode(rawHtml: string, options: FormatterOptions = {}): string {
  if (!rawHtml || !rawHtml.trim()) return rawHtml;

  const {
    indentSize = 2,
    wrapLineLength = 0,
    preserveNewlines = true
  } = options;

  try {
    // js-beautify html formatting with rich configuration
    const formatted = jsBeautify.html(rawHtml, {
      indent_size: indentSize,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: preserveNewlines,
      indent_inner_html: true,
      indent_scripts: 'normal',
      wrap_line_length: wrapLineLength,
      end_with_newline: true,
      extra_liners: ['head', 'body', '/html'],
      unformatted: ['b', 'i', 'span', 'code', 'kbd', 'strong', 'em'],
      content_unformatted: ['pre', 'textarea'],
    });

    return formatted;
  } catch (error) {
    console.warn('js-beautify formatting fallback engaged:', error);
    return fallbackRegexFormat(rawHtml, indentSize);
  }
}

/**
 * Regex-based formatting fallback in case of parser anomalies
 */
function fallbackRegexFormat(html: string, indentSize = 2): string {
  let formatted = '';
  let indentLevel = 0;
  const pad = ' '.repeat(indentSize);
  
  // Normalize tag boundaries
  const tokens = html
    .replace(/>\s*</g, '>\n<')
    .replace(/(\r\n|\n|\r)/gm, '\n')
    .split('\n');

  for (let rawLine of tokens) {
    let line = rawLine.trim();
    if (!line) continue;

    // Closing tag
    if (line.match(/^<\/\w/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted += pad.repeat(indentLevel) + line + '\n';

    // Opening tag that isn't void / self-closing
    if (
      line.match(/^<\w[^>]*[^\/]>$/) &&
      !line.startsWith('<!') &&
      !line.startsWith('<?') &&
      !line.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i)
    ) {
      indentLevel++;
    }
  }

  return formatted.trimEnd() + '\n';
}
