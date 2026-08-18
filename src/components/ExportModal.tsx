import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  X,
  Code,
  Share2,
  FileDown,
  Sparkles,
  Link2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  code: string;
  onOpenInNewTab: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  fileName,
  code,
  onOpenInNewTab,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDataUri, setCopiedDataUri] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const cleanName = fileName.endsWith('.html') || fileName.endsWith('.htm') ? fileName : `${fileName}.html`;
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDataUri = async () => {
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
    await navigator.clipboard.writeText(dataUri);
    setCopiedDataUri(true);
    setTimeout(() => setCopiedDataUri(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Export & Run Online</h2>
              <p className="text-xs text-slate-400">Download, copy, or launch your HTML web project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-3">
          {/* 1. Launch in Full Standalone Tab */}
          <div
            onClick={() => {
              onOpenInNewTab();
              onClose();
            }}
            className="p-4 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl hover:border-emerald-500/60 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                  Launch Standalone Host Tab
                </h4>
                <p className="text-[11px] text-slate-400">
                  Run and interact with this web page in a dedicated, isolated browser tab
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold rounded-md">
              Run Now
            </span>
          </div>

          {/* 2. Download HTML File */}
          <div
            onClick={handleDownload}
            className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                  Download HTML Document ({fileName})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Save as standard .html file to your local computer
                </p>
              </div>
            </div>
            <span className="p-2 text-slate-400 group-hover:text-white">
              <Download className="w-4 h-4" />
            </span>
          </div>

          {/* 3. Copy Raw Source Code */}
          <div
            onClick={handleCopyCode}
            className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                  Copy Raw Source Code
                </h4>
                <p className="text-[11px] text-slate-400">
                  Copy the full HTML source directly to clipboard
                </p>
              </div>
            </div>
            <span className="p-2 text-slate-400">
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </span>
          </div>

          {/* 4. Copy Browser Data URI */}
          <div
            onClick={handleCopyDataUri}
            className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                  Copy Browser Data URI
                </h4>
                <p className="text-[11px] text-slate-400">
                  Paste directly into any browser address bar to view offline
                </p>
              </div>
            </div>
            <span className="p-2 text-slate-400">
              {copiedDataUri ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
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
