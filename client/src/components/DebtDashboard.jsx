import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';

const CATEGORY_COLORS = {
  security: '#E53935',
  performance: '#FB8C00',
  maintainability: '#E8A020',
  reliability: '#4A90D9',
  style: '#9E9E9E'
};

const CATEGORY_LABELS = {
  security: 'Security',
  performance: 'Performance',
  maintainability: 'Maintainability',
  reliability: 'Reliability',
  style: 'Style'
};

export function DebtDashboard({ debtData, onRefactor }) {
  const [expandedFinding, setExpandedFinding] = useState(null);

  if (!debtData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm">
        No analysis yet
      </div>
    );
  }

  const { debt_score = 0, score_rationale = '', findings = [], summary = '', categories = {} } = debtData;

  const getScoreColor = () => {
    if (debt_score >= 60) return 'text-accent-amber';
    if (debt_score >= 30) return 'text-text-light';
    return 'text-green-400';
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'moderate': return 'bg-amber-500 text-bg-dark';
      case 'low': return 'bg-gray-600 text-text-light';
      default: return 'bg-gray-600 text-text-light';
    }
  };

  const categoryTotal = Object.values(categories).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Debt Score Display */}
      <div className="border-b border-border-dark p-6">
        <div className="flex items-baseline gap-4">
          <span className={`font-mono text-7xl font-bold ${getScoreColor()}`}>
            {debt_score}
          </span>
          <span className="font-mono text-sm text-gray-500 uppercase tracking-widest">
            Debt Score
          </span>
        </div>
        
        {score_rationale && (
          <p className="mt-2 font-serif text-sm text-gray-400 italic">
            {score_rationale}
          </p>
        )}

        {/* Category Breakdown */}
        <div className="mt-4 space-y-2">
          {Object.entries(categories).map(([cat, value]) => {
            const percentage = Math.round((value / categoryTotal) * 100);
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-500 w-28 uppercase tracking-wider">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
                <div className="flex-1 h-1.5 bg-gray-800">
                  <div 
                    className="h-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: CATEGORY_COLORS[cat] || '#555'
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-gray-400 w-8 text-right">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Findings List */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">
          Findings ({findings.length})
        </h3>
        
        {findings.length === 0 ? (
          <p className="font-mono text-sm text-gray-500">
            No specific findings identified
          </p>
        ) : (
          <div className="space-y-2">
            {findings.map((finding) => (
              <div
                key={finding.id}
                className="border border-border-dark bg-[#0a0a0a] transition-colors"
              >
                <div
                  onClick={() => setExpandedFinding(
                    expandedFinding === finding.id ? null : finding.id
                  )}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#111]"
                >
                  <span className={`font-mono text-xs px-2 py-0.5 ${getSeverityClass(finding.severity)}`}>
                    [{finding.severity?.toUpperCase()}]
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-text-light truncate">
                      {finding.title}
                    </p>
                    {finding.location && (
                      <p className="font-mono text-xs text-gray-500 truncate mt-0.5">
                        {finding.location}
                      </p>
                    )}
                  </div>
                  {expandedFinding === finding.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {expandedFinding === finding.id && (
                  <div className="px-4 pb-4 border-t border-border-dark animate-fade-in">
                    <div className="pt-3 space-y-3">
                      {finding.category && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                            Category:
                          </span>
                          <span 
                            className="font-mono text-xs px-2 py-0.5"
                            style={{ 
                              backgroundColor: CATEGORY_COLORS[finding.category] + '30',
                              color: CATEGORY_COLORS[finding.category]
                            }}
                          >
                            {finding.category}
                          </span>
                        </div>
                      )}
                      
                      {finding.description && (
                        <p className="font-serif text-sm text-gray-300">
                          {finding.description}
                        </p>
                      )}
                      
                      {finding.impact && (
                        <div>
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                            Impact:
                          </span>
                          <p className="font-mono text-sm text-gray-400 mt-1">
                            {finding.impact}
                          </p>
                        </div>
                      )}
                      
                      {finding.fix && (
                        <div className="pt-2 border-t border-border-dark">
                          <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                            Fix:
                          </span>
                          <p className="font-mono text-sm text-accent-amber mt-1">
                            {finding.fix}
                          </p>
                        </div>
                      )}

                      {onRefactor && (
                        <button
                          onClick={() => onRefactor(finding)}
                          className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-accent-amber text-accent-amber font-mono text-xs hover:bg-accent-amber/10 transition-colors"
                        >
                          <Wrench className="w-3 h-3" />
                          Fix this →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="border-t border-border-dark p-4">
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
            Summary
          </span>
          <p className="font-serif text-sm text-gray-300 mt-2">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}