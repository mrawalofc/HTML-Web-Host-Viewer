import { CssLintDiagnostic, LintSeverity } from '../types';

// Standard known CSS properties
const KNOWN_CSS_PROPERTIES = new Set([
  'align-content', 'align-items', 'align-self', 'all', 'animation', 'animation-delay',
  'animation-direction', 'animation-duration', 'animation-fill-mode', 'animation-iteration-count',
  'animation-name', 'animation-play-state', 'animation-timing-function', 'appearance',
  'aspect-ratio', 'backdrop-filter', 'backface-visibility', 'background', 'background-attachment',
  'background-blend-mode', 'background-clip', 'background-color', 'background-image',
  'background-origin', 'background-position', 'background-position-x', 'background-position-y',
  'background-repeat', 'background-size', 'block-size', 'border', 'border-block',
  'border-block-color', 'border-block-end', 'border-block-start', 'border-block-style',
  'border-block-width', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius',
  'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width', 'border-collapse',
  'border-color', 'border-image', 'border-image-outset', 'border-image-repeat',
  'border-image-slice', 'border-image-source', 'border-image-width', 'border-inline',
  'border-inline-color', 'border-inline-end', 'border-inline-start', 'border-inline-style',
  'border-inline-width', 'border-left', 'border-left-color', 'border-left-style',
  'border-left-width', 'border-radius', 'border-right', 'border-right-color',
  'border-right-style', 'border-right-width', 'border-spacing', 'border-style',
  'border-top', 'border-top-color', 'border-top-left-radius', 'border-top-right-radius',
  'border-top-style', 'border-top-width', 'border-width', 'bottom', 'box-decoration-break',
  'box-shadow', 'box-sizing', 'break-after', 'break-before', 'break-inside', 'caption-side',
  'caret-color', 'clear', 'clip', 'clip-path', 'color', 'color-scheme', 'column-count',
  'column-fill', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-style',
  'column-rule-width', 'column-span', 'column-width', 'columns', 'contain', 'content',
  'content-visibility', 'counter-increment', 'counter-reset', 'counter-set', 'cursor',
  'direction', 'display', 'empty-cells', 'filter', 'flex', 'flex-basis', 'flex-direction',
  'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap', 'float', 'font', 'font-family',
  'font-feature-settings', 'font-kerning', 'font-optical-sizing', 'font-size',
  'font-size-adjust', 'font-stretch', 'font-style', 'font-synthesis', 'font-variant',
  'font-variant-caps', 'font-variant-east-asian', 'font-variant-ligatures',
  'font-variant-numeric', 'font-variant-position', 'font-weight', 'gap', 'grid',
  'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows', 'grid-column',
  'grid-column-end', 'grid-column-gap', 'grid-column-start', 'grid-gap', 'grid-row',
  'grid-row-end', 'grid-row-gap', 'grid-row-start', 'grid-template', 'grid-template-areas',
  'grid-template-columns', 'grid-template-rows', 'hanging-punctuation', 'height',
  'hyphens', 'image-orientation', 'image-rendering', 'inline-size', 'inset', 'inset-block',
  'inset-inline', 'isolation', 'justify-content', 'justify-items', 'justify-self',
  'left', 'letter-spacing', 'line-break', 'line-height', 'list-style', 'list-style-image',
  'list-style-position', 'list-style-type', 'margin', 'margin-block', 'margin-block-end',
  'margin-block-start', 'margin-bottom', 'margin-inline', 'margin-inline-end',
  'margin-inline-start', 'margin-left', 'margin-right', 'margin-top', 'mask',
  'mask-clip', 'mask-composite', 'mask-image', 'mask-mode', 'mask-origin',
  'mask-position', 'mask-repeat', 'mask-size', 'mask-type', 'max-block-size',
  'max-height', 'max-inline-size', 'max-width', 'min-block-size', 'min-height',
  'min-inline-size', 'min-width', 'mix-blend-mode', 'object-fit', 'object-position',
  'offset', 'offset-anchor', 'offset-distance', 'offset-path', 'offset-rotate',
  'opacity', 'order', 'orphans', 'outline', 'outline-color', 'outline-offset',
  'outline-style', 'outline-width', 'overflow', 'overflow-anchor', 'overflow-block',
  'overflow-clip-margin', 'overflow-inline', 'overflow-wrap', 'overflow-x',
  'overflow-y', 'overscroll-behavior', 'overscroll-behavior-block',
  'overscroll-behavior-inline', 'overscroll-behavior-x', 'overscroll-behavior-y',
  'padding', 'padding-block', 'padding-block-end', 'padding-block-start',
  'padding-bottom', 'padding-inline', 'padding-inline-end', 'padding-inline-start',
  'padding-left', 'padding-right', 'padding-top', 'page-break-after',
  'page-break-before', 'page-break-inside', 'perspective', 'perspective-origin',
  'place-content', 'place-items', 'place-self', 'pointer-events', 'position',
  'print-color-adjust', 'quotes', 'resize', 'right', 'rotate', 'row-gap', 'scale',
  'scroll-behavior', 'scroll-margin', 'scroll-margin-block', 'scroll-margin-bottom',
  'scroll-margin-inline', 'scroll-margin-left', 'scroll-margin-right', 'scroll-margin-top',
  'scroll-padding', 'scroll-padding-block', 'scroll-padding-bottom', 'scroll-padding-inline',
  'scroll-padding-left', 'scroll-padding-right', 'scroll-padding-top', 'scroll-snap-align',
  'scroll-snap-stop', 'scroll-snap-type', 'scrollbar-color', 'scrollbar-width',
  'shape-image-threshold', 'shape-margin', 'shape-outside', 'tab-size', 'table-layout',
  'text-align', 'text-align-last', 'text-combine-upright', 'text-decoration',
  'text-decoration-color', 'text-decoration-line', 'text-decoration-skip-ink',
  'text-decoration-style', 'text-decoration-thickness', 'text-emphasis',
  'text-emphasis-color', 'text-emphasis-position', 'text-emphasis-style',
  'text-indent', 'text-justify', 'text-orientation', 'text-overflow',
  'text-rendering', 'text-shadow', 'text-size-adjust', 'text-transform',
  'text-underline-offset', 'text-underline-position', 'top', 'touch-action',
  'transform', 'transform-box', 'transform-origin', 'transform-style', 'transition',
  'transition-delay', 'transition-duration', 'transition-property',
  'transition-timing-function', 'translate', 'unicode-bidi', 'user-select',
  'vertical-align', 'visibility', 'white-space', 'widows', 'width', 'will-change',
  'word-break', 'word-spacing', 'word-wrap', 'writing-mode', 'z-index'
]);

