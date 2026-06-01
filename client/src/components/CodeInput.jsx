import { useState, useRef } from 'react';
import { Upload, FileCode, Github, AlertCircle } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import { detectLanguage, estimateTokens } from '../lib/prompts';
import { useGitHub } from '../hooks/useGitHub';

const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', 
  '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.html', '.css', '.json', '.txt'
];

export function CodeInput({ onSubmit, code, setCode }) {
  const [activeTab, setActiveTab] = useState('paste');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const fileInputRef = useRef(null);
  
  const { files, isLoading, error: githubError, fetchRepoTree, reset } = useGitHub();

  const language = detectLanguage(code);
  const charCount = code.length;
  const tokenCount = estimateTokens(code);

  const handleFileUpload = (fileList) => {
    const newFiles = [];
    
    for (const file of fileList) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      if (file.size > 1024 * 1024) continue; // Skip > 1MB files
      
      const reader = new FileReader();
      reader.onload = (e) => {
        newFiles.push({
          name: file.name,
          content: e.target.result,
          size: file.size
        });
        if (newFiles.length === Array.from(fileList).filter(f => 
          ALLOWED_EXTENSIONS.includes('.' + f.name.split('.').pop().toLowerCase())
        ).length) {
          setUploadedFiles(prev => [...prev, ...newFiles]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleGithubFetch = () => {
    if (githubUrl.trim()) {
      fetchRepoTree(githubUrl.trim());
    }
  };

  const toggleFileSelection = (path) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const getConcatenatedCode = () => {
    if (activeTab === 'paste') {
      return code;
    } else if (activeTab === 'upload' && uploadedFiles.length > 0) {
      return uploadedFiles.map(f => `// === ${f.name} ===\n${f.content}`).join('\n\n');
    } else if (activeTab === 'github' && selectedFiles.size > 0) {
      // This would need actual content fetching - for now return placeholder
      return Array.from(selectedFiles).map(p => `// === ${p} ===\n// Content to be fetched`).join('\n\n');
    }
    return code;
  };

  const getSourceName = () => {
    if (activeTab === 'paste') return 'Pasted Code';
    if (activeTab === 'upload') return uploadedFiles.map(f => f.name).join(', ') || 'Uploaded Files';
    if (activeTab === 'github') return githubUrl || 'GitHub Repo';
    return 'Unknown';
  };

  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const isTooLarge = charCount > 100000;

  const renderPrismCode = () => {
    const langClass = `language-${language}`;
    return (
      <pre className={`language-${language} bg-bg-dark p-4 overflow-auto`}>
        <code className={langClass}>{code}</code>
      </pre>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex border-b border-border-dark">
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'paste' 
              ? 'border-accent-amber text-text-light' 
              : 'border-transparent text-gray-500 hover:text-text-light'
          }`}
        >
          Paste
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'upload' 
              ? 'border-accent-amber text-text-light' 
              : 'border-transparent text-gray-500 hover:text-text-light'
          }`}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`px-4 py-3 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'github' 
              ? 'border-accent-amber text-text-light' 
              : 'border-transparent text-gray-500 hover:text-text-light'
          }`}
        >
          GitHub
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'paste' && (
          <div className="flex flex-col h-full">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="code-input flex-1 w-full bg-bg-dark border border-border-dark p-4 text-text-light resize-none focus:border-accent-amber"
              spellCheck="false"
            />
            
            {/* Code Preview */}
            {code && (
              <div className="mt-4 border border-border-dark">
                <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-border-dark">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    Preview
                  </span>
                  <span className={`font-mono text-xs px-2 py-0.5 ${
                    ['javascript', 'typescript', 'python', 'go', 'rust'].includes(language) 
                      ? 'bg-accent-amber text-bg-dark' 
                      : 'bg-gray-700 text-text-light'
                  }`}>
                    {language.toUpperCase()}
                  </span>
                </div>
                <div className="max-h-48 overflow-auto">
                  {renderPrismCode()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col h-full">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-accent-amber bg-accent-amber/5' 
                  : 'border-border-dark hover:border-gray-500'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
              <p className="font-mono text-sm text-gray-400">
                Drop files here or click to upload
              </p>
              <p className="font-mono text-xs text-gray-600 mt-2">
                Supports: {ALLOWED_EXTENSIONS.join(' ')}
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {uploadedFiles.length > 0 && (
              <div className="mt-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    Files ({uploadedFiles.length})
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {(totalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-auto">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#111] border border-border-dark">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-accent-amber" />
                        <span className="font-mono text-sm">{file.name}</span>
                      </div>
                      <span className="font-mono text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setUploadedFiles([])}
                  className="mt-2 font-mono text-xs text-gray-500 hover:text-text-light"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'github' && (
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="owner/repo or https://github.com/owner/repo"
                className="flex-1 bg-bg-dark border border-border-dark px-3 py-2 font-mono text-sm text-text-light focus:border-accent-amber"
              />
              <button
                onClick={handleGithubFetch}
                disabled={isLoading || !githubUrl.trim()}
                className="px-4 py-2 bg-accent-amber text-bg-dark font-mono text-sm font-medium hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Fetch'}
              </button>
            </div>

            {githubError && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="font-mono text-sm text-red-400">{githubError}</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    Files ({files.length})
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    {selectedFiles.size} selected
                  </span>
                </div>
                
                <div className="space-y-1 max-h-64 overflow-auto">
                  {files.slice(0, 100).map((file) => (
                    <label
                      key={file.path}
                      className="flex items-center gap-2 p-2 hover:bg-[#1a1a1a] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="accent-accent-amber"
                      />
                      <FileCode className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm text-gray-300 truncate">
                        {file.path}
                      </span>
                    </label>
                  ))}
                </div>
                
                {files.length > 100 && (
                  <p className="font-mono text-xs text-gray-500 mt-2">
                    Showing first 100 of {files.length} files
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats & Submit */}
      <div className="border-t border-border-dark p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-500">
              {charCount.toLocaleString()} chars
            </span>
            <span className="font-mono text-xs text-gray-500">
              ~{tokenCount.toLocaleString()} tokens
            </span>
            {language !== 'text' && (
              <span className="font-mono text-xs px-2 py-0.5 bg-accent-amber text-bg-dark">
                {language.toUpperCase()}
              </span>
            )}
          </div>
          
          {isTooLarge && (
            <span className="font-mono text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Over 100k chars - consider selecting fewer files
            </span>
          )}
        </div>

        <button
          onClick={() => onSubmit(getConcatenatedCode(), language, getSourceName())}
          disabled={!code.trim() && uploadedFiles.length === 0 && selectedFiles.size === 0}
          className="w-full py-3 bg-accent-amber text-bg-dark font-mono text-sm font-semibold uppercase tracking-wider hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Analyse
        </button>
      </div>
    </div>
  );
}