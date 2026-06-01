import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AnalysisPanel({ analysisText, isStreaming, onExplain }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedText(analysisText);
  }, [analysisText]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const formatJson = (text) => {
    try {
      // Try to extract JSON from the text
      let cleaned = text.trim();
      
      // Remove markdown code blocks
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      
      // Try to parse as JSON for formatting
      const json = JSON.parse(cleaned.trim());
      return JSON.stringify(json, null, 2);
    } catch {
      return text;
    }
  };

  if (!displayedText && !isStreaming) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
        Run an analysis to see results
      </div>
    );
  }

  const formattedText = formatJson(displayedText);
  const isJson = formattedText !== displayedText;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border-dark bg-[#0a0a0a]">
          <Loader2 className="w-4 h-4 text-accent-amber animate-spin" />
          <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
            Analysing
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${
          isJson ? 'text-accent-amber' : 'text-text-light'
        }`}>
          {displayedText}
          {isStreaming && showCursor && (
            <span className="text-accent-amber">▊</span>
          )}
        </pre>
      </div>

      {/* Actions */}
      {displayedText && !isStreaming && (
        <div className="border-t border-border-dark p-4 flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(formattedText)}
            className="px-3 py-2 bg-[#1a1a1a] border border-border-dark font-mono text-xs text-gray-400 hover:text-text-light hover:border-gray-500 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}