import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Check, Code, ArrowRight, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (file: UploadedFile) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onFileLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteName, setPasteName] = useState('pasted-page.html');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{
    name: string;
    size: number;
    content: string;
    linesCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().match(/\.(html|htm|svg|txt|php|xhtml)$/) && file.type !== 'text/html' && file.type !== 'text/plain') {
      setErrorMsg('Please select an HTML, HTM, or text-based web document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setSelectedFileInfo({
        name: file.name,
        size: file.size,
        content: text,
        linesCount: text.split('\n').length,
      });
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmUpload = () => {
    if (!selectedFileInfo) return;
    onFileLoaded({
      id: 'file-' + Date.now(),
      name: selectedFileInfo.name,
      content: selectedFileInfo.content,
      size: selectedFileInfo.size,
      lastModified: Date.now(),
    });
    onClose();
  };

  const handleConfirmPaste = () => {
    if (!pasteContent.trim()) {
      setErrorMsg('Please enter HTML content.');
      return;
    }
    const cleanName = pasteName.endsWith('.html') || pasteName.endsWith('.htm') ? pasteName : `${pasteName}.html`;
    onFileLoaded({
      id: 'paste-' + Date.now(),
      name: cleanName,
      content: pasteContent,
      size: new Blob([pasteContent]).size,
      lastModified: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Upload HTML File</h2>
              <p className="text-xs text-slate-400">Host, render, and use any HTML document instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Select / Drag File</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Paste HTML Code</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'upload' ? (
            <div>
              {!selectedFileInfo ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html,.htm,.svg,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">
                    Drag and drop your HTML file here
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    Supports .html, .htm, standard web documents, or standalone single-file apps
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors">
                    Browse Local Files
                  </span>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200 break-all">{selectedFileInfo.name}</h4>
                        <p className="text-xs text-slate-400">
                          {(selectedFileInfo.size / 1024).toFixed(1)} KB • {selectedFileInfo.linesCount} lines
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFileInfo(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-300">
                    <pre className="whitespace-pre-wrap">{selectedFileInfo.content.slice(0, 400)}...</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">File Name</label>
                <input
                  type="text"
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="index.html"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">HTML Code</label>
                <textarea
                  rows={8}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;<head><title>My Web Page</title></head>&#10;<body>&#10;  <h1>Hello World!</h1>&#10;</body>&#10;</html>"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'upload' ? (
            <button
              onClick={handleConfirmUpload}
              disabled={!selectedFileInfo}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
            >
              <span>Load & Run Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleConfirmPaste}
              disabled={!pasteContent.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
            >
              <span>Load & Run Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
