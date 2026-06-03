import { useState, useEffect, useCallback, useRef } from 'react';
import { Command, Zap } from 'lucide-react';
import { CodeInput } from './components/CodeInput';
import { DebtDashboard } from './components/DebtDashboard';
import { ArchitectureMap } from './components/ArchitectureMap';
import { AnalysisPanel } from './components/AnalysisPanel';
import { DiffViewer } from './components/DiffViewer';
import { DocPreview } from './components/DocPreview';
import { CommandBar, useCommandBarShortcut } from './components/CommandBar';
import { SessionSidebar } from './components/SessionSidebar';
import { useStream } from './hooks/useStream';
import { useSession } from './hooks/useSession';

// Resizable Handle Component
function ResizeHandle({ direction = 'horizontal', onResize, className = '' }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    
    const handleMouseMove = (moveEvent) => {
      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - startPos;
      onResize(delta);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className={`${direction === 'horizontal' 
        ? 'w-1 cursor-col-resize hover:bg-accent-amber' 
        : 'h-1 cursor-row-resize hover:bg-accent-amber'
      } bg-border-dark transition-colors ${isDragging ? 'bg-accent-amber' : ''} ${className}`}
      onMouseDown={handleMouseDown}
    />
  );
}

function App() {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('debt');
  const [debtData, setDebtData] = useState(null);
  const [archData, setArchData] = useState(null);
  const [refactorData, setRefactorData] = useState(null);
  const [docsData, setDocsData] = useState(null);
  const [explainData, setExplainData] = useState(null);
  const [sourceName, setSourceName] = useState('');
  
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  
  // Panel sizes (in pixels or percentages)
  const [sidebarWidth, setSidebarWidth] = useState(260); // Session sidebar
  const [codeInputHeight, setCodeInputHeight] = useState(280); // Code input section
  const [leftPanelWidth, setLeftPanelWidth] = useState(480); // Left column (code + debt)
  
  // Min/max sizes
  const MIN_SIDEBAR = 150;
  const MAX_SIDEBAR = 400;
  const MIN_CODE_INPUT = 100;
  const MAX_CODE_INPUT = 500;
  const MIN_LEFT_PANEL = 300;
  const MAX_LEFT_PANEL = 800;
  
  const { isStreaming, streamText, error, startStream, stopStream } = useStream();
  const { sessions, currentSession, saveSession, loadSession, clearAllSessions } = useSession();

  // Handle command bar keyboard shortcut
  useCommandBarShortcut(() => setIsCommandBarOpen(true));

  // Load saved session on mount
  useEffect(() => {
    if (currentSession) {
      setCode(currentSession.code || '');
      setSourceName(currentSession.source || '');
      
      if (currentSession.results) {
        if (currentSession.results.debt) setDebtData(currentSession.results.debt);
        if (currentSession.results.arch) setArchData(currentSession.results.arch);
        if (currentSession.results.refactor) setRefactorData(currentSession.results.refactor);
        if (currentSession.results.docs) setDocsData(currentSession.results.docs);
      }
    }
  }, [currentSession]);

  // Parse streaming text based on mode
  useEffect(() => {
    if (!streamText) return;

    // Try to parse as JSON
    try {
      let cleaned = streamText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      
      const parsed = JSON.parse(cleaned.trim());
      
      // Determine what type of data this is based on structure
      if ('debt_score' in parsed) {
        setDebtData(parsed);
      } else if ('modules' in parsed) {
        setArchData(parsed);
      } else if ('refactors' in parsed) {
        setRefactorData(parsed);
      } else if ('functions' in parsed || 'file_summary' in parsed) {
        setDocsData(parsed);
      }
    } catch {
      // Not JSON yet, just text
    }
  }, [streamText]);

  const handleSubmit = useCallback((codeContent, language, source) => {
    if (!codeContent.trim()) return;
    
    setCode(codeContent);
    setSourceName(source);
    
    // Clear previous results
    setDebtData(null);
    setArchData(null);
    setRefactorData(null);
    setDocsData(null);
    setExplainData(null);
    
    // Run all analyses in PARALLEL for maximum speed
    const analyses = [
      { mode: 'debt', setter: setDebtData },
      { mode: 'map', setter: setArchData },
      { mode: 'docs', setter: setDocsData },
      { mode: 'refactor', setter: setRefactorData },
      { mode: 'explain', setter: setExplainData }
    ];
    
    // Track which data was set for session save
    let debtResult = null, archResult = null, docsResult = null, refactorResult = null;
    const setters = { 
      debt: (d) => { debtResult = d; setDebtData(d); }, 
      map: (d) => { archResult = d; setArchData(d); },
      docs: (d) => { docsResult = d; setDocsData(d); },
      refactor: (d) => { refactorResult = d; setRefactorData(d); },
      explain: (d) => { explainResult = d; setExplainData(d); } 
    };
    
    // Start all analyses simultaneously
    const analysisPromises = analyses.map(({ mode, setter }, index) => {
      return new Promise((resolve) => {
        startStream(mode, codeContent, language, (fullText) => {
          try {
            let cleaned = fullText.trim();
            cleaned = cleaned.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            setters[mode](parsed);
          } catch (e) {
            console.error(`Failed to parse ${mode} response`);
          }
          resolve();
        });
      });
    });
    
    // Wait for all to complete, then save session
    Promise.all(analysisPromises).then(() => {
      saveSession({
        source,
        language,
        debtScore: debtResult?.debt_score,
        summary: debtResult?.summary,
        results: { debt: debtResult, arch: archResult, docs: docsResult, refactor: refactorResult, explain: explainResult },
        code: codeContent,
        mode: 'debt'
      });
    });
  }, [startStream, saveSession]);

  const handleCommand = useCallback((cmdId) => {
    if (!code.trim()) {
      alert('Please paste or load code first');
      return;
    }

    switch (cmdId) {
      case 'explain':
        startStream('explain', code, detectLanguage(code), () => {});
        setActiveTab('analysis');
        break;
      case 'debt':
        startStream('debt', code, detectLanguage(code), (fullText) => {
          try {
            let cleaned = fullText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            setDebtData(parsed);
            saveSession({
              source: sourceName,
              language: detectLanguage(code),
              debtScore: parsed.debt_score,
              summary: parsed.summary,
              results: { debt: parsed },
              code,
              mode: 'debt'
            });
          } catch (e) {
            console.error('Failed to parse:', e);
          }
        });
        setActiveTab('debt');
        break;
      case 'docs':
        startStream('docs', code, detectLanguage(code), (fullText) => {
          try {
            let cleaned = fullText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            setDocsData(parsed);
          } catch (e) {
            console.error('Failed to parse:', e);
          }
        });
        setActiveTab('docs');
        break;
      case 'refactor':
        startStream('refactor', code, detectLanguage(code), (fullText) => {
          try {
            let cleaned = fullText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            setRefactorData(parsed);
          } catch (e) {
            console.error('Failed to parse:', e);
          }
        });
        setActiveTab('refactors');
        break;
      case 'map':
        startStream('map', code, detectLanguage(code), (fullText) => {
          try {
            let cleaned = fullText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
            const parsed = JSON.parse(cleaned);
            setArchData(parsed);
          } catch (e) {
            console.error('Failed to parse:', e);
          }
        });
        setActiveTab('arch');
        break;
      case 'focus-security':
        startStream('debt', code, detectLanguage(code), () => {});
        setActiveTab('debt');
        break;
      case 'focus-performance':
        startStream('debt', code, detectLanguage(code), () => {});
        setActiveTab('debt');
        break;
      case 'reset':
        setCode('');
        setDebtData(null);
        setArchData(null);
        setRefactorData(null);
        setDocsData(null);
    setExplainData(null);
        setSourceName('');
        break;
      case 'export':
        exportReport();
        break;
    }
  }, [code, startStream, saveSession, sourceName]);

  const detectLanguage = (codeText) => {
    const patterns = [
      { lang: 'javascript', regex: /const|let|var|function|=>|require\(|module\.exports|import\s+.*\s+from/i },
      { lang: 'typescript', regex: /interface\s+\w+|:\s*(string|number|boolean|any)\b|type\s+\w+\s*=/ },
      { lang: 'python', regex: /def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+.*:/ },
      { lang: 'go', regex: /func\s+\w+|package\s+\w+|import\s+"|:=|go\s+func/i },
      { lang: 'rust', regex: /fn\s+\w+|let\s+mut|impl\s+\w+|pub\s+fn/i },
      { lang: 'java', regex: /public\s+(class|static|void)|import\s+java\./ },
    ];
    for (const { lang, regex } of patterns) {
      if (regex.test(codeText)) return lang;
    }
    return 'text';
  };

  const exportReport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let md = `# Codebase Analysis Report\n\n`;
    md += `**Generated:** ${new Date().toLocaleString()}\n`;
    md += `**Source:** ${sourceName || 'Unknown'}\n`;
    md += `**Debt Score:** ${debtData?.debt_score ?? 'N/A'}/100\n\n`;
    
    md += `## Summary\n${debtData?.summary || 'No summary available'}\n\n`;
    
    if (debtData?.findings?.length > 0) {
      md += `## Technical Debt Findings\n`;
      debtData.findings.forEach(f => {
        md += `### [${f.severity?.toUpperCase()}] ${f.title}\n`;
        md += `**Location:** ${f.location || 'Unknown'}\n`;
        md += `**Impact:** ${f.impact || 'N/A'}\n`;
        md += `**Fix:** ${f.fix || 'N/A'}\n\n`;
      });
    }
    
    if (archData?.modules?.length > 0) {
      md += `## Architecture\n`;
      md += `### Modules\n`;
      archData.modules.forEach(m => {
        md += `- **${m.name}** (${m.type}): ${m.responsibilities?.join(', ') || 'No description'}\n`;
      });
    }
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codebase-report-${timestamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSession = (sessionId) => {
    const session = loadSession(sessionId);
    if (session) {
      setCode(session.code || '');
      setSourceName(session.source || '');
      if (session.results) {
        if (session.results.debt) setDebtData(session.results.debt);
        if (session.results.arch) setArchData(session.results.arch);
        if (session.results.refactor) setRefactorData(session.results.refactor);
        if (session.results.docs) setDocsData(session.results.docs);
        if (session.results.explain) setExplainData(session.results.explain);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg-dark text-text-light">
      {/* AI Integration Banner */}
      {showBanner && (
        <div className="flex items-center justify-between px-4 py-2 bg-accent-amber text-bg-dark">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="font-mono text-xs font-medium">
              Powered by NVIDIA AI • Analysis runs automatically on submit
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="font-mono text-xs hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border-dark">
        <div className="flex items-center gap-6">
          <h1 className="font-syne text-xl font-semibold tracking-wider">CODEBASE</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Analysis tabs */}
          <div className="flex border-b border-border-dark mr-4">
            <button
              onClick={() => setActiveTab('debt')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 ${
                activeTab === 'debt' 
                  ? 'border-accent-amber text-text-light' 
                  : 'border-transparent text-gray-500 hover:text-text-light'
              }`}
            >
              Debt
            </button>
            <button
              onClick={() => setActiveTab('arch')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 ${
                activeTab === 'arch' 
                  ? 'border-accent-amber text-text-light' 
                  : 'border-transparent text-gray-500 hover:text-text-light'
              }`}
            >
              Architecture
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 ${
                activeTab === 'docs' 
                  ? 'border-accent-amber text-text-light' 
                  : 'border-transparent text-gray-500 hover:text-text-light'
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setActiveTab('refactors')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 ${
                activeTab === 'refactors' 
                  ? 'border-accent-amber text-text-light' 
                  : 'border-transparent text-gray-500 hover:text-text-light'
              }`}
            >
              Refactors
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider border-b-2 ${
                activeTab === 'analysis' 
                  ? 'border-accent-amber text-text-light' 
                  : 'border-transparent text-gray-500 hover:text-text-light'
              }`}
            >
              Analysis
            </button>
          </div>

          {/* Command bar button */}
          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-border-dark font-mono text-xs text-gray-400 hover:text-text-light hover:border-gray-500 transition-colors"
          >
            <Command className="w-4 h-4" />
            <span>⌘K</span>
          </button>
        </div>
      </header>

      {/* Main Content - Resizable Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Session Sidebar - Resizable */}
        <div style={{ width: sidebarWidth, minWidth: MIN_SIDEBAR, maxWidth: MAX_SIDEBAR }} className="flex-shrink-0">
          <aside className="h-full border-r border-border-dark bg-[#080808]">
            <SessionSidebar
              sessions={sessions}
              currentSession={currentSession}
              onLoadSession={handleLoadSession}
              onClearAll={clearAllSessions}
            />
          </aside>
        </div>
        
        <ResizeHandle 
          direction="horizontal" 
          onResize={(delta) => {
            const newWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, sidebarWidth + delta));
            setSidebarWidth(newWidth);
          }} 
        />

        {/* Left Column - Code Input & Debt Dashboard - Resizable */}
        <div style={{ width: leftPanelWidth, minWidth: MIN_LEFT_PANEL, maxWidth: MAX_LEFT_PANEL }} className="flex-shrink-0 flex flex-col border-r border-border-dark">
          {/* Code Input - Resizable height */}
          <div style={{ height: codeInputHeight, minHeight: MIN_CODE_INPUT, maxHeight: MAX_CODE_INPUT }} className="flex-shrink-0 border-b border-border-dark">
            <CodeInput
              onSubmit={handleSubmit}
              code={code}
              setCode={setCode}
            />
          </div>
          
          <ResizeHandle 
            direction="vertical" 
            onResize={(delta) => {
              const newHeight = Math.max(MIN_CODE_INPUT, Math.min(MAX_CODE_INPUT, codeInputHeight + delta));
              setCodeInputHeight(newHeight);
            }} 
          />

          {/* Debt Dashboard */}
          <div className="flex-1 overflow-hidden">
            <DebtDashboard debtData={debtData} />
          </div>
        </div>
        
        <ResizeHandle 
          direction="horizontal" 
          onResize={(delta) => {
            const newWidth = Math.max(MIN_LEFT_PANEL, Math.min(MAX_LEFT_PANEL, leftPanelWidth - delta));
            setLeftPanelWidth(newWidth);
          }} 
        />

        {/* Right Column - Analysis Panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'arch' && <ArchitectureMap archData={archData} />}
            {activeTab === 'docs' && <DocPreview docsData={docsData} />}
            {activeTab === 'refactors' && <DiffViewer refactors={refactorData?.refactors} />}
            {(activeTab === 'debt' || activeTab === 'analysis') && (
              <AnalysisPanel 
                analysisText={streamText} 
                isStreaming={isStreaming} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-900 border border-red-700 font-mono text-xs text-red-300">
          Error: {error}
          <button onClick={() => window.location.reload()} className="ml-4 underline">
            Retry
          </button>
        </div>
      )}

      {/* Command Bar */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onCommand={handleCommand}
      />
    </div>
  );
}

export default App;