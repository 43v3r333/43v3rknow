import { Clock, Trash2, GitBranch, FileText, Upload } from 'lucide-react';

export function SessionSidebar({ sessions, currentSession, onLoadSession, onClearAll }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source) => {
    if (source?.includes('github.com') || source?.includes('/')) {
      return <GitBranch className="w-3 h-3" />;
    }
    return <FileText className="w-3 h-3" />;
  };

  const getScoreClass = (score) => {
    if (score >= 60) return 'text-accent-amber';
    if (score >= 30) return 'text-text-light';
    return 'text-green-400';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border-dark">
        <h2 className="font-mono text-xs text-gray-500 uppercase tracking-widest">
          History
        </h2>
      </div>

      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <Clock className="w-8 h-8 mb-3 opacity-50" />
            <p className="font-mono text-xs text-center">
              No past sessions
            </p>
          </div>
        ) : (
          <div className="py-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onLoadSession(session.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${
                  currentSession?.id === session.id
                    ? 'bg-accent-amber/10 border-l-2 border-accent-amber'
                    : 'hover:bg-[#1a1a1a] border-l-2 border-transparent'
                }`}
              >
                <div className="mt-0.5 text-gray-500">
                  {getSourceIcon(session.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-text-light truncate">
                    {session.source || 'Untitled'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-xs text-gray-500">
                      {formatTime(session.timestamp)}
                    </span>
                    {session.debtScore !== undefined && session.debtScore !== null && (
                      <span className={`font-mono text-xs font-bold ${getScoreClass(session.debtScore)}`}>
                        {session.debtScore}
                      </span>
                    )}
                  </div>
                  {session.language && (
                    <span className="inline-block mt-1 font-mono text-xs px-1.5 py-0.5 bg-gray-800 text-gray-400">
                      {session.language}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="border-t border-border-dark p-3">
          <button
            onClick={onClearAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 font-mono text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}