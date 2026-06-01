import { useState, useEffect, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';
import { COMMANDS } from '../lib/prompts';

export function CommandBar({ isOpen, onClose, onCommand }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredCommands = query.startsWith('/')
    ? COMMANDS.filter(cmd => 
        cmd.shortcut.toLowerCase().includes(query.toLowerCase()) ||
        cmd.label.toLowerCase().includes(query.slice(1).toLowerCase())
      )
    : COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
      return;
    }
  };

  const handleSelect = (cmd) => {
    onCommand(cmd.id);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-xl bg-bg-dark border border-border-dark shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dark">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent font-mono text-sm text-text-light placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-text-light"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-sm text-gray-500">
                No commands found
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    idx === selectedIndex
                      ? 'bg-accent-amber/10 text-text-light'
                      : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-text-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] border border-border-dark">
                      <Command className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-mono text-sm">{cmd.label}</p>
                      <p className="font-mono text-xs text-gray-500 mt-0.5">
                        {cmd.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-600">
                    {cmd.shortcut}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-dark text-gray-500">
          <div className="flex items-center gap-4 font-mono text-xs">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to handle Cmd+K global shortcut
export function useCommandBarShortcut(onOpen) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}