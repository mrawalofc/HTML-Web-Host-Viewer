export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  size: number;
  lastModified: number;
  driveFileId?: string;
  driveWebViewLink?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export type ViewMode = 'split' | 'editor' | 'preview';

export type ViewportDevice = 'responsive' | 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface ViewportSize {
  name: string;
  width: string;
  height: string;
  icon: string;
}

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  timestamp: string;
  message: string;
  count?: number;
}

export interface TemplateProject {
  id: string;
  title: string;
  description: string;
  tag: string;
  html: string;
}

export interface HtmlMetaAnalysis {
  title?: string;
  description?: string;
  charset?: string;
  viewport?: string;
  stylesheetsCount: number;
  scriptsCount: number;
  imagesCount: number;
  linksCount: number;
  hasInlineStyles: boolean;
  hasInlineScripts: boolean;
  domNodeEstimate: number;
}

export interface InspectedElement {
  tagName: string;
  id?: string;
  className?: string;
  classList: string[];
  attributes: { name: string; value: string }[];
  textContent: string;
  outerHTML: string;
  innerHTML: string;
  selectorPath: string;
  boxModel?: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  computedStyles?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontFamily?: string;
    display?: string;
    padding?: string;
    margin?: string;
    border?: string;
  };
  sourceLine?: number;
}

export type LintSeverity = 'error' | 'warning' | 'info';

export type EditorTheme = 'dark' | 'light';

export interface CssLintDiagnostic {
  id: string;
  line: number;
  column: number;
  endColumn?: number;
  severity: LintSeverity;
  message: string;
  rule: string;
  snippet?: string;
  suggestion?: string;
  isInlineStyle?: boolean;
}

export interface ElementLocation {
  startIndex: number;
  endIndex: number;
  line: number;
  col: number;
  column?: number;
  matchedString: string;
}

