import React, { useState } from 'react';
import {
  UploadCloud,
  FileCode2,
  Play,
  ExternalLink,
  Save,
  FolderOpen,
  Eye,
  Columns,
  Code2,
  Download,
  Info,
  LogOut,
  Sparkles,
  CloudCheck,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Maximize2,
  Crosshair,
  Settings,
  CloudUpload,
  RotateCcw
} from 'lucide-react';
import { ViewMode, ViewportDevice } from '../types';
import { User } from 'firebase/auth';

interface NavbarProps {
  fileName: string;
  onFileNameChange: (name: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  viewport: ViewportDevice;
  onViewportChange: (viewport: ViewportDevice) => void;
  onOpenUpload: () => void;
  onOpenDriveBrowse: () => void;
  onSaveToDrive: () => void;
  onOpenDriveSettings?: () => void;
  onOpenExport: () => void;
  onOpenInspector: () => void;
  onOpenTemplates: () => void;
  onOpenInNewTab: () => void;
  onRunCode: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSavingDrive: boolean;
  hasDriveId?: boolean;
  isAutoSaveEnabled?: boolean;
  isAutoSaving?: boolean;
  lastAutoSavedTime?: string | null;
  isHighlightMode?: boolean;
  onToggleHighlightMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  onFileNameChange,
  viewMode,
  onViewModeChange,
  viewport,
  onViewportChange,
  onOpenUpload,
  onOpenDriveBrowse,
  onSaveToDrive,
  onOpenDriveSettings,
  onOpenExport,
  onOpenInspector,
  onOpenTemplates,
  onOpenInNewTab,
  onRunCode,
  user,
  onSignIn,
  onSignOut,
  isSavingDrive,
  hasDriveId,
  isAutoSaveEnabled = false,
  isAutoSaving = false,
  lastAutoSavedTime = null,
  isHighlightMode,
  onToggleHighlightMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand & File Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
            <FileCode2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="font-semibold tracking-tight text-sm text-slate-100 hidden sm:inline">
              HTML<span className="text-cyan-400">Host</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            {isEditingName ? (
              <input
                type="text"
                value={fileName}
                onChange={(e) => onFileNameChange(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="bg-transparent text-xs sm:text-sm font-mono text-cyan-300 focus:outline-none w-32 sm:w-44"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                title="Click to rename file"
                className="text-xs sm:text-sm font-mono text-slate-200 hover:text-cyan-300 truncate max-w-[140px] sm:max-w-[200px] text-left cursor-text"
              >
                {fileName}
              </button>
            )}
            {hasDriveId && (
              <span title="Linked to Google Drive" className="flex items-center text-emerald-400 text-[11px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                Drive
              </span>
            )}
          </div>
        </div>

        {/* Center: Viewport & View Mode Selectors */}
        <div className="hidden md:flex items-center gap-2">
          {/* View Mode Controls */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onViewModeChange('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View (Editor & Live Preview)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => onViewModeChange('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'editor' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Code Editor Only"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              onClick={() => onViewModeChange('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'preview' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Runner Only"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live</span>
            </button>
          </div>

          {/* Viewport Dimension Control (Active in Split / Preview) */}
          {viewMode !== 'editor' && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => onViewportChange('responsive')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'responsive' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Full Responsive (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('desktop')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'desktop' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Desktop View (1280px)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('laptop')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'laptop' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Laptop View (1024px)"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('tablet')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'tablet' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewportChange('mobile')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewport === 'mobile' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-2">
          {/* Templates Picker */}
          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
            title="Choose a starter HTML template"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-sm shadow-blue-600/30"
            title="Upload HTML file from your computer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="font-medium">Upload</span>
          </button>

          {/* Google Drive Controls */}
          {user ? (
            <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={onSaveToDrive}
                disabled={isSavingDrive || isAutoSaving}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-200 hover:text-cyan-300 hover:bg-slate-700/60 rounded transition-colors disabled:opacity-50"
                title="Save current HTML file to your Google Drive"
              >
                <Save className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">{isSavingDrive ? 'Saving...' : 'Save to Drive'}</span>
              </button>

              <button
                onClick={onOpenDriveBrowse}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-200 hover:text-cyan-300 hover:bg-slate-700/60 rounded transition-colors"
                title="Open HTML files stored in Google Drive"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Drive Files</span>
              </button>

              {/* Auto-Save Status / Settings Pill */}
              <button
                onClick={onOpenDriveSettings}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-all border ${
                  isAutoSaveEnabled
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-700/60'
                }`}
                title={
                  isAutoSaveEnabled
                    ? `Auto-Save is active (every 30s while typing) • ${
                        lastAutoSavedTime ? `Last saved: ${lastAutoSavedTime}` : 'Awaiting edits'
                      }. Click to open settings.`
                    : 'Configure Google Drive Auto-Save settings'
                }
              >
                {isAutoSaving ? (
                  <RotateCcw className="w-3 h-3 text-amber-400 animate-spin" />
                ) : isAutoSaveEnabled ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <Settings className="w-3 h-3 text-slate-400" />
                )}
                <span className="hidden xl:inline text-[11px] font-medium">
                  {isAutoSaving ? 'Auto-saving...' : isAutoSaveEnabled ? 'Auto-Save ON' : 'Settings'}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              title="Connect Google Drive to save and open files"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="hidden sm:inline">Connect Drive</span>
            </button>
          )}

          {/* Run In New Tab / Standalone Host */}
          <button
            onClick={onOpenInNewTab}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
            title="Launch and run this HTML document in a full standalone browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">Run Online</span>
          </button>

          {/* Export Dropdown / Modal Trigger */}
          <button
            onClick={onOpenExport}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="Download or share HTML"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Highlight Mode Inspector Button */}
          {onToggleHighlightMode && (
            <button
              onClick={onToggleHighlightMode}
              className={`p-1.5 rounded-lg border transition-all ${
                isHighlightMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/60'
              }`}
              title={isHighlightMode ? 'Highlight Mode is ON (Click to disable)' : 'Enable Highlight Mode (Click any element to inspect & edit)'}
            >
              <Crosshair className={`w-4 h-4 ${isHighlightMode ? 'text-cyan-400 animate-spin-slow' : ''}`} />
            </button>
          )}

          {/* HTML Meta Info Inspector */}
          <button
            onClick={onOpenInspector}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="Inspect HTML DOM, meta tags, and resources"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Account / Profile */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 hover:border-slate-600 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] text-slate-300 max-w-[80px] truncate hidden md:inline">
                  {user.displayName || user.email}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-medium text-slate-200 truncate">{user.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenDriveBrowse();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Google Drive Files</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSaveToDrive();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                    <span>Save Current to Drive</span>
                  </button>
                  {onOpenDriveSettings && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDriveSettings();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        <span>Auto-Save Settings</span>
                      </div>
                      {isAutoSaveEnabled && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  )}
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Google Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
