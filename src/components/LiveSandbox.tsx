import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  RotateCcw,
  RotateCw,
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
  Crosshair,
  ChevronDown,
  Scan
} from 'lucide-react';
import { ViewportDevice, ConsoleMessage, InspectedElement } from '../types';
import {
  DEVICE_PRESETS,
  DEFAULT_PRESET_FOR_DEVICE,
  DevicePreset
} from '../services/viewportPresets';

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
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // Selected device preset & orientation
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    return DEFAULT_PRESET_FOR_DEVICE[viewport]?.id || 'responsive';
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync preset if external viewport prop changes
  useEffect(() => {
    const defaultPreset = DEFAULT_PRESET_FOR_DEVICE[viewport];
    if (defaultPreset && defaultPreset.id !== selectedPresetId) {
      setSelectedPresetId(defaultPreset.id);
    }
  }, [viewport]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPresetsDropdownOpen(false);
      }
    };
    if (isPresetsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPresetsDropdownOpen]);

  // Find active preset object
  const activePreset = useMemo(() => {
    return (
      DEVICE_PRESETS.find((p) => p.id === selectedPresetId) ||
      DEFAULT_PRESET_FOR_DEVICE[viewport] ||
      DEVICE_PRESETS[0]
    );
  }, [selectedPresetId, viewport]);

  // Calculate actual pixel dimensions considering orientation
  const dimensions = useMemo(() => {
    if (activePreset.category === 'responsive' || activePreset.width === 0) {
      return { width: '100%', height: '100%', rawW: 0, rawH: 0, label: 'Responsive (100% Fluid)' };
    }

    let w = activePreset.width;
    let h = activePreset.height;

    // Apply orientation swap if landscape on vertical-first devices or vice versa
    if (orientation === 'landscape') {
      if (w < h) {
        const temp = w;
        w = h;
        h = temp;
      }
    } else {
      if (w > h && (activePreset.category === 'mobile' || activePreset.category === 'tablet')) {
        const temp = w;
        w = h;
        h = temp;
      }
    }

    return {
      width: `${w}px`,
      height: `${h}px`,
      rawW: w,
      rawH: h,
      label: `${activePreset.name} • ${w} × ${h}px${orientation === 'landscape' ? ' (Landscape)' : ''}`,
    };
  }, [activePreset, orientation]);

  // Select a preset and notify parent
  const handleSelectPreset = (preset: DevicePreset) => {
    setSelectedPresetId(preset.id);
    onViewportChange(preset.deviceType);
    setIsPresetsDropdownOpen(false);
  };

  // Toggle orientation
  const handleToggleOrientation = () => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  // Auto-fit device scale into available canvas area
  const handleAutoFit = () => {
    if (!canvasAreaRef.current || dimensions.rawW === 0 || dimensions.rawH === 0) {
      setScale(1);
      return;
    }
    const canvas = canvasAreaRef.current;
    const padding = 48; // padding margin
    const availableW = canvas.clientWidth - padding;
    const availableH = canvas.clientHeight - padding;

    const scaleW = availableW / dimensions.rawW;
    const scaleH = availableH / dimensions.rawH;
    const bestScale = Math.min(1, scaleW, scaleH);

    setScale(Math.max(0.3, Math.round(bestScale * 100) / 100));
  };

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
      <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Device Presets Segmented Group & Model Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Runner Status Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden xl:inline">Live Runner</span>
          </div>

          {/* Quick Device Category Segmented Buttons */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shadow-inner">
            {/* Responsive Fluid */}
            <button
              onClick={() => handleSelectPreset(DEVICE_PRESETS[0])}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset.category === 'responsive'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Responsive (100% Fluid Container Width & Height)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fluid</span>
            </button>

            {/* Mobile Preset */}
            <button
              onClick={() => {
                const mobilePreset =
                  DEVICE_PRESETS.find((p) => p.id === selectedPresetId && p.category === 'mobile') ||
                  DEFAULT_PRESET_FOR_DEVICE.mobile;
                handleSelectPreset(mobilePreset);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset.category === 'mobile'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Mobile Screen Presets (375 × 667 px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>

            {/* Tablet Preset */}
            <button
              onClick={() => {
                const tabletPreset =
                  DEVICE_PRESETS.find((p) => p.id === selectedPresetId && p.category === 'tablet') ||
                  DEFAULT_PRESET_FOR_DEVICE.tablet;
                handleSelectPreset(tabletPreset);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset.category === 'tablet'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Tablet Screen Presets (768 × 1024 px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>

            {/* Laptop Preset */}
            <button
              onClick={() => {
                const laptopPreset =
                  DEVICE_PRESETS.find((p) => p.id === selectedPresetId && p.category === 'laptop') ||
                  DEFAULT_PRESET_FOR_DEVICE.laptop;
                handleSelectPreset(laptopPreset);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset.category === 'laptop'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Laptop Screen Presets (1024 × 680 px)"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Laptop</span>
            </button>

            {/* Desktop Preset */}
            <button
              onClick={() => {
                const desktopPreset =
                  DEVICE_PRESETS.find((p) => p.id === selectedPresetId && p.category === 'desktop') ||
                  DEFAULT_PRESET_FOR_DEVICE.desktop;
                handleSelectPreset(desktopPreset);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                activePreset.category === 'desktop'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title="Desktop Screen Presets (1280 × 800 px)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          {/* Detailed Screen Model Dropdown Popover */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md text-[11px] text-slate-300 font-mono transition-colors shadow-sm"
              title="Select Specific Screen Size Preset"
            >
              <span className="truncate max-w-[130px] font-sans font-medium text-slate-200">
                {activePreset.shortName}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                  isPresetsDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isPresetsDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden animate-fadeIn py-1">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Device Screen Presets</span>
                  <span className="text-cyan-400 font-mono">Dynamic Resizing</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                  {/* Responsive */}
                  <div className="p-1">
                    <button
                      onClick={() => handleSelectPreset(DEVICE_PRESETS[0])}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        activePreset.id === 'responsive'
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs">Responsive (Fluid)</p>
                          <p className="text-[10px] text-slate-400">100% Full Canvas</p>
                        </div>
                      </div>
                      {activePreset.id === 'responsive' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>

                  {/* Mobile Group */}
                  <div className="p-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-cyan-500" />
                      Mobile Phones
                    </p>
                    {DEVICE_PRESETS.filter((p) => p.category === 'mobile').map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          activePreset.id === preset.id
                            ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs">{preset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {preset.width} × {preset.height} px
                          </p>
                        </div>
                        {activePreset.id === preset.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>

                  {/* Tablet Group */}
                  <div className="p-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Tablet className="w-3 h-3 text-cyan-500" />
                      Tablets
                    </p>
                    {DEVICE_PRESETS.filter((p) => p.category === 'tablet').map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          activePreset.id === preset.id
                            ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs">{preset.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {preset.width} × {preset.height} px
                          </p>
                        </div>
                        {activePreset.id === preset.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>

                  {/* Laptop & Desktop Group */}
                  <div className="p-1">
                    <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-cyan-500" />
                      Laptops & Desktops
                    </p>
                    {DEVICE_PRESETS.filter((p) => p.category === 'laptop' || p.category === 'desktop').map(
                      (preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            activePreset.id === preset.id
                              ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <p className="text-xs">{preset.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {preset.width} × {preset.height} px
                            </p>
                          </div>
                          {activePreset.id === preset.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orientation Toggle Button (Portrait ↔ Landscape) */}
          {activePreset.width > 0 && (
            <button
              onClick={handleToggleOrientation}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                orientation === 'landscape'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              title={`Switch Device Orientation (Current: ${
                orientation === 'portrait' ? 'Portrait' : 'Landscape'
              })`}
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline capitalize">{orientation}</span>
            </button>
          )}

          {/* Pixel Dimension Pill */}
          {dimensions.rawW > 0 && (
            <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-cyan-300/90 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              {dimensions.rawW} × {dimensions.rawH} px
            </span>
          )}

          {/* Highlight Mode Active Notification */}
          {isHighlightMode && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full animate-pulse">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">Inspect Mode</span>
            </span>
          )}
        </div>

        {/* Center/Right Controls: Zoom, Scale, Inspect, Console, Refresh, Popout */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom & Auto-Fit Controls (Active when non-responsive preset) */}
          {activePreset.width > 0 && (
            <div className="flex items-center bg-slate-950 px-1 py-0.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              {/* Auto-Fit Button */}
              <button
                onClick={handleAutoFit}
                className="p-1 hover:text-cyan-400 transition-colors"
                title="Auto-Fit device screen to current container size"
              >
                <Scan className="w-3 h-3" />
              </button>

              <div className="w-px h-3 bg-slate-800 mx-0.5" />

              {/* Zoom Out */}
              <button
                onClick={() => setScale((s) => Math.max(0.3, Math.round((s - 0.1) * 10) / 10))}
                className="p-1 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              {/* Scale Reset Pill */}
              <button
                onClick={() => setScale(1)}
                className="px-1.5 font-mono text-[10.5px] hover:text-cyan-300 transition-colors"
                title="Click to reset zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>

              {/* Zoom In */}
              <button
                onClick={() => setScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))}
                className="p-1 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

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
              {isHighlightMode ? 'Highlight Active' : 'Highlight'}
            </span>
          </button>

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

      {/* Dynamic Frame Canvas Area */}
      <div
        ref={canvasAreaRef}
        className="flex-1 bg-slate-950/80 p-2 sm:p-4 overflow-auto flex items-center justify-center relative"
      >
        {activePreset.category === 'responsive' || activePreset.width === 0 ? (
          /* Responsive Edge-to-Edge Container */
          <div className="w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border border-slate-800 relative transition-all duration-300 ease-out">
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
          /* Realistic Resizable Device Container with Chassis and Shadows */
          <div
            style={{
              width: dimensions.width,
              height: dimensions.height,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease-out',
            }}
            className={`bg-white shadow-2xl overflow-hidden relative flex flex-col shrink-0 border-4 border-slate-700/90 ${
              activePreset.category === 'mobile'
                ? 'rounded-[32px] ring-1 ring-slate-600/50'
                : activePreset.category === 'tablet'
                ? 'rounded-[24px] ring-1 ring-slate-600/50'
                : 'rounded-xl ring-1 ring-slate-600/50'
            }`}
          >
            {/* Realistic Top Device Bar */}
            {activePreset.category === 'mobile' || activePreset.category === 'tablet' ? (
              <div className="bg-slate-950 text-slate-400 px-4 py-1.5 text-[10px] flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
                <span className="font-mono font-medium text-slate-300">9:41</span>
                {/* Smartphone Dynamic Island / Speaker notch */}
                <div className="w-16 h-3 bg-slate-900 rounded-full border border-slate-800/80 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <div className="w-1 h-1 rounded-full bg-cyan-500/80" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span>5G</span>
                  <span>100% ⚡</span>
                </div>
              </div>
            ) : (
              /* Laptop / Desktop Browser Mock Titlebar */
              <div className="bg-slate-900 text-slate-400 px-3 py-1.5 text-[11px] flex items-center justify-between border-b border-slate-800 shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 block"></span>
                </div>
                <div className="bg-slate-950 text-slate-400 px-3 py-0.5 rounded-md border border-slate-800 font-mono text-[10px] max-w-[200px] truncate text-center">
                  https://preview.local/sandbox
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {dimensions.rawW} × {dimensions.rawH}
                </span>
              </div>
            )}

            {/* Sandboxed iFrame */}
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={generateSandboxedSrcDoc(htmlCode)}
              title="Live HTML Sandbox Frame"
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
              className="w-full flex-1 border-0 block"
            />

            {/* Mobile Home Bar Pill Indicator */}
            {(activePreset.category === 'mobile' || activePreset.category === 'tablet') && (
              <div className="bg-slate-950 py-1 flex items-center justify-center shrink-0 border-t border-slate-900">
                <div className="w-24 h-1 bg-slate-600 rounded-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