// Known common typo mappings
const COMMON_TYPOS: Record<string, string> = {
  'colr': 'color',
  'clor': 'color',
  'colour': 'color',
  'backgroud': 'background',
  'backgorund': 'background',
  'bkground': 'background',
  'backround': 'background',
  'bg-color': 'background-color',
  'widht': 'width',
  'wdith': 'width',
  'witdh': 'width',
  'widh': 'width',
  'heigth': 'height',
  'hieght': 'height',
  'heigt': 'height',
  'heigh': 'height',
  'pading': 'padding',
  'paddng': 'padding',
  'padidng': 'padding',
  'margn': 'margin',
  'magin': 'margin',
  'mrgin': 'margin',
  'font-weigth': 'font-weight',
  'font-wieght': 'font-weight',
  'font-sizee': 'font-size',
  'font-famly': 'font-family',
  'font-familiy': 'font-family',
  'text-algn': 'text-align',
  'text-aling': 'text-align',
  'text-alignm': 'text-align',
  'text-decortion': 'text-decoration',
  'z-idnex': 'z-index',
  'z-indexx': 'z-index',
  'zindex': 'z-index',
  'positon': 'position',
  'postition': 'position',
  'positin': 'position',
  'disply': 'display',
  'dsplay': 'display',
  'dispaly': 'display',
  'boder': 'border',
  'bordr': 'border',
  'border-radus': 'border-radius',
  'border-raduis': 'border-radius',
  'transfrom': 'transform',
  'trasnform': 'transform',
  'transiton': 'transition',
  'transistion': 'transition',
  'justfy-content': 'justify-content',
  'justify-contnet': 'justify-content',
  'align-item': 'align-items',
  'align-itmes': 'align-items',
  'flex-diection': 'flex-direction',
  'flex-direciton': 'flex-direction',
  'overlfow': 'overflow',
  'overfow': 'overflow',
  'opaciy': 'opacity',
  'opcity': 'opacity',
  'box-shodow': 'box-shadow',
  'box-shadwo': 'box-shadow',
  'cursor-pointer': 'cursor',
  'line-heigth': 'line-height',
  'lineheight': 'line-height'
};

