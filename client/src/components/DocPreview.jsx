import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function DocPreview({ docsData }) {
  const [copiedSection, setCopiedSection] = useState(null);

  if (!docsData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
        No documentation yet
      </div>
    );
  }

  const { file_summary = '', functions = [], readme_section = '' } = docsData;

  const handleCopy = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="space-y-6 p-4">
        {/* File Summary */}
        {file_summary && (
          <section className="border border-border-dark">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-border-dark">
              <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                Overview
              </span>
              <button
                onClick={() => handleCopy(file_summary, 'summary')}
                className="p-1 text-gray-500 hover:text-text-light"
              >
                {copiedSection === 'summary' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="p-4">
              <p className="font-serif text-sm text-text-light leading-relaxed">
                {file_summary}
              </p>
            </div>
          </section>
        )}

        {/* Functions */}
        {functions && functions.length > 0 && (
          <section>
            <h3 className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3">
              Functions ({functions.length})
            </h3>
            
            <div className="space-y-4">
              {functions.map((func, idx) => (
                <div key={idx} className="border border-border-dark">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-border-dark">
                    <div>
                      <h4 className="font-mono text-sm text-text-light font-medium">
                        {func.name}
                      </h4>
                      {func.signature && (
                        <p className="font-mono text-xs text-gray-500 mt-1">
                          {func.signature}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(func.docblock || '', `func-${idx}`)}
                      className="p-1 text-gray-500 hover:text-text-light"
                    >
                      {copiedSection === `func-${idx}` ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {func.description && (
                      <p className="font-serif text-sm text-gray-300">
                        {func.description}
                      </p>
                    )}

                    {/* Parameters */}
                    {func.params && func.params.length > 0 && (
                      <div>
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                          Parameters
                        </span>
                        <div className="mt-2 space-y-1">
                          {func.params.map((param, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2">
                              <code className="font-mono text-xs text-accent-amber">
                                {param.name}
                              </code>
                              {param.type && (
                                <span className="font-mono text-xs text-gray-500">
                                  : {param.type}
                                </span>
                              )}
                              {param.description && (
                                <span className="font-mono text-xs text-gray-400">
                                  — {param.description}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Returns */}
                    {func.returns && (
                      <div>
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                          Returns
                        </span>
                        <div className="mt-1">
                          {func.returns.type && (
                            <code className="font-mono text-xs text-accent-amber">
                              {func.returns.type}
                            </code>
                          )}
                          {func.returns.description && (
                            <span className="font-mono text-xs text-gray-400 ml-2">
                              — {func.returns.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Example */}
                    {func.example && (
                      <div>
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                          Example
                        </span>
                        <pre className="mt-2 p-3 bg-[#111] border border-border-dark font-mono text-xs text-gray-300 overflow-x-auto">
                          {func.example}
                        </pre>
                      </div>
                    )}

                    {/* Docblock */}
                    {func.docblock && (
                      <div>
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                          Docblock
                        </span>
                        <pre className="mt-2 p-3 bg-[#111] border border-border-dark font-mono text-xs text-gray-300 whitespace-pre-wrap">
                          {func.docblock}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* README Section */}
        {readme_section && (
          <section className="border border-border-dark">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-border-dark">
              <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                README Section
              </span>
              <button
                onClick={() => handleCopy(readme_section, 'readme')}
                className="p-1 text-gray-500 hover:text-text-light"
              >
                {copiedSection === 'readme' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="p-4">
              <pre className="font-serif text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {readme_section}
              </pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}