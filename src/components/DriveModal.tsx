import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Save,
  Trash2,
  ExternalLink,
  Search,
  RotateCcw,
  X,
  FileCode,
  Calendar,
  HardDrive,
  Check,
  AlertCircle,
  ArrowRight,
  Settings,
  Clock,
  CloudCheck,
  CloudUpload,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DriveFileItem } from '../types';
import { listHtmlFiles, fetchFileContent, saveHtmlToDrive, deleteDriveFile } from '../services/drive';
import { getAccessToken, googleSignIn } from '../services/auth';
import { User } from 'firebase/auth';

interface DriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentFileName: string;
  currentCode: string;
  currentDriveId?: string;
  isAutoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  isAutoSaving?: boolean;
  lastAutoSavedTime?: string | null;
  initialTab?: 'browse' | 'save' | 'settings';
  onFileLoadedFromDrive: (name: string, content: string, driveFileId: string, webViewLink?: string) => void;
  onDriveSaveSuccess: (driveId: string, name: string, webViewLink?: string) => void;
}

export const DriveModal: React.FC<DriveModalProps> = ({
  isOpen,
  onClose,
  user,
  currentFileName,
  currentCode,
  currentDriveId,
  isAutoSaveEnabled,
  onToggleAutoSave,
  isAutoSaving = false,
  lastAutoSavedTime = null,
  initialTab = 'browse',
  onFileLoadedFromDrive,
  onDriveSaveSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'save' | 'settings'>(initialTab);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveFileName, setSaveFileName] = useState(currentFileName);
  const [overwriteExisting, setOverwriteExisting] = useState(Boolean(currentDriveId));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (user) {
        loadFiles();
        setSaveFileName(currentFileName);
        setOverwriteExisting(Boolean(currentDriveId));
      }
    }
  }, [isOpen, user, currentFileName, currentDriveId, initialTab]);

  const loadFiles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Please sign in with Google to access your Drive files.');
      }
      const files = await listHtmlFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error loading drive files:', err);
      setErrorMsg(err.message || 'Failed to load files from Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (file: DriveFileItem) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const content = await fetchFileContent(file.id, token);
      onFileLoadedFromDrive(file.name, content, file.id, file.webViewLink);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download file from Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDrive = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in with Google to save to Drive.');

      const targetId = overwriteExisting ? currentDriveId : undefined;
      const result = await saveHtmlToDrive(saveFileName, currentCode, token, targetId);

      setSuccessMsg(`Successfully saved "${result.name}" to your Google Drive!`);
      onDriveSaveSuccess(result.id, result.name, result.webViewLink);
      await loadFiles();
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save file to Google Drive.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this file from Google Drive?')) return;

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      await deleteDriveFile(fileId, token);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete file.');
    }
  };

  if (!isOpen) return null;

  const filteredFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Google Drive Cloud Storage</h2>
              <p className="text-xs text-slate-400">Save and load your HTML projects directly with your Google account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 justify-between items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab('browse')}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'browse'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Browse Drive ({driveFiles.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('save')}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'save'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save to Drive</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Auto-Save & Settings</span>
              {isAutoSaveEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {activeTab === 'browse' && (
            <button
              onClick={loadFiles}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 pb-2"
              title="Refresh files"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!user ? (
            <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800 p-6">
              <HardDrive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200 mb-1">Google Drive Connection Required</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Sign in to save HTML projects to your Drive, access them from any device, and load saved websites.
              </p>
              <button
                onClick={async () => {
                  try {
                    await googleSignIn();
                    loadFiles();
                  } catch (e: any) {
                    setErrorMsg(e.message);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
              >
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : activeTab === 'browse' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter Drive HTML files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Files List */}
              {loading && driveFiles.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center">
                  <RotateCcw className="w-6 h-6 animate-spin text-amber-400 mb-2" />
                  <span>Loading files from Google Drive...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800/80 p-6">
                  <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-300">No HTML files found in Drive</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Save Current to Drive" to store your first HTML file in your Google account.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleOpenFile(file)}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                              {file.name}
                            </h4>
                            {currentDriveId === file.id && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-mono">
                                Currently Open
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            {file.modifiedTime && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(file.modifiedTime).toLocaleDateString()}
                              </span>
                            )}
                            {file.size && (
                              <span>{(parseInt(file.size, 10) / 1024).toFixed(1)} KB</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700/60 transition-colors"
                            title="View in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={(e) => handleDeleteFile(e, file.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-700/60 transition-colors"
                          title="Delete from Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded text-xs font-medium"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'save' ? (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    File Name in Google Drive
                  </label>
                  <input
                    type="text"
                    value={saveFileName}
                    onChange={(e) => setSaveFileName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    placeholder="my-web-project.html"
                  />
                </div>

                {currentDriveId && (
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Overwrite existing Drive file (ID: {currentDriveId.slice(0, 8)}...)</span>
                    </label>
                  </div>
                )}

                <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Document Size: {(new Blob([currentCode]).size / 1024).toFixed(1)} KB</span>
                  <span>Lines: {currentCode.split('\n').length}</span>
                </div>
              </div>

              {/* Auto-Save Promo Card inside Save Tab */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-900/50 to-blue-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <CloudUpload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Continuous Auto-Save</h4>
                    <p className="text-[11px] text-slate-400">
                      Automatically save to Drive every 30s while actively typing.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isAutoSaveEnabled}
                    onChange={(e) => onToggleAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveToDrive}
                  disabled={saving || !saveFileName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving to Google Drive...' : 'Save File to Drive'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Auto-Save & Settings Tab */
            <div className="space-y-4">
              {/* Primary Toggle Hero Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isAutoSaveEnabled
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}
                    >
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-100">
                          Auto-Save to Google Drive
                        </h3>
                        {isAutoSaveEnabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        Triggers a background save to your Google Drive every 30 seconds while you are actively typing in the Code Editor.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isAutoSaveEnabled}
                      onChange={(e) => onToggleAutoSave(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Auto-Save Specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-medium text-[11px]">Save Interval</span>
                    </div>
                    <p className="font-mono text-slate-200 text-xs font-semibold">Every 30 seconds</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">While actively typing</p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium text-[11px]">Last Saved</span>
                    </div>
                    <p className="font-mono text-slate-200 text-xs font-semibold">
                      {isAutoSaving ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          Saving...
                        </span>
                      ) : lastAutoSavedTime ? (
                        lastAutoSavedTime
                      ) : (
                        'Not saved yet'
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {lastAutoSavedTime ? 'Background synced' : 'Awaiting edits'}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-medium text-[11px]">Target File</span>
                    </div>
                    <p className="font-mono text-slate-200 text-xs font-semibold truncate" title={currentFileName}>
                      {currentFileName}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {currentDriveId ? `ID: ${currentDriveId.slice(0, 8)}...` : 'Will auto-link'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Cards */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>How Background Auto-Save Works</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>
                      <strong className="text-slate-300">Active Typing Detection:</strong> Background saves only run when new edits have been detected in the code editor, saving API quota and bandwidth.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>
                      <strong className="text-slate-300">Non-blocking Execution:</strong> Runs seamlessly in the background with real-time status indicators without interrupting your cursor or editor workflow.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>
                      <strong className="text-slate-300">Direct Google Drive Sync:</strong> Directly patches your file on Google Drive so you can open or host it anywhere.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Immediate Save action button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Prefer a manual snapshot?
                </span>
                <button
                  onClick={handleSaveToDrive}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving...' : 'Save to Drive Now'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
