import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Wand2,
  Filter
} from 'lucide-react';
import { CssLintDiagnostic, LintSeverity } from '../types';

interface CssLintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: CssLintDiagnostic[];
  onJumpToLine: (line: number, column?: number) => void;
  onApplyFix?: (diagnostic: CssLintDiagnostic) => void;
}

export const CssLintPanel: React.FC<CssLintPanelProps> = ({
  isOpen,
  onClose,
  diagnostics,
  onJumpToLine,
  onApplyFix,
}) => {
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warning'>('all');

  if (!isOpen) return null;

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = diagnostics.filter((d) => d.severity === 'info').length;

  const filteredDiagnostics = diagnostics.filter((d) => {
    if (filter === 'error') return d.severity === 'error';
    if (filter === 'warning') return d.severity === 'warning';
    return true;
  });

  return (
    <div className="absolute right-3 bottom-9 z-30 w-96 max-w-[calc(100%-24px)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[380px] animate-fadeIn select-none">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <span>CSS Real-Time Linter</span>
              {diagnostics.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {diagnostics.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
                  Clean
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">Syntax errors & best practices in style blocks</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          title="Close Linter Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({diagnostics.length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'error'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Errors ({errorCount})</span>
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filter === 'warning'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Warnings ({warningCount})</span>
          </button>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1 font-sans text-xs">
        {filteredDiagnostics.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">No CSS Issues Found</p>
              <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto mt-0.5">
                All CSS syntax, brackets, units, and property declarations look great!
              </p>
            </div>
          </div>
        ) : (
          filteredDiagnostics.map((diag) => {
            const isError = diag.severity === 'error';
            const isWarning = diag.severity === 'warning';

            return (
              <div
                key={diag.id}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isError
                    ? 'bg-rose-950/30 border-rose-800/40 hover:border-rose-600/60'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-800/40 hover:border-amber-600/60'
                    : 'bg-blue-950/30 border-blue-800/40 hover:border-blue-600/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    {isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    )}

                    <div className="min-w-0">
                      <p className="text-slate-200 font-medium text-[11.5px] leading-snug break-words">
                        {diag.message}
                      </p>

                      {diag.suggestion && (
                        <p className="text-[10.5px] text-emerald-400/90 mt-0.5 flex items-center gap-1 font-mono">
                          <Wand2 className="w-2.5 h-2.5 shrink-0" />
                          <span>{diag.suggestion}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>Rule: {diag.rule}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => onJumpToLine(diag.line, diag.column)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] rounded border border-slate-700 flex items-center gap-1 transition-colors"
                      title="Jump to line in editor"
                    >
                      <span>Ln {diag.line}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400">
        <span>Scans embedded &lt;style&gt; & inline styles</span>
        <button
          onClick={() => onJumpToLine(diagnostics[0]?.line || 1)}
          disabled={diagnostics.length === 0}
          className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40 disabled:pointer-events-none font-medium"
        >
          Jump to First Issue
        </button>
      </div>
    </div>
  );
};
