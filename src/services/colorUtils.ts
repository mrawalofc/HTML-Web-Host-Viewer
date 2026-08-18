export interface DetectedColor {
  raw: string;
  type: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
  startIndex: number;
  endIndex: number;
  line: number;
  col: number;
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
}

// Convert any color string to normalized Hex and RGBA
export function parseColor(colorStr: string): { hex: string; rgba: { r: number; g: number; b: number; a: number } } | null {
  const trimmed = colorStr.trim();

  // Hex (#fff, #ffffff, #ffffffff, #ffff)
  if (trimmed.startsWith('#')) {
    const hex = trimmed.replace('#', '');
    let r = 0, g = 0, b = 0, a = 1;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = Math.round((parseInt(hex[3] + hex[3], 16) / 255) * 100) / 100;
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      a = Math.round((parseInt(hex.substring(6, 8), 16) / 255) * 100) / 100;
    } else {
      return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;

    const standardHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return { hex: standardHex, rgba: { r, g, b, a } };
  }

  // RGB / RGBA
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    let r = rgbMatch[1].endsWith('%') ? Math.round(parseFloat(rgbMatch[1]) * 2.55) : parseInt(rgbMatch[1], 10);
    let g = rgbMatch[2].endsWith('%') ? Math.round(parseFloat(rgbMatch[2]) * 2.55) : parseInt(rgbMatch[2], 10);
    let b = rgbMatch[3].endsWith('%') ? Math.round(parseFloat(rgbMatch[3]) * 2.55) : parseInt(rgbMatch[3], 10);
    let a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    a = Math.min(1, Math.max(0, a));

    const standardHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return { hex: standardHex, rgba: { r, g, b, a } };
  }

  // HSL / HSLA
  const hslMatch = trimmed.match(/^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10) % 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;

    const { r, g, b } = hslToRgb(h, s, l);
    const standardHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return { hex: standardHex, rgba: { r, g, b, a: Math.min(1, Math.max(0, a)) } };
  }

  return null;
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert rgba & hex to different string formats
export function formatColorString(
  rgba: { r: number; g: number; b: number; a: number },
  targetFormat: 'hex' | 'hex8' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
): string {
  const { r, g, b, a } = rgba;
  const standardHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  if (targetFormat === 'hex') {
    return standardHex;
  }

  if (targetFormat === 'hex8') {
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return `${standardHex}${alphaHex}`;
  }

  if (targetFormat === 'rgb') {
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (targetFormat === 'rgba') {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const { h, s, l } = rgbToHsl(r, g, b);
  if (targetFormat === 'hsl') {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

// Extract all color occurrences from code text
export function detectColorsInCode(code: string): DetectedColor[] {
  const detected: DetectedColor[] = [];
  
  // 1. Hex codes (#fff, #ffffff, #ffffffff, #0ea5e9, etc.)
  // We use word boundaries or non-hex boundaries to prevent matching random hashes or IDs
  const hexRegex = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
  let match: RegExpExecArray | null;

  while ((match = hexRegex.exec(code)) !== null) {
    const raw = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const parsed = parseColor(raw);

    if (parsed) {
      const textBefore = code.substring(0, startIndex);
      const lines = textBefore.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;

      detected.push({
        raw,
        type: 'hex',
        startIndex,
        endIndex,
        line,
        col,
        hex: parsed.hex,
        rgba: parsed.rgba,
      });
    }
  }

  // 2. RGB & RGBA
  const rgbRegex = /rgba?\(\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)\s*,\s*(\d{1,3}%?)(?:\s*,\s*([\d.]+))?\s*\)/gi;
  while ((match = rgbRegex.exec(code)) !== null) {
    const raw = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const parsed = parseColor(raw);

    if (parsed) {
      const textBefore = code.substring(0, startIndex);
      const lines = textBefore.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;

      detected.push({
        raw,
        type: raw.toLowerCase().startsWith('rgba') ? 'rgba' : 'rgb',
        startIndex,
        endIndex,
        line,
        col,
        hex: parsed.hex,
        rgba: parsed.rgba,
      });
    }
  }

  // 3. HSL & HSLA
  const hslRegex = /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)/gi;
  while ((match = hslRegex.exec(code)) !== null) {
    const raw = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + raw.length;
    const parsed = parseColor(raw);

    if (parsed) {
      const textBefore = code.substring(0, startIndex);
      const lines = textBefore.split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;

      detected.push({
        raw,
        type: raw.toLowerCase().startsWith('hsla') ? 'hsla' : 'hsl',
        startIndex,
        endIndex,
        line,
        col,
        hex: parsed.hex,
        rgba: parsed.rgba,
      });
    }
  }

  // Sort by appearance order in code
  return detected.sort((a, b) => a.startIndex - b.startIndex);
}

// Find if cursor or selection overlaps with any color
export function findColorAtCursor(
  code: string,
  cursorStart: number,
  cursorEnd: number,
  detectedColors: DetectedColor[]
): DetectedColor | null {
  // If user selected text, see if it exactly matches or overlaps a color
  for (const c of detectedColors) {
    if (cursorStart >= c.startIndex && cursorEnd <= c.endIndex) {
      return c;
    }
    // Also if cursor is right next to color boundary
    if (cursorStart === cursorEnd && (cursorStart >= c.startIndex && cursorStart <= c.endIndex)) {
      return c;
    }
  }
  return null;
}
