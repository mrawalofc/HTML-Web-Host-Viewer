import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Pipette,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  RefreshCw,
  Sliders,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';
import {
  DetectedColor,
  formatColorString,
  rgbToHsl,
  hslToRgb,
  parseColor
} from '../services/colorUtils';

interface FloatingColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor: DetectedColor | null;
  detectedColors: DetectedColor[];
  onReplaceColor: (target: DetectedColor, newColorValue: string, replaceAll: boolean) => void;
  onSelectColorIndex: (index: number) => void;
  editorPos?: { top: number; left: number };
}

// Preset modern color palette
const PRESET_PALETTES = [
  // Vibrant UI Accents
  { name: 'Cyan 400', hex: '#22d3ee' },
  { name: 'Sky 500', hex: '#0ea5e9' },
  { name: 'Blue 600', hex: '#2563eb' },
  { name: 'Indigo 500', hex: '#6366f1' },
  { name: 'Violet 500', hex: '#8b5cf6' },
  { name: 'Fuchsia 500', hex: '#d946ef' },
  { name: 'Pink 500', hex: '#ec4899' },
  { name: 'Rose 500', hex: '#f43f5e' },
  { name: 'Amber 500', hex: '#f59e0b' },
  { name: 'Emerald 400', hex: '#34d399' },
  { name: 'Teal 400', hex: '#2dd4bf' },
  { name: 'Lime 400', hex: '#a3e635' },
  // Dark & Neutral Bases
  { name: 'Slate 950', hex: '#020617' },
  { name: 'Slate 900', hex: '#0f172a' },
  { name: 'Slate 800', hex: '#1e293b' },
  { name: 'Slate 700', hex: '#334155' },
  { name: 'Slate 400', hex: '#94a3b8' },
  { name: 'Slate 100', hex: '#f1f5f9' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Pure Black', hex: '#000000' },
];

export const FloatingColorPicker: React.FC<FloatingColorPickerProps> = ({
  isOpen,
  onClose,
  selectedColor,
  detectedColors,
  onReplaceColor,
  onSelectColorIndex,
}) => {
  // Current working color in RGBA
  const [rgba, setRgba] = useState<{ r: number; g: number; b: number; a: number }>({
    r: 56,
    g: 189,
    b: 248,
    a: 1,
  });

  const [hexInput, setHexInput] = useState<string>('#38bdf8');
  const [outputFormat, setOutputFormat] = useState<'match' | 'hex' | 'rgba' | 'rgb' | 'hsl'>('match');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'picker' | 'document' | 'palette'>('picker');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state for floating window
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 70, y: 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state whenever selectedColor changes
  useEffect(() => {
    if (selectedColor) {
      setRgba(selectedColor.rgba);
      setHexInput(selectedColor.hex);
    }
  }, [selectedColor]);

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragOffset.current.x));
      const newY = Math.max(50, Math.min(window.innerHeight - 380, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  if (!isOpen) return null;

  // Determine current active color string to display and insert
  const getFormattedColorValue = (format = outputFormat): string => {
    if (format === 'match' && selectedColor) {
      if (selectedColor.type === 'hex') {
        return rgba.a < 1 ? formatColorString(rgba, 'hex8') : formatColorString(rgba, 'hex');
      }
      if (selectedColor.type === 'rgb') return formatColorString(rgba, 'rgb');
      if (selectedColor.type === 'rgba') return formatColorString(rgba, 'rgba');
      if (selectedColor.type === 'hsl') return formatColorString(rgba, 'hsl');
      if (selectedColor.type === 'hsla') return formatColorString(rgba, 'hsla');
    }
    if (format === 'hex') return rgba.a < 1 ? formatColorString(rgba, 'hex8') : formatColorString(rgba, 'hex');
    if (format === 'rgb') return formatColorString(rgba, 'rgb');
    if (format === 'rgba') return formatColorString(rgba, 'rgba');
    if (format === 'hsl') return formatColorString(rgba, 'hsl');
    return formatColorString(rgba, 'hex');
  };

  const currentColorString = getFormattedColorValue();
  const currentHex = formatColorString(rgba, 'hex');

  // Handle color change from native color picker input or preset
  const handleColorPick = (newHex: string) => {
    const parsed = parseColor(newHex);
    if (parsed) {
      setRgba({ ...parsed.rgba, a: rgba.a });
      setHexInput(parsed.hex);
    }
  };

  // Handle manual Hex text change
  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val)) {
      const parsed = parseColor(val.startsWith('#') ? val : `#${val}`);
      if (parsed) {
        setRgba(parsed.rgba);
      }
    }
  };

  // Handle RGB number inputs
  const handleRgbChange = (channel: 'r' | 'g' | 'b' | 'a', value: number) => {
    let updated = { ...rgba };
    if (channel === 'a') {
      updated.a = Math.max(0, Math.min(1, value));
    } else {
      updated[channel] = Math.max(0, Math.min(255, Math.round(value)));
    }
    setRgba(updated);
    setHexInput(formatColorString(updated, 'hex'));
  };

  // EyeDropper API (Chromium / Modern browsers)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleColorPick(result.sRGBHex);
        }
      } catch (e) {
        console.log('EyeDropper closed', e);
      }
    }
  };

  // Copy current color
  const handleCopyColor = async () => {
    try {
      await navigator.clipboard.writeText(currentColorString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Find index of current selected color in detected list
  const currentIndex = selectedColor ? detectedColors.findIndex((c) => c.startIndex === selectedColor.startIndex) : -1;
  const countOccurrences = selectedColor
    ? detectedColors.filter((c) => c.raw.toLowerCase() === selectedColor.raw.toLowerCase()).length
    : 0;

  // Group unique colors in document
  const uniqueHexSet = Array.from(new Set(detectedColors.map((c) => c.hex.toLowerCase()))) as string[];
  const uniqueDocColors = uniqueHexSet.map((hex: string) => {
    const matching = detectedColors.filter((c) => c.hex.toLowerCase() === hex);
    return {
      hex,
      raw: matching[0].raw,
      count: matching.length,
      item: matching[0],
    };
  });

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed top-0 left-0 z-40 w-80 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl shadow-black/80 flex flex-col text-slate-100 select-none animate-fadeIn transition-shadow"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={startDrag}
        className="px-3 py-2.5 bg-slate-950/80 rounded-t-xl border-b border-slate-800 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200 tracking-wide">Color Picker</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 rounded-full font-mono font-medium">
            {detectedColors.length} detected
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
            title="Close Color Picker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Document Color Navigation Bar */}
          {detectedColors.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-slate-500 font-mono">
                  {currentIndex !== -1 ? `#${currentIndex + 1} of ${detectedColors.length}` : 'No selection'}
                </span>
                {selectedColor && (
                  <span className="font-mono text-cyan-400 truncate max-w-[110px]" title={selectedColor.raw}>
                    (Ln {selectedColor.line}:{selectedColor.col})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={detectedColors.length === 0}
                  onClick={() => {
                    const prev = currentIndex <= 0 ? detectedColors.length - 1 : currentIndex - 1;
                    onSelectColorIndex(prev);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Color in Code"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={detectedColors.length === 0}
                  onClick={() => {
                    const next = currentIndex >= detectedColors.length - 1 ? 0 : currentIndex + 1;
                    onSelectColorIndex(next);
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Color in Code"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-xs px-2 pt-1 gap-1 bg-slate-900/60">
            <button
              onClick={() => setActiveTab('picker')}
              className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
                activeTab === 'picker'
                  ? 'bg-slate-800/90 text-cyan-300 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual Mixer
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
                activeTab === 'document'
                  ? 'bg-slate-800/90 text-cyan-300 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              In Code ({uniqueDocColors.length})
            </button>
            <button
              onClick={() => setActiveTab('palette')}
              className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
                activeTab === 'palette'
                  ? 'bg-slate-800/90 text-cyan-300 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Presets
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-[440px] overflow-y-auto">
            {activeTab === 'picker' && (
              <>
                {/* Visual Preview Box + Interactive Color Input */}
                <div className="flex items-center gap-3">
                  {/* Interactive Dual Preview Chip */}
                  <div className="relative w-16 h-16 rounded-xl border border-slate-700 overflow-hidden shadow-inner shrink-0 group">
                    {/* Checkerboard background for opacity */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #475569 25%, transparent 25%), linear-gradient(-45deg, #475569 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #475569 75%), linear-gradient(-45deg, transparent 75%, #475569 75%)',
                        backgroundSize: '10px 10px',
                        backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                      }}
                    />
                    {/* Live active color layer */}
                    <div
                      className="absolute inset-0 transition-colors"
                      style={{ backgroundColor: formatColorString(rgba, 'rgba') }}
                    />
                    {/* Invisible HTML5 color input over preview */}
                    <input
                      type="color"
                      value={currentHex}
                      onChange={(e) => handleColorPick(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Click to open system color spectrum"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                      <Sliders className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Color string preview & Eyedropper / Copy */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Active Color
                      </span>
                      <div className="flex items-center gap-1">
                        {'EyeDropper' in window && (
                          <button
                            onClick={handleEyeDropper}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Pick color from screen (Eyedropper)"
                          >
                            <Pipette className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={handleCopyColor}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy color string"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="font-mono text-xs text-cyan-300 font-medium truncate">
                        {currentColorString}
                      </span>
                      {selectedColor && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                          Orig: {selectedColor.raw}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alpha Opacity Slider */}
                <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Opacity / Alpha</span>
                    <span className="font-mono text-slate-300">{Math.round(rgba.a * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={rgba.a}
                    onChange={(e) => handleRgbChange('a', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* RGB Numeric Channels */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-rose-400 block mb-0.5">R</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgba.r}
                      onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-center font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">G</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgba.g}
                      onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-center font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-blue-400 block mb-0.5">B</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgba.b}
                      onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-center font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-cyan-400 block mb-0.5">HEX</span>
                    <input
                      type="text"
                      value={hexInput}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      className="w-full bg-transparent text-center font-mono text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Output Format Picker */}
                <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Format:</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    {(['match', 'hex', 'rgb', 'rgba', 'hsl'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOutputFormat(fmt)}
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase transition-colors ${
                          outputFormat === fmt
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fmt === 'match' ? 'Auto' : fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Document Colors Tab */}
            {activeTab === 'document' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Detected in this document:</span>
                  <span className="text-slate-500 font-mono">{uniqueDocColors.length} unique colors</span>
                </div>

                {uniqueDocColors.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-950/40 rounded-lg">
                    No CSS colors detected yet in the code.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {uniqueDocColors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleColorPick(color.hex);
                          const targetIdx = detectedColors.findIndex(
                            (c) => c.startIndex === color.item.startIndex
                          );
                          if (targetIdx !== -1) {
                            onSelectColorIndex(targetIdx);
                          }
                        }}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-left transition-colors group"
                      >
                        <div
                          className="w-4 h-4 rounded-md border border-slate-700 shadow-sm shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[11px] text-slate-300 block truncate group-hover:text-cyan-300">
                            {color.raw}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {color.count} {color.count === 1 ? 'place' : 'places'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Presets Tab */}
            {activeTab === 'palette' && (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 block">Modern Web UI Palettes</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_PALETTES.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handleColorPick(preset.hex)}
                      className="group flex flex-col items-center p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition-all hover:scale-105"
                      title={preset.name}
                    >
                      <div
                        className="w-full h-6 rounded border border-slate-700 shadow"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[9px] font-mono text-slate-400 mt-1 truncate w-full text-center group-hover:text-cyan-300">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Replace Current and Replace All */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <button
                disabled={!selectedColor}
                onClick={() => {
                  if (selectedColor) {
                    onReplaceColor(selectedColor, currentColorString, false);
                  }
                }}
                className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Replace Selected Color Value</span>
              </button>

              {countOccurrences > 1 && selectedColor && (
                <button
                  onClick={() => {
                    onReplaceColor(selectedColor, currentColorString, true);
                  }}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Replace All ({countOccurrences}) Matching Instances</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
