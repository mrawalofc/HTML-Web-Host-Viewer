import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { CodeEditor } from './components/CodeEditor';
import { LiveSandbox } from './components/LiveSandbox';
import { ConsoleDrawer } from './components/ConsoleDrawer';
import { UploadModal } from './components/UploadModal';
import { DriveModal } from './components/DriveModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { HtmlInspectorModal } from './components/HtmlInspectorModal';
import { STARTER_TEMPLATES } from './services/templates';
import { ViewMode, ViewportDevice, ConsoleMessage, UploadedFile, TemplateProject, InspectedElement, ElementLocation, EditorTheme } from './types';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import { saveHtmlToDrive } from './services/drive';
import { locateElementInCode } from './services/elementLocator';
import { UploadCloud, Sparkles, FolderOpen, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // State for document & editor
  const [fileName, setFileName] = useState<string>('cyber-pulse.html');
  const [code, setCode] = useState<string>(STARTER_TEMPLATES[0].html);
  const [liveCode, setLiveCode] = useState<string>(STARTER_TEMPLATES[0].html);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [viewport, setViewport] = useState<ViewportDevice>('responsive');
  const [autoRun, setAutoRun] = useState<boolean>(true);

  // Editor Theme state (Light / Dark)
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(() => {
    try {
      const saved = localStorage.getItem('htmlhost_editor_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleEditorTheme = () => {
    setEditorTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('htmlhost_editor_theme', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Highlight Mode & Element Inspector state
  const [isHighlightMode, setIsHighlightMode] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<InspectedElement | null>(null);
  const [focusedElementLocation, setFocusedElementLocation] = useState<ElementLocation | null>(null);

  // Drive storage linking
  const [currentDriveId, setCurrentDriveId] = useState<string | undefined>(undefined);
  const [driveWebViewLink, setDriveWebViewLink] = useState<string | undefined>(undefined);
  const [isSavingDrive, setIsSavingDrive] = useState<boolean>(false);
  const [driveModalTab, setDriveModalTab] = useState<'browse' | 'save' | 'settings'>('browse');

  // Google Drive Auto-Save state
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('htmlhost_drive_autosave');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);

  // Refs for tracking active typing and auto-save cooldown
  const lastSavedCodeRef = useRef<string>(STARTER_TEMPLATES[0].html);
  const lastTypedTimeRef = useRef<number>(0);
  const lastAutoSaveAttemptRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // Console output log state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // User auth state
  const [user, setUser] = useState<User | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isDriveOpen, setIsDriveOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Track global window drag for drag-and-drop
  const [globalDragActive, setGlobalDragActive] = useState<boolean>(false);
  const dragCounter = useRef(0);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Track code changes and mark active typing timestamp
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    lastTypedTimeRef.current = Date.now();
  };

  // Background Auto-Save to Google Drive effect: triggers every 30s while actively typing
  useEffect(() => {
    if (!isAutoSaveEnabled || !user) return;

    const autoSaveInterval = setInterval(async () => {
      const now = Date.now();
      const hasUnsavedChanges = code !== lastSavedCodeRef.current;
      const isActivelyTyping = now - lastTypedTimeRef.current < 45000; // Typed within the last 45 seconds
      const elapsedSinceLastSave = now - lastAutoSaveAttemptRef.current;

      if (hasUnsavedChanges && isActivelyTyping && elapsedSinceLastSave >= 30000 && !isSavingRef.current) {
        isSavingRef.current = true;
        lastAutoSaveAttemptRef.current = now;
        setIsAutoSaving(true);

        try {
          const token = await getAccessToken();
          if (!token) throw new Error('Not authenticated');

          const result = await saveHtmlToDrive(fileName, code, token, currentDriveId);
          setCurrentDriveId(result.id);
          setDriveWebViewLink(result.webViewLink);
          lastSavedCodeRef.current = code;

          const timeString = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setLastAutoSavedTime(timeString);
        } catch (err: any) {
          console.warn('Background auto-save to Google Drive encountered an error:', err);
        } finally {
          setIsAutoSaving(false);
          isSavingRef.current = false;
        }
      }
    }, 2500);

    return () => clearInterval(autoSaveInterval);
  }, [isAutoSaveEnabled, user, code, fileName, currentDriveId]);

  // Toggle Auto-Save setting
  const handleToggleAutoSave = (enabled: boolean) => {
    setIsAutoSaveEnabled(enabled);
    try {
      localStorage.setItem('htmlhost_drive_autosave', String(enabled));
    } catch {
      // ignore
    }
    if (enabled) {
      lastAutoSaveAttemptRef.current = 0; // trigger soon after typing
      if (!user) {
        setDriveModalTab('settings');
        setIsDriveOpen(true);
        showToast('Connect Google Drive to enable background auto-saving', 'error');
      } else {
        showToast('Auto-Save enabled (saves every 30s while typing)', 'success');
      }
    } else {
      showToast('Auto-Save disabled', 'success');
    }
  };

  // Auto-run debounce timer
  useEffect(() => {
    if (!autoRun) return;
    const timer = setTimeout(() => {
      setLiveCode(code);
    }, 400);
    return () => clearTimeout(timer);
  }, [code, autoRun]);

  const handleManualRun = () => {
    setLiveCode(code);
    showToast('Sandbox refreshed', 'success');
  };

  const handleConsoleMessage = useCallback((msg: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    const newMsg: ConsoleMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      type: msg.type,
      message: msg.message,
    };
    setConsoleMessages((prev) => [...prev.slice(-150), newMsg]);
  }, []);

  const handleClearConsole = () => {
    setConsoleMessages([]);
  };

  const handleFileLoaded = (file: UploadedFile) => {
    setFileName(file.name);
    setCode(file.content);
    setLiveCode(file.content);
    setCurrentDriveId(file.driveFileId);
    setDriveWebViewLink(file.driveWebViewLink);
    lastSavedCodeRef.current = file.content;
    lastAutoSaveAttemptRef.current = Date.now();
    setConsoleMessages([]);
    showToast(`Loaded ${file.name} successfully!`, 'success');
  };

  const handleSelectTemplate = (template: TemplateProject) => {
    setFileName(`${template.id}.html`);
    setCode(template.html);
    setLiveCode(template.html);
    setCurrentDriveId(undefined);
    setDriveWebViewLink(undefined);
    lastSavedCodeRef.current = template.html;
    lastAutoSaveAttemptRef.current = Date.now();
    setConsoleMessages([]);
    showToast(`Loaded "${template.title}" template!`, 'success');
  };

  const handleFileLoadedFromDrive = (
    name: string,
    content: string,
    driveFileId: string,
    webViewLink?: string
  ) => {
    setFileName(name);
    setCode(content);
    setLiveCode(content);
    setCurrentDriveId(driveFileId);
    setDriveWebViewLink(webViewLink);
    lastSavedCodeRef.current = content;
    lastAutoSaveAttemptRef.current = Date.now();
    setConsoleMessages([]);
    showToast(`Loaded "${name}" from Google Drive!`, 'success');
  };

  const handleDriveSaveSuccess = (driveId: string, name: string, webViewLink?: string) => {
    setCurrentDriveId(driveId);
    setDriveWebViewLink(webViewLink);
    setFileName(name);
    lastSavedCodeRef.current = code;
    lastAutoSaveAttemptRef.current = Date.now();
    const timeString = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastAutoSavedTime(timeString);
    showToast(`Saved "${name}" to Google Drive!`, 'success');
  };

  // Quick 1-click Save to Drive from navbar
  const handleQuickSaveToDrive = async () => {
    if (!user) {
      setDriveModalTab('save');
      setIsDriveOpen(true);
      return;
    }
    setIsSavingDrive(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const result = await saveHtmlToDrive(fileName, code, token, currentDriveId);
      setCurrentDriveId(result.id);
      setDriveWebViewLink(result.webViewLink);
      setFileName(result.name);
      lastSavedCodeRef.current = code;
      lastAutoSaveAttemptRef.current = Date.now();
      const timeString = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastAutoSavedTime(timeString);
      showToast(`Saved "${result.name}" to Google Drive!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save to Drive', 'error');
    } finally {
      setIsSavingDrive(false);
    }
  };

  // Open standalone HTML in new tab as a live hosted page
  const handleOpenInNewTab = () => {
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Auth actions
  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result?.user) {
        setUser(result.user);
        showToast(`Connected as ${result.user.displayName || result.user.email}!`, 'success');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      showToast(err.message || 'Google sign in failed', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setCurrentDriveId(undefined);
      setDriveWebViewLink(undefined);
      showToast('Signed out of Google account', 'success');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Element selection & highlighting from LiveSandbox or Inspector
  const handleElementSelect = useCallback((element: InspectedElement) => {
    setSelectedElement(element);
    const location = locateElementInCode(code, element);
    setFocusedElementLocation(location);

    if (location) {
      showToast(`Focused <${element.tagName}${element.id ? '#' + element.id : ''}> on line ${location.line}`, 'success');
    } else {
      showToast(`Inspecting <${element.tagName}>`, 'success');
    }
  }, [code]);

  // Update HTML code from Inspector modal or direct editing
  const handleUpdateElementCode = (oldSnippet: string, newSnippet: string) => {
    if (!oldSnippet || oldSnippet === newSnippet) return;
    if (code.includes(oldSnippet)) {
      const updatedCode = code.replace(oldSnippet, newSnippet);
      setCode(updatedCode);
      setLiveCode(updatedCode);
      showToast('Element updated in source code!', 'success');
    } else if (focusedElementLocation) {
      const updatedCode =
        code.substring(0, focusedElementLocation.startIndex) +
        newSnippet +
        code.substring(focusedElementLocation.endIndex);
      setCode(updatedCode);
      setLiveCode(updatedCode);
      showToast('Element updated in source code!', 'success');
    } else {
      showToast('Could not find original element snippet in code', 'error');
    }
  };

  // Focus element in code editor from inspector
  const handleFocusInEditor = (element: InspectedElement) => {
    if (viewMode === 'preview') {
      setViewMode('split');
    }
    const location = locateElementInCode(code, element);
    setFocusedElementLocation(location);
    setSelectedElement(element);
    showToast(`Navigated to line ${location?.line || 1} in Code Editor`, 'success');
  };

  // Drag and drop onto anywhere on the window
  const handleWindowDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setGlobalDragActive(true);
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setGlobalDragActive(false);
    }
  };

  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGlobalDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().match(/\.(html|htm|svg|txt)$/) || file.type.includes('html') || file.type.includes('text')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = (event.target?.result as string) || '';
          handleFileLoaded({
            id: 'drop-' + Date.now(),
            name: file.name,
            content,
            size: file.size,
            lastModified: Date.now(),
          });
        };
        reader.readAsText(file);
      } else {
        showToast('Please drop an HTML or text web document.', 'error');
      }
    }
  };

  return (
    <div
      onDragEnter={handleWindowDragEnter}
      onDragLeave={handleWindowDragLeave}
      onDragOver={handleWindowDragOver}
      onDrop={handleWindowDrop}
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans"
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-14 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Global Drag Overlay */}
      {globalDragActive && (
        <div className="absolute inset-0 z-50 bg-blue-900/40 backdrop-blur-sm border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-8 pointer-events-none">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-400/50 shadow-2xl flex flex-col items-center text-center max-w-sm">
            <UploadCloud className="w-12 h-12 text-cyan-400 animate-bounce mb-2" />
            <h3 className="text-base font-bold text-slate-100">Drop HTML file here</h3>
            <p className="text-xs text-slate-300 mt-1">Instant live hosting, live preview, and code editing</p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        fileName={fileName}
        onFileNameChange={setFileName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewport={viewport}
        onViewportChange={setViewport}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDriveBrowse={() => {
          setDriveModalTab('browse');
          setIsDriveOpen(true);
        }}
        onSaveToDrive={handleQuickSaveToDrive}
        onOpenDriveSettings={() => {
          setDriveModalTab('settings');
          setIsDriveOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenInNewTab={handleOpenInNewTab}
        onRunCode={handleManualRun}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSavingDrive={isSavingDrive}
        hasDriveId={Boolean(currentDriveId)}
        isAutoSaveEnabled={isAutoSaveEnabled}
        isAutoSaving={isAutoSaving}
        lastAutoSavedTime={lastAutoSavedTime}
        isHighlightMode={isHighlightMode}
        onToggleHighlightMode={() => setIsHighlightMode((prev) => !prev)}
      />

      {/* Main Workspace: Split / Editor / Live Sandbox */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Code Editor Pane */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 min-w-[320px]' : 'w-full'} h-full flex flex-col`}>
            <CodeEditor
              code={code}
              onChange={handleCodeChange}
              onRun={handleManualRun}
              autoRun={autoRun}
              onToggleAutoRun={setAutoRun}
              fileName={fileName}
              theme={editorTheme}
              onToggleTheme={handleToggleEditorTheme}
              focusedElement={selectedElement}
              focusedElementLocation={focusedElementLocation}
              onClearFocusedElement={() => {
                setSelectedElement(null);
                setFocusedElementLocation(null);
              }}
            />
          </div>
        )}

        {/* Live Runner Sandbox Pane */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 flex-1' : 'w-full'} h-full flex flex-col bg-slate-900 overflow-hidden`}>
            <LiveSandbox
              htmlCode={liveCode}
              viewport={viewport}
              onViewportChange={setViewport}
              onConsoleMessage={handleConsoleMessage}
              onOpenInNewTab={handleOpenInNewTab}
              onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)}
              consoleCount={consoleMessages.length}
              isConsoleOpen={isConsoleOpen}
              isHighlightMode={isHighlightMode}
              onToggleHighlightMode={() => setIsHighlightMode((prev) => !prev)}
              onElementSelect={handleElementSelect}
              selectedElement={selectedElement}
            />
          </div>
        )}
      </main>

      {/* Embedded Developer Console Drawer */}
      <ConsoleDrawer
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        messages={consoleMessages}
        onClear={handleClearConsole}
      />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileLoaded={handleFileLoaded}
      />

      <DriveModal
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        user={user}
        currentFileName={fileName}
        currentCode={code}
        currentDriveId={currentDriveId}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={handleToggleAutoSave}
        isAutoSaving={isAutoSaving}
        lastAutoSavedTime={lastAutoSavedTime}
        initialTab={driveModalTab}
        onFileLoadedFromDrive={handleFileLoadedFromDrive}
        onDriveSaveSuccess={handleDriveSaveSuccess}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        fileName={fileName}
        code={code}
        onOpenInNewTab={handleOpenInNewTab}
      />

      <HtmlInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        htmlCode={code}
        fileName={fileName}
        isHighlightMode={isHighlightMode}
        onToggleHighlightMode={() => setIsHighlightMode((prev) => !prev)}
        selectedElement={selectedElement}
        onSelectElement={setSelectedElement}
        onUpdateElementCode={handleUpdateElementCode}
        onFocusInEditor={handleFocusInEditor}
      />
    </div>
  );
}