// Properties requiring units for non-zero numbers
const LENGTH_PROPERTIES = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'top', 'right', 'bottom', 'left', 'font-size', 'letter-spacing', 'word-spacing',
  'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'gap', 'row-gap', 'column-gap', 'flex-basis', 'outline-width', 'outline-offset'
]);

interface StyleBlock {
  content: string;
  startLine: number;
  startCol: number;
  isInline: boolean;
}

/**
 * Extract all CSS style blocks from an HTML or pure CSS string
 */
function extractStyleBlocks(documentText: string): StyleBlock[] {
  const blocks: StyleBlock[] = [];
  const lines = documentText.split('\n');

  // Check if this is pure CSS (no <html>, <body>, <style> tags)
  const isPureCss = !documentText.includes('<html') &&
                    !documentText.includes('<body') &&
                    !documentText.includes('<head') &&
                    !documentText.includes('<div') &&
                    !documentText.includes('<style');

  if (isPureCss) {
    blocks.push({
      content: documentText,
      startLine: 1,
      startCol: 1,
      isInline: false,
    });
    return blocks;
  }

  // Find <style> ... </style> blocks
  const styleTagRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = styleTagRegex.exec(documentText)) !== null) {
    const fullMatch = match[0];
    const cssContent = match[1];
    const tagOpenIndex = match.index;
    const contentStartIndex = tagOpenIndex + fullMatch.indexOf(cssContent);

    // Calculate line and col for start of CSS content
    const textBefore = documentText.substring(0, contentStartIndex);
    const splitLines = textBefore.split('\n');
    const startLine = splitLines.length;
    const startCol = splitLines[splitLines.length - 1].length + 1;

    blocks.push({
      content: cssContent,
      startLine,
      startCol,
      isInline: false,
    });
  }

  // Find inline style="..." attributes
  const inlineStyleRegex = /style\s*=\s*["']([^"']+)["']/gi;
  while ((match = inlineStyleRegex.exec(documentText)) !== null) {
    const styleAttrContent = match[1];
    const attrStartIndex = match.index + match[0].indexOf(styleAttrContent);

    const textBefore = documentText.substring(0, attrStartIndex);
    const splitLines = textBefore.split('\n');
    const startLine = splitLines.length;
    const startCol = splitLines[splitLines.length - 1].length + 1;

    // Wrap inline style in dummy selector for parsing
    blocks.push({
      content: `inline-dummy { ${styleAttrContent} }`,
      startLine,
      startCol,
      isInline: true,
    });
  }

  return blocks;
}

/**
 * Main real-time CSS linting function
 */
export function lintCssCode(fullCode: string): CssLintDiagnostic[] {
  if (!fullCode || !fullCode.trim()) return [];

  const diagnostics: CssLintDiagnostic[] = [];
  const blocks = extractStyleBlocks(fullCode);

  let diagCounter = 0;
  const createId = () => `css-lint-${++diagCounter}`;

  for (const block of blocks) {
    lintSingleBlock(block, diagnostics, createId);
  }

  // Sort by line number ascending
  return diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);
}

/**
 * Lint an individual CSS block
 */
