import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Copy,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Zap,
  AlignLeft,
  X,
  Palette,
  Crosshair,
  Wand2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-react';
import { FloatingColorPicker } from './FloatingColorPicker';
import { CssLintPanel } from './CssLintPanel';
import {
  detectColorsInCode,
  findColorAtCursor,
  DetectedColor
} from '../services/colorUtils';
import { formatHtmlCode } from '../services/codeFormatter';
import { lintCssCode } from '../services/cssLinter';
import { InspectedElement, ElementLocation, CssLintDiagnostic, EditorTheme } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onRun: () => void;
  autoRun: boolean;
  onToggleAutoRun: (enabled: boolean) => void;
  fileName: string;
  theme?: EditorTheme;
  onToggleTheme?: () => void;
  focusedElement?: InspectedElement | null;
  focusedElementLocation?: ElementLocation | null;
  onClearFocusedElement?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  autoRun,
  onToggleAutoRun,
  fileName,
  theme: propTheme,
  onToggleTheme: propOnToggleTheme,
  focusedElement,
  focusedElementLocation,
  onClearFocusedElement,
}) => {
  const [internalTheme, setInternalTheme] = useState<EditorTheme>(() => {
    try {
      const saved = localStorage.getItem('htmlhost_editor_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const isControlled = propTheme !== undefined;
  const currentTheme = isControlled ? propTheme : internalTheme;

  const handleToggleTheme = () => {
    if (propOnToggleTheme) {
      propOnToggleTheme();
    } else {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setInternalTheme(nextTheme);
      try {
        localStorage.setItem('htmlhost_editor_theme', nextTheme);
      } catch {
        // ignore
      }
    }
  };

  const isLight = currentTheme === 'light';

  const [copied, setCopied] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Floating Color Picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<DetectedColor | null>(null);

  // CSS Linter state
  const [isLintPanelOpen, setIsLintPanelOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const totalLines = lines.length;

  // Real-time CSS Linting Analysis
  const cssDiagnostics = useMemo(() => {
    return lintCssCode(code);
  }, [code]);

  const errorCount = useMemo(
    () => cssDiagnostics.filter((d) => d.severity === 'error').length,
    [cssDiagnostics]
  );
  const warningCount = useMemo(
    () => cssDiagnostics.filter((d) => d.severity === 'warning').length,
    [cssDiagnostics]
  );

  // Map diagnostics by line number for O(1) gutter markers
  const lineDiagnosticsMap = useMemo(() => {
    const map = new Map<number, CssLintDiagnostic[]>();
    for (const diag of cssDiagnostics) {
      const existing = map.get(diag.line) || [];
      existing.push(diag);
      map.set(diag.line, existing);
    }
    return map;
  }, [cssDiagnostics]);

  // Jump to & focus element in code editor when focusedElementLocation updates
  useEffect(() => {
    if (focusedElementLocation && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.selectionStart = focusedElementLocation.startIndex;
      textarea.selectionEnd = focusedElementLocation.endIndex;

      // Scroll to line
      const lineHeight = 20; // 20px per line leading-5
      const targetScroll = Math.max(0, (focusedElementLocation.line - 4) * lineHeight);
      textarea.scrollTop = targetScroll;

      setCursorPos({
        line: focusedElementLocation.line,
        col: focusedElementLocation.column,
      });
    }
  }, [focusedElementLocation]);

  // Real-time detected colors in the entire document
  const detectedColors = useMemo(() => {
    return detectColorsInCode(code);
  }, [code]);

  // Keep selectedColor synchronized with code edits
  useEffect(() => {
    if (selectedColor) {
      const updated = detectedColors.find(
        (c) => c.line === selectedColor.line && c.raw === selectedColor.raw
      );
      if (updated) {
        setSelectedColor(updated);
      } else if (detectedColors.length > 0) {
        setSelectedColor(detectedColors[0]);
      } else {
        setSelectedColor(null);
      }
    } else if (detectedColors.length > 0 && !selectedColor) {
      setSelectedColor(detectedColors[0]);
    }
  }, [detectedColors]);

  const syncScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const selEnd = textareaRef.current.selectionEnd;
    const linesUpToCursor = text.substring(0, selStart).split('\n');
    setCursorPos({
      line: linesUpToCursor.length,
      col: linesUpToCursor[linesUpToCursor.length - 1].length + 1,
    });

    // Check if cursor is directly on or selecting a color code
    const colorAtCursor = findColorAtCursor(code, selStart, selEnd, detectedColors);
    if (colorAtCursor) {
      setSelectedColor(colorAtCursor);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter / Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // Format Code on Shift+Alt+F or Ctrl+Alt+F or Cmd+Alt+F
    if (e.shiftKey && e.altKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      handleFormatCode();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      handleFormatCode();
      return;
    }

    // Toggle search on Ctrl+F / Cmd+F
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(true);
      return;
    }

    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleFormatCode = () => {
    try {
      const formatted = formatHtmlCode(code, {
        indentSize: 2,
        preserveNewlines: true,
        wrapLineLength: 0,
      });

      if (formatted && formatted !== code) {
        onChange(formatted);
      }

      setIsFormatted(true);
      setTimeout(() => setIsFormatted(false), 2000);
    } catch (e) {
      console.warn('Formatting error:', e);
    }
  };

  const handleSearchReplace = (replaceAll = false) => {
    if (!searchQuery) return;
    if (replaceAll) {
      const updated = code.split(searchQuery).join(replaceQuery);
      onChange(updated);
    } else {
      const idx = code.indexOf(searchQuery);
      if (idx !== -1) {
        const updated = code.substring(0, idx) + replaceQuery + code.substring(idx + searchQuery.length);
        onChange(updated);
      }
    }
  };

  // Replace a specific detected color or all matching color occurrences in the code
  const handleReplaceColor = (target: DetectedColor, newColorValue: string, replaceAll: boolean) => {
    if (replaceAll) {
      // Escape special characters in the raw color for regex replacement
      const escapedRaw = target.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedRaw, 'g');
      const updatedCode = code.replace(regex, newColorValue);
      onChange(updatedCode);
    } else {
      // Re-check target boundaries
      const updatedCode =
        code.substring(0, target.startIndex) + newColorValue + code.substring(target.endIndex);
      onChange(updatedCode);

      // Re-focus and update cursor selection to new value
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = target.startIndex;
          textareaRef.current.selectionEnd = target.startIndex + newColorValue.length;
        }
      }, 50);
    }
  };

  // Jump to and select specific detected color in code textarea
  const handleSelectColorIndex = (index: number) => {
    const target = detectedColors[index];
    if (!target) return;
    setSelectedColor(target);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = target.startIndex;
      textareaRef.current.selectionEnd = target.endIndex;

      // Scroll to that line
      const lineHeight = 20; // approximate pixel height
      const targetScroll = Math.max(0, (target.line - 5) * lineHeight);
      textareaRef.current.scrollTop = targetScroll;
    }
  };

  // Find color currently near cursor
  const cursorColor = useMemo(() => {
    if (!textareaRef.current) return null;
    const selStart = textareaRef.current.selectionStart || 0;
    const selEnd = textareaRef.current.selectionEnd || 0;
    return findColorAtCursor(code, selStart, selEnd, detectedColors);
  }, [code, cursorPos, detectedColors]);

  // Jump to specific line and column in textarea
  const handleJumpToLine = (targetLine: number, targetCol: number = 1) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      let currentIdx = 0;
      for (let i = 0; i < targetLine - 1 && i < lines.length; i++) {
        currentIdx += lines[i].length + 1;
      }
      const targetIdx = Math.min(code.length, currentIdx + Math.max(0, targetCol - 1));
      const lineEndIdx = currentIdx + (lines[targetLine - 1]?.length || 0);

      textareaRef.current.selectionStart = targetIdx;
      textareaRef.current.selectionEnd = lineEndIdx > targetIdx ? lineEndIdx : targetIdx;

      const lineHeight = 20;
      const targetScroll = Math.max(0, (targetLine - 5) * lineHeight);
      textareaRef.current.scrollTop = targetScroll;

      setCursorPos({ line: targetLine, col: targetCol });
    }
  };

  return (
    <div
      className={`flex flex-col h-full border-r overflow-hidden select-none relative transition-colors duration-150 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-950 border-slate-800 text-slate-200'
      }`}
    >
      {/* Floating Color Picker Component */}
      <FloatingColorPicker
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        selectedColor={selectedColor}
        detectedColors={detectedColors}
        onReplaceColor={handleReplaceColor}
        onSelectColorIndex={handleSelectColorIndex}
      />

      {/* Real-time CSS Lint Diagnostics Panel */}
      <CssLintPanel
        isOpen={isLintPanelOpen}
        onClose={() => setIsLintPanelOpen(false)}
        diagnostics={cssDiagnostics}
        onJumpToLine={(line, col) => {
          handleJumpToLine(line, col);
        }}
      />

      {/* Editor Header Toolbar */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between gap-2 shrink-0 transition-colors ${
          isLight
            ? 'bg-slate-50/95 border-slate-200'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-semibold flex items-center gap-1.5 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            {fileName}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            ({totalLines} lines • {(new Blob([code]).size / 1024).toFixed(1)} KB)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* CSS Real-Time Linter Button */}
          <button
            onClick={() => setIsLintPanelOpen(!isLintPanelOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
              isLintPanelOpen
                ? isLight
                  ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-sm'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : errorCount > 0
                ? isLight
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-700/60 hover:bg-rose-900/60'
                : warningCount > 0
                ? isLight
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-700/60 hover:bg-amber-900/60'
                : isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300/80'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title={`Real-Time CSS Linter (${errorCount} errors, ${warningCount} warnings)`}
          >
            {errorCount > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="font-medium hidden md:inline">CSS Lint</span>
            {cssDiagnostics.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  errorCount > 0
                    ? isLight
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-rose-900 text-rose-200 border border-rose-700'
                    : isLight
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-amber-900 text-amber-200 border border-amber-700'
                }`}
              >
                {cssDiagnostics.length}
              </span>
            )}
          </button>

          {/* Color Picker Toggle Button */}
          <button
            onClick={() => {
              if (selectedColor || detectedColors.length > 0) {
                if (!selectedColor && detectedColors.length > 0) {
                  setSelectedColor(detectedColors[0]);
                }
              }
              setIsColorPickerOpen(!isColorPickerOpen);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
              isColorPickerOpen
                ? isLight
                  ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-sm'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300/80'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title="Floating Color Picker & Code Inspector"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-medium hidden md:inline">Colors</span>
            {detectedColors.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
                }`}
              >
                {detectedColors.length}
              </span>
            )}
          </button>

          {/* Format Code Button */}
          <button
            onClick={handleFormatCode}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              isFormatted
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : isLight
                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300/80'
                : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
            }`}
            title="Format Code & Indent HTML (Shift+Alt+F)"
          >
            {isFormatted ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className={`font-medium ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>Formatted</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-medium hidden sm:inline">Format</span>
              </>
            )}
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded border transition-colors ${
              showSearch
                ? isLight
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  : 'bg-slate-800 text-cyan-400 border-cyan-500/30'
                : isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-transparent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
            title="Search & Replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Copy Source Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Editor Theme Toggle (Light / Dark) */}
          <button
            onClick={handleToggleTheme}
            className={`p-1.5 rounded transition-all border ${
              isLight
                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 shadow-sm'
                : 'text-amber-400 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-800 border-slate-700/60'
            }`}
            title={
              isLight
                ? 'Current: Light Theme (Click for Dark Theme)'
                : 'Current: Dark Theme (Click for Light Theme)'
            }
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          <div
            className={`w-px h-4 mx-1 hidden sm:block ${
              isLight ? 'bg-slate-300' : 'bg-slate-800'
            }`}
          ></div>

          {/* Auto Run Switch */}
          <label
            className={`flex items-center gap-1.5 text-[11px] cursor-pointer px-1.5 py-0.5 rounded transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Automatically reload live preview on code edit"
          >
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => onToggleAutoRun(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-3 h-3"
            />
            <span className="hidden sm:inline">Auto-run</span>
          </label>

          {/* Manual Run Button */}
          <button
            onClick={onRun}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow transition-colors"
            title="Re-run and refresh live frame (Ctrl+Enter)"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>
      </div>

      {/* Search & Replace Floating Bar */}
      {showSearch && (
        <div
          className={`p-2 flex flex-wrap items-center gap-2 text-xs border-b ${
            isLight
              ? 'bg-slate-100 border-slate-300'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border flex-1 min-w-[140px] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <Search className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Find in code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs focus:outline-none w-full"
            />
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border flex-1 min-w-[140px] ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-xs focus:outline-none w-full"
            />
          </div>
          <button
            onClick={() => handleSearchReplace(false)}
            className={`px-2 py-1 rounded text-[11px] font-medium border ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Replace
          </button>
          <button
            onClick={() => handleSearchReplace(true)}
            className={`px-2 py-1 rounded text-[11px] font-medium border ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Replace All
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className={`p-1 ${
              isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Code Text Area with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-[13px] leading-relaxed">
        {/* Line Numbers with CSS Diagnostics Markers */}
        <div
          ref={lineNumbersRef}
          className={`w-14 text-right pr-2 pt-3 select-none overflow-hidden border-r shrink-0 font-mono transition-colors ${
            isLight
              ? 'bg-slate-50/90 text-slate-400 border-slate-200'
              : 'bg-slate-950/90 text-slate-600 border-slate-900'
          }`}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const diags = lineDiagnosticsMap.get(lineNum);
            const hasError = diags?.some((d) => d.severity === 'error');
            const hasWarning = diags?.some((d) => d.severity === 'warning');

            return (
              <div
                key={i}
                className={`h-5 leading-5 text-[11px] flex items-center justify-end gap-1.5 group cursor-pointer transition-colors ${
                  isLight ? 'hover:text-slate-800' : 'hover:text-slate-300'
                }`}
                onClick={() => {
                  if (diags && diags.length > 0) {
                    setIsLintPanelOpen(true);
                  }
                  handleJumpToLine(lineNum);
                }}
                title={
                  diags && diags.length > 0
                    ? diags.map((d) => `[${d.severity.toUpperCase()}] ${d.message}`).join('\n')
                    : undefined
                }
              >
                {hasError ? (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80 shrink-0 animate-pulse"
                    title={`CSS Error: ${diags?.find((d) => d.severity === 'error')?.message}`}
                  />
                ) : hasWarning ? (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                    title={`CSS Warning: ${diags?.find((d) => d.severity === 'warning')?.message}`}
                  />
                ) : null}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onClick={handleCursorMove}
          onKeyUp={handleCursorMove}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className={`w-full h-full p-3 outline-none resize-none overflow-auto font-mono whitespace-pre tab-2 border-0 focus:ring-0 leading-5 transition-colors ${
            isLight
              ? 'bg-white text-slate-900 selection:bg-cyan-100 selection:text-slate-900 placeholder:text-slate-400'
              : 'bg-slate-950 text-cyan-50 selection:bg-cyan-900 selection:text-cyan-100 placeholder:text-slate-600'
          }`}
          placeholder="Type or paste HTML code here..."
        />
      </div>

      {/* Editor Status Bar */}
      <div
        className={`border-t px-3 py-1 text-[11px] flex items-center justify-between shrink-0 transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>HTML5 / UTF-8</span>

          {/* Interactive CSS Diagnostics Status Pill */}
          <button
            onClick={() => setIsLintPanelOpen(!isLintPanelOpen)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] transition-colors border ${
              errorCount > 0
                ? isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-rose-950/70 border-rose-800/60 text-rose-300 hover:bg-rose-900/80 shadow-sm shadow-rose-950'
                : warningCount > 0
                ? isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-amber-950/70 border-amber-800/60 text-amber-300 hover:bg-amber-900/80 shadow-sm shadow-amber-950'
                : isLight
                ? 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Click to toggle CSS Diagnostics Inspector"
          >
            {errorCount > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span className="font-medium font-mono">
                  {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                  {warningCount > 0 ? `, ${warningCount} Warn` : ''}
                </span>
              </>
            ) : warningCount > 0 ? (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="font-medium font-mono">
                  {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>CSS Clean</span>
              </>
            )}
          </button>

          {/* Focused DOM Element indicator */}
          {focusedElement && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
                isLight
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
                  : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <Crosshair className="w-3 h-3 text-cyan-500" />
              <span className="font-mono font-medium">
                &lt;{focusedElement.tagName}
                {focusedElement.id ? `#${focusedElement.id}` : ''}&gt;
              </span>
              {focusedElementLocation && (
                <span className="font-mono opacity-80">
                  (Ln {focusedElementLocation.line})
                </span>
              )}
              {onClearFocusedElement && (
                <button
                  onClick={onClearFocusedElement}
                  className="p-0.5 hover:opacity-100 opacity-70 rounded ml-0.5"
                  title="Clear element focus"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Clickable Color Chip if cursor is on a color */}
          {(cursorColor || selectedColor) && (
            <button
              onClick={() => {
                if (cursorColor) setSelectedColor(cursorColor);
                setIsColorPickerOpen(true);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 hover:border-cyan-500 text-slate-800'
                  : 'bg-slate-950 border-slate-700/80 hover:border-cyan-500/80 text-slate-200'
              }`}
              title="Click to edit this color in Color Picker"
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm"
                style={{
                  backgroundColor: (cursorColor || selectedColor)?.hex,
                }}
              />
              <span
                className={`font-mono ${
                  isLight ? 'text-cyan-700' : 'text-cyan-300'
                }`}
              >
                {(cursorColor || selectedColor)?.raw}
              </span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>
            Press{' '}
            <kbd
              className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                isLight
                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              Ctrl+Enter
            </kbd>{' '}
            to Run
          </span>
        </div>
      </div>
    </div>
  );
};
