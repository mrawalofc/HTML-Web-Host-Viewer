import React from 'react';
import { Sparkles, X, ArrowRight, Code2, Layers, Cpu } from 'lucide-react';
import { STARTER_TEMPLATES } from '../services/templates';
import { TemplateProject } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateProject) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Starter HTML Templates</h2>
              <p className="text-xs text-slate-400">Load sample interactive web apps with 1-click</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          {STARTER_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-amber-500/50 cursor-pointer transition-all hover:bg-slate-850 flex items-center justify-between group"
            >
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                    {tmpl.title}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono rounded-full border border-blue-500/20">
                    {tmpl.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{tmpl.description}</p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  {(new Blob([tmpl.html]).size / 1024).toFixed(1)} KB • {tmpl.html.split('\n').length} lines
                </div>
              </div>

              <button className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 group-hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium shrink-0 transition-colors">
                <span>Load</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
