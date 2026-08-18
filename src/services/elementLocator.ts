import { InspectedElement, ElementLocation } from '../types';

export type { ElementLocation };

/**
 * Locate an element in raw HTML code using tag name, attributes, ID, class, or text
 */
export function locateElementInCode(html: string, element: InspectedElement): ElementLocation | null {
  if (!html || !element) return null;

  // Strategy 1: Match by unique ID if present (e.g. id="my-btn" or id='my-btn')
  if (element.id) {
    const idRegex = new RegExp(`<${element.tagName}[^>]*\\bid=["']${element.id}["'][^>]*>`, 'i');
    const match = idRegex.exec(html);
    if (match) {
      return getCoordinates(html, match.index, match[0]);
    }
  }

  // Strategy 2: Match by exact outerHTML snippet prefix (e.g. opening tag)
  const openingTagMatch = element.outerHTML.match(/^<[^>]+>/);
  if (openingTagMatch) {
    const openingTag = openingTagMatch[0];
    const idx = html.indexOf(openingTag);
    if (idx !== -1) {
      return getCoordinates(html, idx, openingTag);
    }
  }

  // Strategy 3: Match by tag name + full class string
  if (element.className && typeof element.className === 'string' && element.className.trim()) {
    const escapedClass = element.className.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classRegex = new RegExp(`<${element.tagName}[^>]*\\bclass=["'][^"']*${escapedClass}[^"']*["'][^>]*>`, 'i');
    const match = classRegex.exec(html);
    if (match) {
      return getCoordinates(html, match.index, match[0]);
    }
  }

  // Strategy 4: Match by distinct attribute (e.g., href, src, type, name, data-*)
  for (const attr of element.attributes) {
    if (['href', 'src', 'name', 'placeholder', 'alt', 'title'].includes(attr.name) && attr.value) {
      const escapedVal = attr.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const attrRegex = new RegExp(`<${element.tagName}[^>]*\\b${attr.name}=["']${escapedVal}["'][^>]*>`, 'i');
      const match = attrRegex.exec(html);
      if (match) {
        return getCoordinates(html, match.index, match[0]);
      }
    }
  }

  // Strategy 5: Match by unique text content inside tag
  if (element.textContent && element.textContent.length >= 3) {
    const snippet = element.textContent.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const textRegex = new RegExp(`<${element.tagName}[^>]*>[^<]*${snippet}`, 'i');
    const match = textRegex.exec(html);
    if (match) {
      return getCoordinates(html, match.index, match[0]);
    }
  }

  // Strategy 6: Fallback to first occurrence of tag name
  const fallbackRegex = new RegExp(`<${element.tagName}\\b[^>]*>`, 'i');
  const match = fallbackRegex.exec(html);
  if (match) {
    return getCoordinates(html, match.index, match[0]);
  }

  return null;
}

function getCoordinates(html: string, index: number, matchedString: string): ElementLocation {
  const textBefore = html.substring(0, index);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;

  return {
    startIndex: index,
    endIndex: index + matchedString.length,
    line,
    col,
    column: col,
    matchedString,
  };
}
