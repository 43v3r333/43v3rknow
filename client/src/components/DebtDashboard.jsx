import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Wrench, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: { color: '#E53935', bg: 'bg-red-600', label: 'CRITICAL' },
  high: { color: '#FB8C00', bg: 'bg-orange-500', label: 'HIGH' },
  moderate: { color: '#E8A020', bg: 'bg-yellow-500', label: 'MODERATE' },
  low: { color: '#4A90D9', bg: 'bg-blue-500', label: 'LOW' },
  info: { color: '#9E9E9E', bg: 'bg-gray-500', label: 'INFO' }
};

function parseRawDebtResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {}
  
  const result = {
    debt_score: 50,
    score_rationale: '',
    findings: [],
    summary: ''
  };

  const scoreMatch = text.match(/debt_score["\s:]+(\d+)/i) || text.match(/score[:\s]+(\d+)/i);
  if (scoreMatch) result.debt_score = parseInt(scoreMatch[1]);

  const findingPattern = /^\d+[\.\)]\s*(.+)/gm;
  let match;
  let id = 1;
  while ((match = findingPattern.exec(text)) !== null) {
    const title = match[1].trim();
    if (title.length > 10 && !title.includes('debt_score')) {
      result.findings.push({
        id: 'D' + String(id++).padStart(3, '0'),
        severity: id <= 2 ? 'critical' : id <= 5 ? 'moderate' : 'low',
        title: title,
        description: '',
        fix: 'Review and refactor this section'
      });
    }
  }

  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length > 1) {
    result.summary = paragraphs[paragraphs.length - 1].trim();
  }

  return result;
}

export function DebtDashboard({ debtData, onRefactor }) {
  const [expandedFinding, setExpandedFinding] = useState(null);

  const data = useMemo(() => {
    if (!debtData) return null;
    if (typeof debtData === 'string') {
      return parseRawDebtResponse(debtData);
    }
    if (debtData.full || debtData.text) {
      return parseRawDebtResponse(debtData.full || debtData.text);
    }
    return debtData;
  }, [debtData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="font-mono text-sm text-gray-500">No analysis yet</p>
          <p className="font-mono text-xs text-gray-600 mt-1">Submit code to start audit</p>
        </div>
      </div>
    );
  }

  const debt_score = data.debt_score ?? 0;
  const findings = data.findings || [];
  const summary = data.summary || data.score_rationale || '';

  const getScoreColor = () => {
    if (debt_score >= 70) return 'text-red-500';
    if (debt_score >= 50) return 'text-orange-500';
    if (debt_score >= 30) return 'text-yellow-500';
    return 'text-green-400';
  };

  const getScoreLabel = () => {
    if (debt_score >= 70) return 'HIGH RISK';
    if (debt_score >= 50) return 'NEEDS ATTENTION';
    if (debt_score >= 30) return 'MODERATE';
    return 'HEALTHY';
  };

  const getSeverityConfig = (sev) => SEVERITY_CONFIG[sev?.toLowerCase()] || SEVERITY_CONFIG.low;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Score */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border-b border-[#222] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-1">Technical Debt Score</p>
            <div className="flex items-baseline gap-3">
              <span className={"font-mono text-5xl font-bold " + getScoreColor()}>
                {debt_score}
              </span>
              <span className={"font-mono text-sm px-2 py-0.5 " + (debt_score >= 50 ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400')}>
                /100
              </span>
            </div>
          </div>
          <div className={"font-mono text-xs px-3 py-1.5 " + (debt_score >= 50 ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-green-600/20 text-green-400 border border-green-600/30')}>
            {getScoreLabel()}
          </div>
        </div>
        
        {/* Score Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={"h-full transition-all " + (debt_score >= 70 ? 'bg-red-500' : debt_score >= 50 ? 'bg-orange-500' : debt_score >= 30 ? 'bg-yellow-500' : 'bg-green-500')}
              style={{ width: debt_score + '%' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-xs text-gray-600">Clean</span>
            <span className="font-mono text-xs text-gray-600">Critical</span>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="border-b border-[#222] p-4 bg-[#0a0a0a]/50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="font-sans text-sm text-gray-300 leading-relaxed">{summary}</p>
          </div>
        </div>
      )}

      {/* Findings Section */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0d0d0d] border-b border-[#222] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="font-mono text-sm text-gray-300">Findings</span>
          </div>
          <span className="font-mono text-xs text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded">
            {findings.length} items
          </span>
        </div>

        {findings.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="font-mono text-sm text-green-500">No issues found</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {findings.map((finding, index) => {
              const sevConfig = getSeverityConfig(finding.severity);
              const isExpanded = expandedFinding === index;
              
              return (
                <div 
                  key={finding.id || index}
                  className="border border-[#2a2a2a] bg-[#0a0a0a] rounded-lg overflow-hidden transition-all hover:border-[#3a3a3a]"
                >
                  <div 
                    onClick={() => setExpandedFinding(isExpanded ? null : index)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className={"w-2 h-2 rounded-full " + sevConfig.bg} />
                    <span className={"font-mono text-[10px] px-1.5 py-0.5 " + sevConfig.bg + " text-white rounded uppercase"}>
                      {sevConfig.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-gray-200 leading-tight">
                        {finding.title || finding}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-[#2a2a2a] bg-[#0f0f0f]">
                      <div className="pt-3 space-y-3">
                        {finding.description && (
                          <div>
                            <p className="font-mono text-xs text-gray-500 uppercase mb-1">Description</p>
                            <p className="font-sans text-sm text-gray-300 leading-relaxed">{finding.description}</p>
                          </div>
                        )}
                        
                        {finding.location && (
                          <div>
                            <p className="font-mono text-xs text-gray-500 uppercase mb-1">Location</p>
                            <p className="font-mono text-xs text-gray-400 bg-[#1a1a1a] px-2 py-1 rounded inline-block">
                              {finding.location}
                            </p>
                          </div>
                        )}

                        {finding.impact && (
                          <div>
                            <p className="font-mono text-xs text-gray-500 uppercase mb-1">Impact</p>
                            <p className="font-sans text-sm text-orange-300">{finding.impact}</p>
                          </div>
                        )}

                        {finding.fix && (
                          <div className="pt-2 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-1">
                              <Wrench className="w-3 h-3 text-green-400" />
                              <p className="font-mono text-xs text-green-400 uppercase">Recommended Fix</p>
                            </div>
                            <p className="font-sans text-sm text-green-300 leading-relaxed">{finding.fix}</p>
                          </div>
                        )}

                        {onRefactor && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onRefactor(finding); }}
                            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 border border-green-600/40 text-green-400 font-mono text-xs rounded hover:bg-green-600/30 transition-colors"
                          >
                            <Wrench className="w-3 h-3" />
                            Apply Fix
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