function lintSingleBlock(
  block: StyleBlock,
  diagnostics: CssLintDiagnostic[],
  createId: () => string
) {
  const { content, startLine, startCol, isInline } = block;
  const rawLines = content.split('\n');

  // 1. Check for unclosed comments: /* without */
  const openCommentIdx = content.lastIndexOf('/*');
  const closeCommentIdx = content.lastIndexOf('*/');
  if (openCommentIdx !== -1 && openCommentIdx > closeCommentIdx) {
    const textBefore = content.substring(0, openCommentIdx);
    const lineOffset = textBefore.split('\n').length - 1;
    diagnostics.push({
      id: createId(),
      line: startLine + lineOffset,
      column: 1,
      severity: 'error',
      rule: 'css/unclosed-comment',
      message: 'Unclosed CSS comment (missing "*/")',
      suggestion: 'Add "*/" to close the comment block'
    });
  }

  // 2. Count curly braces { } balance
  let openBraces = 0;
  let inString: string | null = null;
  let inComment = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (!inComment && !inString && char === '/' && nextChar === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (inComment && char === '*' && nextChar === '/') {
      inComment = false;
      i++;
      continue;
    }
    if (inComment) continue;

    if (!inString && (char === '"' || char === "'")) {
      inString = char;
      continue;
    } else if (inString && char === inString && content[i - 1] !== '\\') {
      inString = null;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
  }

  if (openBraces > 0 && !isInline) {
    diagnostics.push({
      id: createId(),
      line: startLine + rawLines.length - 1,
      column: 1,
      severity: 'error',
      rule: 'css/unclosed-brace',
      message: `Missing ${openBraces} closing brace(s) "}" in style block`,
      suggestion: 'Add "}" to close open rule or media query'
    });
  } else if (openBraces < 0 && !isInline) {
    diagnostics.push({
      id: createId(),
      line: startLine,
      column: 1,
      severity: 'error',
      rule: 'css/extra-closing-brace',
      message: `Extra closing brace "}" detected`,
      suggestion: 'Remove unmatched "}" brace'
    });
  }

  // 3. Line-by-line linting for rules, properties, units, and syntax
  let currentSelector = '';
  let insideRule = isInline;
  let seenPropertiesInRule = new Set<string>();

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex];
    const trimmed = rawLine.trim();
    const currentDocLine = startLine + lineIndex;

    if (!trimmed || trimmed.startsWith('/*') || trimmed.endsWith('*/')) {
      continue;
    }

    // Check for unclosed quote on this line
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      diagnostics.push({
        id: createId(),
        line: currentDocLine,
        column: Math.max(1, rawLine.indexOf(singleQuotes % 2 !== 0 ? "'" : '"') + 1),
        severity: 'warning',
        rule: 'css/unclosed-string',
        message: 'Unclosed string quote detected in CSS',
        suggestion: 'Close the string quote properly'
      });
    }

    // Detect empty rule set: e.g. .btn { } or div {}
    const emptyRuleMatch = trimmed.match(/^([^{]+)\{\s*\}$/);
    if (emptyRuleMatch && !isInline) {
      diagnostics.push({
        id: createId(),
        line: currentDocLine,
        column: 1,
        severity: 'info',
        rule: 'css/empty-ruleset',
        message: `Empty CSS rule set for "${emptyRuleMatch[1].trim()}"`,
        suggestion: 'Add declarations or remove empty rule'
      });
      continue;
    }

    // Detect opening rule block
    if (trimmed.includes('{')) {
      insideRule = true;
      seenPropertiesInRule = new Set<string>();
      currentSelector = trimmed.substring(0, trimmed.indexOf('{')).trim();

      // Check for misplaced colon in selector like "div: {" or ".header: {"
      if (currentSelector.endsWith(':') && !currentSelector.includes('::') && !currentSelector.match(/:(hover|focus|active|visited|before|after|disabled|root|first-child|last-child|nth-child)/)) {
        diagnostics.push({
          id: createId(),
          line: currentDocLine,
          column: rawLine.indexOf(':') + 1,
          severity: 'error',
          rule: 'css/invalid-selector-colon',
          message: `Unexpected trailing colon in selector "${currentSelector}"`,
          suggestion: 'Remove trailing colon before "{"'
        });
      }
    }

    // Detect closing rule block
    if (trimmed.includes('}')) {
      insideRule = false;
      seenPropertiesInRule.clear();
    }

    // If we're inside a declaration block, check for properties
    if (insideRule || isInline) {
      // Split multiple declarations on same line: color: red; margin: 10px;
      const declarations = trimmed.split(';');

      for (let d = 0; d < declarations.length; d++) {
        const decl = declarations[d].trim();
        // Ignore empty decl or opening/closing brackets
        if (!decl || decl === '{' || decl === '}' || decl.startsWith('@')) continue;

        // Check missing colon: e.g. "color red"
        if (!decl.includes(':') && !decl.includes('{') && !decl.includes('}')) {
          if (decl.length > 2 && !decl.startsWith('/*')) {
            diagnostics.push({
              id: createId(),
              line: currentDocLine,
              column: Math.max(1, rawLine.indexOf(decl) + 1),
              severity: 'error',
              rule: 'css/missing-colon',
              message: `Missing colon ":" in CSS declaration "${decl}"`,
              suggestion: 'Use "property: value;" syntax'
            });
          }
          continue;
        }

        const colonIdx = decl.indexOf(':');
        if (colonIdx === -1) continue;

        const propName = decl.substring(0, colonIdx).trim().toLowerCase();
        const propValue = decl.substring(colonIdx + 1).trim();

        // 4. Missing value check
        if (!propValue && d < declarations.length - 1) {
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: rawLine.indexOf(propName) + 1,
            severity: 'error',
            rule: 'css/empty-property-value',
            message: `Property "${propName}" has no value specified`,
            suggestion: 'Provide a valid value or remove declaration'
          });
          continue;
        }

        // 5. Check typo in property name
        if (COMMON_TYPOS[propName]) {
          const suggestedProp = COMMON_TYPOS[propName];
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: Math.max(1, rawLine.indexOf(propName) + 1),
            severity: 'error',
            rule: 'css/property-typo',
            message: `Unknown property "${propName}". Did you mean "${suggestedProp}"?`,
            suggestion: `Replace "${propName}" with "${suggestedProp}"`
          });
        } else if (
          !KNOWN_CSS_PROPERTIES.has(propName) &&
          !propName.startsWith('-webkit-') &&
          !propName.startsWith('-moz-') &&
          !propName.startsWith('-ms-') &&
          !propName.startsWith('--') && // CSS custom property (variables) are valid
          propName.match(/^[a-z-]+$/) &&
          propName.length > 2
        ) {
          // Flag potential unknown property
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: Math.max(1, rawLine.indexOf(propName) + 1),
            severity: 'warning',
            rule: 'css/unknown-property',
            message: `Unknown CSS property "${propName}"`,
            suggestion: 'Verify property name spelling'
          });
        }

        // 6. Duplicate property in same rule
        if (seenPropertiesInRule.has(propName) && !propName.startsWith('--')) {
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: Math.max(1, rawLine.indexOf(propName) + 1),
            severity: 'warning',
            rule: 'css/duplicate-property',
            message: `Duplicate property "${propName}" in the same rule set`,
            suggestion: 'Remove redundant property declaration'
          });
        } else {
          seenPropertiesInRule.add(propName);
        }

        // 7. Check for unitless length values (e.g. width: 100 or font-size: 16)
        if (LENGTH_PROPERTIES.has(propName)) {
          // Check if value is a pure non-zero number without units: e.g. "100" or "50 20"
          const unitlessMatch = propValue.match(/^([1-9]\d*)(\s+([1-9]\d*))*$/);
          if (unitlessMatch && propValue !== '0') {
            diagnostics.push({
              id: createId(),
              line: currentDocLine,
              column: Math.max(1, rawLine.indexOf(propValue) + 1),
              severity: 'error',
              rule: 'css/missing-unit',
              message: `Unitless length "${propValue}" for property "${propName}". In CSS, numbers require units like "px", "rem", or "%"`,
              suggestion: `Change "${propValue}" to "${propValue}px"`
            });
          }
        }

        // 8. Deprecated values (e.g. cursor: hand)
        if (propName === 'cursor' && propValue.toLowerCase() === 'hand') {
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: Math.max(1, rawLine.indexOf(propValue) + 1),
            severity: 'warning',
            rule: 'css/deprecated-cursor-hand',
            message: '"cursor: hand" is non-standard and obsolete',
            suggestion: 'Use "cursor: pointer;" instead'
          });
        }

        // 9. Check misspelled !important (e.g. !importent)
        if (propValue.includes('!importent') || propValue.includes('!importan')) {
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: Math.max(1, rawLine.indexOf('!') + 1),
            severity: 'error',
            rule: 'css/misspelled-important',
            message: 'Misspelled "!important" directive',
            suggestion: 'Change to "!important"'
          });
        }
      }

      // Check if line looks like a declaration but is missing ending semicolon when followed by another line
      if (
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.startsWith('@') &&
        trimmed.includes(':') &&
        lineIndex < rawLines.length - 1
      ) {
        const nextTrimmed = rawLines[lineIndex + 1].trim();
        if (nextTrimmed && !nextTrimmed.startsWith('}') && nextTrimmed.includes(':')) {
          diagnostics.push({
            id: createId(),
            line: currentDocLine,
            column: rawLine.length,
            severity: 'warning',
            rule: 'css/missing-semicolon',
            message: `Missing semicolon ";" at end of declaration "${trimmed}"`,
            suggestion: 'Add ";" at the end of declaration'
          });
        }
      }
    }
  }
}
