import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Check,
  Terminal,
  ShieldCheck,
  Sparkles,
  MousePointerClick,
  Crosshair
} from 'lucide-react';
import { ViewportDevice, ConsoleMessage, InspectedElement } from '../types';

interface LiveSandboxProps {
  htmlCode: string;
  viewport: ViewportDevice;
  onViewportChange: (viewport: ViewportDevice) => void;
  onConsoleMessage: (msg: Omit<ConsoleMessage, 'id' | 'timestamp'>) => void;
  onOpenInNewTab: () => void;
  onToggleConsole: () => void;
  consoleCount: number;
  isConsoleOpen: boolean;
  isHighlightMode: boolean;
  onToggleHighlightMode: () => void;
  onElementSelect?: (element: InspectedElement) => void;
}

export const LiveSandbox: React.FC<LiveSandboxProps> = ({
  htmlCode,
  viewport,
  onViewportChange,
  onConsoleMessage,
  onOpenInNewTab,
  onToggleConsole,
  consoleCount,
  isConsoleOpen,
  isHighlightMode,
  onToggleHighlightMode,
  onElementSelect,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Script to intercept console logs, runtime errors, and DOM Element Highlight Mode
  const sandboxInstrumentationScript = `
<script>
(function() {
  // 1. Console interception
  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  function safeFormat(args) {
    return Array.from(args).map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try { return JSON.stringify(arg, null, 2); }
        catch (e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');
  }

  console.log = function(...args) {
    originalLog.apply(console, args);
    window.parent.postMessage({ type: 'SANDBOX_CONSOLE', level: 'log', message: safeFormat(args) }, '*');
  };

  console.info = function(...args) {
    originalInfo.apply(console, args);
    window.parent.postMessage({ type: 'SANDBOX_CONSOLE', level: 'info', message: safeFormat(args) }, '*');
  };

  console.warn = function(...args) {
    originalWarn.apply(console, args);
    window.parent.postMessage({ type: 'SANDBOX_CONSOLE', level: 'warn', message: safeFormat(args) }, '*');
  };

  console.error = function(...args) {
    originalError.apply(console, args);
    window.parent.postMessage({ type: 'SANDBOX_CONSOLE', level: 'error', message: safeFormat(args) }, '*');
  };

  window.addEventListener('error', function(event) {
    window.parent.postMessage({
      type: 'SANDBOX_CONSOLE',
      level: 'error',
      message: 'Runtime Error: ' + event.message + (event.filename ? ' (' + event.filename + ':' + event.lineno + ')' : '')
    }, '*');
  });

  window.addEventListener('unhandledrejection', function(event) {
    window.parent.postMessage({
      type: 'SANDBOX_CONSOLE',
      level: 'error',
      message: 'Unhandled Promise Rejection: ' + String(event.reason)
    }, '*');
  });

  // 2. Highlight Mode DOM Inspector
  let isHighlightActive = ${isHighlightMode ? 'true' : 'false'};
  let hoveredElement = null;
  let overlay = null;
  let badge = null;

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = '__sandbox_inspector_overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #06b6d4;background:rgba(6,182,212,0.18);box-shadow:0 0 12px rgba(6,182,212,0.45);z-index:99999999;transition:all 0.05s ease-out;display:none;border-radius:3px;box-sizing:border-box;';
    
    badge = document.createElement('div');
    badge.id = '__sandbox_inspector_badge';
    badge.style.cssText = 'position:absolute;top:-26px;left:-2px;background:#082f49;color:#38bdf8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;border:1px solid #0284c7;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.6);pointer-events:none;';
    overlay.appendChild(badge);
    document.documentElement.appendChild(overlay);
  }

  function getSelectorPath(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      if (current === document.documentElement) {
        path.unshift('html');
        break;
      }
      if (current === document.body) {
        path.unshift('body');
        break;
      }
      let selector = current.nodeName.toLowerCase();
      if (current.id) {
        selector += '#' + current.id;
        path.unshift(selector);
        break;
      } else {
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.trim().split(/\\s+/).filter(Boolean);
          if (classes.length > 0) {
            selector += '.' + classes.slice(0, 2).join('.');
          }
        }
        let sibling = current;
        let nth = 1;
        while ((sibling = sibling.previousElementSibling)) {
          if (sibling.nodeName.toLowerCase() === current.nodeName.toLowerCase()) nth++;
        }
        if (nth > 1) selector += ':nth-of-type(' + nth + ')';
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function updateHighlight(el) {
    if (!isHighlightActive || !el || el === overlay || el === badge || el === document.documentElement || el === document.body) {
      if (overlay) overlay.style.display = 'none';
      return;
    }
    createOverlay();
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    let tagLabel = el.tagName.toLowerCase();
    if (el.id) tagLabel += '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\\s+/).filter(Boolean);
      if (cls.length > 0) tagLabel += '.' + cls.slice(0, 2).join('.');
    }
    tagLabel += ' (' + Math.round(rect.width) + ' × ' + Math.round(rect.height) + ')';
    badge.textContent = tagLabel;

    if (rect.top < 30) {
      badge.style.top = 'auto';
      badge.style.bottom = '-26px';
    } else {
      badge.style.top = '-26px';
      badge.style.bottom = 'auto';
    }
  }

  window.addEventListener('mousemove', function(e) {
    if (!isHighlightActive) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target !== overlay && target !== badge) {
      hoveredElement = target;
      updateHighlight(target);
    }
  }, true);

  window.addEventListener('click', function(e) {
    if (!isHighlightActive) return;
    e.preventDefault();
    e.stopPropagation();

    const el = hoveredElement || e.target;
    if (!el || el === overlay || el === badge) return;

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    const attrs = [];
    for (let i = 0; i < el.attributes.length; i++) {
      attrs.push({ name: el.attributes[i].name, value: el.attributes[i].value });
    }

    const elementData = {
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: typeof el.className === 'string' ? el.className : undefined,
      classList: el.classList ? Array.from(el.classList) : [],
      attributes: attrs,
      textContent: (el.textContent || '').trim().substring(0, 300),
      outerHTML: el.outerHTML ? el.outerHTML.substring(0, 4000) : '',
      innerHTML: el.innerHTML ? el.innerHTML.substring(0, 4000) : '',
      selectorPath: getSelectorPath(el),
      boxModel: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      },
      computedStyles: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        display: computed.display,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border
      }
    };

    window.parent.postMessage({
      type: 'SANDBOX_ELEMENT_SELECTED',
      element: elementData
    }, '*');
  }, true);

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SET_HIGHLIGHT_MODE') {
      isHighlightActive = !!event.data.enabled;
      if (!isHighlightActive && overlay) {
        overlay.style.display = 'none';
      }
      document.body.style.cursor = isHighlightActive ? 'crosshair' : '';
    }
  });

  // Apply initial cursor
  if (isHighlightActive) {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.style.cursor = 'crosshair';
    });
  }
})();
</script>
`;

  // Inject instrumentation into HTML
  const generateSandboxedSrcDoc = (src: string) => {
    if (!src || !src.trim()) {
      return `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#94a3b8;"><p>Upload an HTML file or select a template to preview.</p></body></html>`;
    }

    if (src.includes('<head>')) {
      return src.replace('<head>', '<head>' + sandboxInstrumentationScript);
    } else if (src.includes('<html>')) {
      return src.replace('<html>', '<html><head>' + sandboxInstrumentationScript + '</head>');
    } else {
      return sandboxInstrumentationScript + src;
    }
  };

  // Synchronize highlight mode to iframe whenever toggle state changes
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_HIGHLIGHT_MODE', enabled: isHighlightMode },
          '*'
        );
      } catch (e) {
        console.log('Sync highlight mode error', e);
      }
    }
  }, [isHighlightMode]);

  // Handle messages from sandbox iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'SANDBOX_CONSOLE') {
        onConsoleMessage({
          type: event.data.level || 'log',
          message: event.data.message || '',
        });
      } else if (event.data.type === 'SANDBOX_ELEMENT_SELECTED') {
        if (onElementSelect && event.data.element) {
          onElementSelect(event.data.element);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleMessage, onElementSelect]);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 300);
  };

  const getDeviceDimensions = () => {
    switch (viewport) {
      case 'mobile':
        return { width: '375px', height: '667px', label: 'Mobile (375 × 667)' };
      case 'tablet':
        return { width: '768px', height: '1024px', label: 'Tablet (768 × 1024)' };
      case 'laptop':
        return { width: '1024px', height: '680px', label: 'Laptop (1024 × 680)' };
      case 'desktop':
        return { width: '1280px', height: '800px', label: 'Desktop (1280 × 800)' };
      case 'responsive':
      default:
        return { width: '100%', height: '100%', label: 'Responsive (100%)' };
    }
  };

  const currentDim = getDeviceDimensions();

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-900 overflow-hidden relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : ''
      }`}
    >
      {/* Sandbox Navigation Bar */}
      <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Device / Frame selector & Highlight Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Live Runner</span>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">• {currentDim.label}</span>

          {isHighlightMode && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full animate-pulse">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>Highlight Mode: Click to inspect</span>
            </span>
          )}
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-1.5">
          {/* Highlight Mode Toggle */}
          <button
            onClick={onToggleHighlightMode}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all border ${
              isHighlightMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
            title={
              isHighlightMode
                ? 'Highlight Mode Active: Click any element to focus it in the inspector'
                : 'Enable Highlight Mode: Click elements to inspect and focus in editor'
            }
          >
            <Crosshair className={`w-3.5 h-3.5 ${isHighlightMode ? 'text-cyan-400 animate-spin-slow' : ''}`} />
            <span className="hidden md:inline">
              {isHighlightMode ? 'Highlight Active' : 'Highlight Mode'}
            </span>
          </button>

          {/* Zoom controls (for fixed device frames) */}
          {viewport !== 'responsive' && (
            <div className="flex items-center bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px] text-slate-300">
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                className="p-1 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="px-1 font-mono">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
                className="p-1 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Console Drawer Trigger */}
          <button
            onClick={onToggleConsole}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              isConsoleOpen
                ? 'bg-slate-800 text-cyan-400 border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
            }`}
            title="Toggle Developer Console Logs"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Console</span>
            {consoleCount > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-cyan-400 font-mono text-[10px] rounded-full">
                {consoleCount}
              </span>
            )}
          </button>

          {/* Reload Frame */}
          <button
            onClick={handleRefresh}
            className={`p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors ${
              isLoading ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Refresh Live Sandbox"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Standalone New Tab Launcher */}
          <button
            onClick={onOpenInNewTab}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded border border-slate-700 transition-colors shadow-sm"
            title="Open and use as standalone hosted webpage in full window"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Popout Tab</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Frame Canvas Area */}
      <div className="flex-1 bg-slate-950/70 p-2 sm:p-4 overflow-auto flex items-center justify-center relative">
        {viewport === 'responsive' ? (
          <div className="w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border border-slate-800 relative">
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={generateSandboxedSrcDoc(htmlCode)}
              title="Live HTML Sandbox"
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
              className="w-full h-full border-0 block"
            />
          </div>
        ) : (
          <div
            style={{
              width: currentDim.width,
              height: currentDim.height,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'all 0.2s ease-out',
            }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-700 relative flex flex-col shrink-0"
          >
            {/* Mock device status bar */}
            <div className="bg-slate-900 text-slate-400 px-3 py-1 text-[10px] flex items-center justify-between border-b border-slate-800 shrink-0">
              <span className="font-mono">9:41 AM</span>
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto"></div>
              <span>100% ⚡</span>
            </div>

            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={generateSandboxedSrcDoc(htmlCode)}
              title="Live HTML Sandbox Frame"
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
              className="w-full flex-1 border-0 block"
            />
          </div>
        )}
      </div>
    </div>
  );
};

