import { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';

export function DiffViewer({ refactors, language = 'javascript' }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!refactors || refactors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
        No refactor suggestions yet
      </div>
    );
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple line-by-line diff
  const computeDiff = (before, after) => {
    const beforeLines = (before || '').split('\n');
    const afterLines = (after || '').split('\n');
    const diff = [];

    const maxLines = Math.max(beforeLines.length, afterLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const beforeLine = beforeLines[i] || '';
      const afterLine = afterLines[i] || '';
      
      if (beforeLine === afterLine) {
        diff.push({ type: 'unchanged', before: beforeLine, after: afterLine, lineNum: i + 1 });
      } else if (beforeLine && !afterLines.includes(beforeLine)) {
        diff.push({ type: 'removed', before: beforeLine, after: '', lineNum: i + 1 });
      }
      if (afterLine && !beforeLines.includes(afterLine)) {
        diff.push({ type: 'added', before: '', after: afterLine, lineNum: i + 1 });
      }
    }

    return diff;
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="space-y-4 p-4">
        {refactors.map((refactor) => {
          const diff = computeDiff(refactor.before, refactor.after);
          
          return (
            <div key={refactor.id} className="border border-border-dark">
              {/* Header */}
              <div className="p-4 border-b border-border-dark bg-[#0a0a0a]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-mono text-sm text-text-light font-medium">
                      {refactor.id}: {refactor.title}
                    </h3>
                    {refactor.rationale && (
                      <p className="font-serif text-sm text-gray-400 mt-1">
                        {refactor.rationale}
                      </p>
                    )}
                  </div>
                  {refactor.impact && (
                    <span className="font-mono text-xs px-2 py-1 bg-[#1a1a1a] border border-border-dark text-gray-400 whitespace-nowrap">
                      {refactor.impact}
                    </span>
                  )}
                </div>
              </div>

              {/* Diff View */}
              <div className="grid grid-cols-2">
                {/* Before */}
                <div className="border-r border-border-dark">
                  <div className="px-3 py-2 bg-red-900/20 border-b border-border-dark">
                    <span className="font-mono text-xs text-red-400 uppercase tracking-wider">
                      Before
                    </span>
                  </div>
                  <div className="p-3 font-mono text-xs overflow-x-auto">
                    {diff.filter(d => d.type !== 'added').map((line, idx) => (
                      <div 
                        key={idx}
                        className={`${
                          line.type === 'removed' 
                            ? 'bg-red-900/30 text-red-300' 
                            : 'text-gray-400'
                        }`}
                      >
                        <span className="select-none text-gray-600 mr-3">{line.lineNum}</span>
                        {line.before || ' '}
                      </div>
                    ))}
                  </div>
                </div>

                {/* After */}
                <div>
                  <div className="px-3 py-2 bg-green-900/20 border-b border-border-dark">
                    <span className="font-mono text-xs text-green-400 uppercase tracking-wider">
                      After
                    </span>
                  </div>
                  <div className="p-3 font-mono text-xs overflow-x-auto">
                    {diff.filter(d => d.type !== 'removed').map((line, idx) => (
                      <div 
                        key={idx}
                        className={`${
                          line.type === 'added' 
                            ? 'bg-green-900/30 text-green-300' 
                            : 'text-gray-400'
                        }`}
                      >
                        <span className="select-none text-gray-600 mr-3">{line.lineNum}</span>
                        {line.after || ' '}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 p-3 border-t border-border-dark bg-[#0a0a0a]">
                <button
                  onClick={() => handleCopy(refactor.after, refactor.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-border-dark font-mono text-xs text-gray-400 hover:text-accent-amber hover:border-accent-amber transition-colors"
                >
                  {copiedId === refactor.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy after ↗
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}