import React, { useState, useMemo, useEffect } from 'react';
import {
  Info,
  X,
  Shield,
  Layers,
  Code,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  MousePointerClick,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { HtmlMetaAnalysis, InspectedElement } from '../types';

interface HtmlInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlCode: string;
  fileName: string;
  isHighlightMode: boolean;
  onToggleHighlightMode: () => void;
  selectedElement: InspectedElement | null;
  onSelectElement: (element: InspectedElement | null) => void;
  onUpdateElementCode?: (oldSnippet: string, newSnippet: string) => void;
  onFocusInEditor?: (element: InspectedElement) => void;
}

export const HtmlInspectorModal: React.FC<HtmlInspectorModalProps> = ({
  isOpen,
  onClose,
  htmlCode,
  fileName,
  isHighlightMode,
  onToggleHighlightMode,
  selectedElement,
  onSelectElement,
  onUpdateElementCode,
  onFocusInEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'element' | 'meta'>('element');
  const [editableOuterHtml, setEditableOuterHtml] = useState<string>('');
  const [isSavedSnippet, setIsSavedSnippet] = useState<boolean>(false);
  const [newAttrName, setNewAttrName] = useState<string>('');
  const [newAttrValue, setNewAttrValue] = useState<string>('');
  const [showAddAttr, setShowAddAttr] = useState<boolean>(false);

  // Synchronize editable snippet when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setEditableOuterHtml(selectedElement.outerHTML || '');
      setActiveTab('element');
      setIsSavedSnippet(false);
    }
  }, [selectedElement]);

  const analysis = useMemo<HtmlMetaAnalysis>(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlCode, 'text/html');

      const title = doc.querySelector('title')?.innerText;
      const descMeta = doc.querySelector('meta[name="description"]')?.getAttribute('content') || undefined;
      const charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || undefined;
      const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || undefined;

      const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]').length;
      const scripts = doc.querySelectorAll('script').length;
      const images = doc.querySelectorAll('img').length;
      const links = doc.querySelectorAll('a').length;

      const hasInlineStyles = doc.querySelectorAll('style').length > 0 || doc.querySelectorAll('[style]').length > 0;
      const hasInlineScripts = Array.from(doc.querySelectorAll('script')).some((s) => !s.getAttribute('src'));

      const allNodes = doc.querySelectorAll('*').length;

      return {
        title,
        description: descMeta,
        charset,
        viewport,
        stylesheetsCount: stylesheets,
        scriptsCount: scripts,
        imagesCount: images,
        linksCount: links,
        hasInlineStyles,
        hasInlineScripts,
        domNodeEstimate: allNodes,
      };
    } catch (e) {
      return {
        stylesheetsCount: 0,
        scriptsCount: 0,
        imagesCount: 0,
        linksCount: 0,
        hasInlineStyles: false,
        hasInlineScripts: false,
        domNodeEstimate: 0,
      };
    }
  }, [htmlCode]);

  const handleApplySnippetChanges = () => {
    if (!selectedElement || !onUpdateElementCode || !editableOuterHtml) return;
    onUpdateElementCode(selectedElement.outerHTML, editableOuterHtml);
    setIsSavedSnippet(true);
    setTimeout(() => setIsSavedSnippet(false), 2500);
  };

  const handleFocusMainEditor = () => {
    if (!selectedElement || !onFocusInEditor) return;
    onFocusInEditor(selectedElement);
    onClose();
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !selectedElement || !onUpdateElementCode) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(selectedElement.outerHTML, 'text/html');
      const el = doc.body.firstElementChild;
      if (el) {
        el.setAttribute(newAttrName.trim(), newAttrValue.trim());
        const updatedHtml = el.outerHTML;
        onUpdateElementCode(selectedElement.outerHTML, updatedHtml);
        setEditableOuterHtml(updatedHtml);
        setNewAttrName('');
        setNewAttrValue('');
        setShowAddAttr(false);
        setIsSavedSnippet(true);
        setTimeout(() => setIsSavedSnippet(false), 2000);
      }
    } catch (e) {
      console.error('Failed to add attribute', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <Crosshair className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
                  DOM Inspector & Highlight Mode
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Interactive element inspector & metadata for {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Highlight Mode Toggle Button */}
            <button
              onClick={onToggleHighlightMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                isHighlightMode
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Click-to-Inspect Highlight Mode in the live preview"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isHighlightMode ? 'animate-spin-slow' : ''}`} />
              <span>{isHighlightMode ? 'Highlight ON' : 'Highlight Mode'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('element')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'element'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Focused Element & Editor</span>
            {selectedElement && (
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800">
                &lt;{selectedElement.tagName}&gt;
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'meta'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Document Analysis & Metadata</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-200 text-xs">
          {activeTab === 'element' && (
            <div className="space-y-4">
              {/* Highlight Mode Banner Status */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  isHighlightMode
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isHighlightMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200 text-xs">
                      {isHighlightMode
                        ? 'Highlight Mode Active'
                        : 'Highlight Mode Inactive'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isHighlightMode
                        ? 'Click any element in the live preview to instantly focus it in this inspector.'
                        : 'Enable Highlight Mode to hover and inspect elements directly on the canvas.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleHighlightMode}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                    isHighlightMode
                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isHighlightMode ? 'Turn Off' : 'Turn On'}
                </button>
              </div>

              {selectedElement ? (
                <div className="space-y-4">
                  {/* Selector Breadcrumb & Tag Badge */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold text-sm">
                        <span>&lt;{selectedElement.tagName}</span>
                        {selectedElement.id && <span className="text-amber-400">#{selectedElement.id}</span>}
                        {selectedElement.className && (
                          <span className="text-emerald-400 truncate max-w-[200px]">
                            .{selectedElement.className.trim().split(/\s+/).join('.')}
                          </span>
                        )}
                        <span>&gt;</span>
                      </div>

                      {selectedElement.boxModel && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                          {selectedElement.boxModel.width} × {selectedElement.boxModel.height} px
                        </span>
                      )}
                    </div>

                    {/* Breadcrumb Path */}
                    {selectedElement.selectorPath && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800/80 overflow-x-auto">
                        <span className="text-slate-500 uppercase text-[9px] font-sans font-semibold mr-1">
                          DOM Path:
                        </span>
                        <span className="text-cyan-400/90">{selectedElement.selectorPath}</span>
                      </div>
                    )}
                  </div>

                  {/* Inspector's Code Editor */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspector's Code Editor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onFocusInEditor && (
                          <button
                            onClick={handleFocusMainEditor}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] border border-slate-700 transition-colors"
                            title="Scroll and select this element in the main code editor"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Focus in Main Editor</span>
                          </button>
                        )}

                        {onUpdateElementCode && (
                          <button
                            onClick={handleApplySnippetChanges}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-sm ${
                              isSavedSnippet
                                ? 'bg-emerald-600 text-white'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                            }`}
                            title="Apply updated HTML code to document"
                          >
                            {isSavedSnippet ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Applied!</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Apply to Code</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={editableOuterHtml}
                      onChange={(e) => setEditableOuterHtml(e.target.value)}
                      rows={5}
                      spellCheck={false}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-[11.5px] text-cyan-100 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                      placeholder="HTML snippet of selected element..."
                    />

                    {selectedElement.textContent && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 flex items-start gap-1.5">
                        <span className="text-slate-500 font-semibold shrink-0">Text:</span>
                        <span className="text-slate-300 italic truncate">"{selectedElement.textContent}"</span>
                      </div>
                    )}
                  </div>

                  {/* Attributes Inspector & Editor */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Element Attributes</span>
                        <span className="text-slate-500 text-[10px] font-mono">
                          ({selectedElement.attributes.length})
                        </span>
                      </h3>

                      <button
                        onClick={() => setShowAddAttr(!showAddAttr)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Attribute</span>
                      </button>
                    </div>

                    {showAddAttr && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="Name (e.g. style, class, href)"
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-cyan-200 focus:outline-none w-36 font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={newAttrValue}
                          onChange={(e) => setNewAttrValue(e.target.value)}
                          className="bg-slate-950 px-2 py-1 rounded border border-slate-700 text-xs text-slate-200 focus:outline-none flex-1 min-w-[120px] font-mono"
                        />
                        <button
                          onClick={handleAddAttribute}
                          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowAddAttr(false)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {selectedElement.attributes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedElement.attributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-start justify-between gap-1.5 font-mono text-[11px]"
                          >
                            <span className="text-cyan-400 font-semibold shrink-0">{attr.name}:</span>
                            <span className="text-slate-300 truncate max-w-[180px]" title={attr.value}>
                              "{attr.value}"
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">No explicit HTML attributes defined.</p>
                    )}
                  </div>

                  {/* Computed CSS Styles */}
                  {selectedElement.computedStyles && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <h3 className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Computed Styles</span>
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                        {selectedElement.computedStyles.color && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Color</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: selectedElement.computedStyles.color }}
                              />
                              <span className="text-slate-200 truncate">{selectedElement.computedStyles.color}</span>
                            </div>
                          </div>
                        )}

                        {selectedElement.computedStyles.backgroundColor && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Background</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: selectedElement.computedStyles.backgroundColor }}
                              />
                              <span className="text-slate-200 truncate">{selectedElement.computedStyles.backgroundColor}</span>
                            </div>
                          </div>
                        )}

                        {selectedElement.computedStyles.fontSize && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Font Size</span>
                            <span className="text-slate-200 mt-0.5 block">{selectedElement.computedStyles.fontSize}</span>
                          </div>
                        )}

                        {selectedElement.computedStyles.display && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Display</span>
                            <span className="text-slate-200 mt-0.5 block">{selectedElement.computedStyles.display}</span>
                          </div>
                        )}

                        {selectedElement.computedStyles.padding && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Padding</span>
                            <span className="text-slate-200 mt-0.5 block truncate">{selectedElement.computedStyles.padding}</span>
                          </div>
                        )}

                        {selectedElement.computedStyles.margin && (
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 text-[10px] block font-sans">Margin</span>
                            <span className="text-slate-200 mt-0.5 block truncate">{selectedElement.computedStyles.margin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty state when no element clicked yet */
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <MousePointerClick className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">No Element Selected</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {isHighlightMode
                        ? 'Highlight Mode is ON! Click any element (heading, button, image, container) in the live preview to inspect and edit its HTML here.'
                        : 'Turn on Highlight Mode, then click any element in the live preview to view and edit its code.'}
                    </p>
                  </div>

                  {!isHighlightMode && (
                    <button
                      onClick={onToggleHighlightMode}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg text-xs shadow-md shadow-cyan-600/30 transition-all mt-2"
                    >
                      <Crosshair className="w-4 h-4" />
                      <span>Enable Highlight Mode</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-4">
              {/* Metadata Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Document Meta Tags</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Page Title</span>
                    <span className="text-slate-200 font-medium truncate block">
                      {analysis.title || '<Untitled Document>'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Charset</span>
                    <span className="text-slate-200 font-mono">
                      {analysis.charset || 'Not specified (defaults to UTF-8)'}
                    </span>
                  </div>
                </div>

                {analysis.viewport ? (
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[10px]">Viewport Tag (Mobile Ready)</span>
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {analysis.viewport}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Missing meta viewport tag (may not scale smoothly on mobile screens)
                    </span>
                  </div>
                )}
              </div>

              {/* Resource Metrics Grid */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-400" />
                  <span>DOM Elements & Resource Summary</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-bold text-lg">{analysis.domNodeEstimate}</span>
                    <span className="text-slate-500 block text-[11px]">DOM Nodes</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold text-lg">{analysis.scriptsCount}</span>
                    <span className="text-slate-500 block text-[11px]">Script Tags</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-purple-400 font-bold text-lg">{analysis.stylesheetsCount}</span>
                    <span className="text-slate-500 block text-[11px]">Stylesheets</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Inline Scripts</span>
                    <span className={`font-semibold ${analysis.hasInlineScripts ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {analysis.hasInlineScripts ? 'Present' : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Inline CSS</span>
                    <span className={`font-semibold ${analysis.hasInlineStyles ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {analysis.hasInlineStyles ? 'Present' : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sandbox & Security Note */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-300">Isolated Online Sandbox</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    The live preview runs in a secure, sandboxed iframe. JavaScript execution, CSS transforms, Canvas 2D/WebGL, and Web APIs are fully enabled for real-world testing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {selectedElement ? (
              <span className="text-cyan-400 font-mono font-medium">
                Active target: &lt;{selectedElement.tagName}&gt;
              </span>
            ) : (
              <span>Click any element in preview to inspect</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

