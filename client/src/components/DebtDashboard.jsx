import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

function parseDebtData(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  
  try {
    let cleaned = String(raw).trim();
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').replace(/`+/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  
  return { debt_score: 0, findings: [], summary: 'Could not parse response' };
}

export function DebtDashboard({ debtData, onRefactor }) {
  const [expanded, setExpanded] = useState(null);

  const data = useMemo(() => parseDebtData(debtData), [debtData]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="font-mono text-sm text-gray-500">No analysis yet</p>
        </div>
      </div>
    );
  }

  const score = data.debt_score ?? 0;
  const findings = Array.isArray(data.findings) ? data.findings : [];
  const summary = data.summary || '';

  const scoreColor = score >= 70 ? 'text-red-500' : score >= 50 ? 'text-orange-500' : score >= 30 ? 'text-yellow-500' : 'text-green-400';
  const scoreBg = score >= 50 ? 'bg-red-900/30 border-red-700' : 'bg-green-900/30 border-green-700';
  const barColor = score >= 70 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : score >= 30 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex flex-col h-full">
      {/* Score Header */}
      <div className={"p-5 border-b border-[#2a2a2a] " + scoreBg}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-gray-400 uppercase">Debt Score</span>
          <span className={"font-mono text-xs px-2 py-1 " + (score >= 50 ? 'text-red-400' : 'text-green-400')}>
            {score >= 50 ? 'HIGH' : 'OK'}
          </span>
        </div>
        <div className="flex items-end gap-3">
          <span className={"font-mono text-5xl font-bold " + scoreColor}>{score}</span>
          <span className="font-mono text-lg text-gray-500 mb-1">/100</span>
        </div>
        <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={barColor + " h-full transition-all"} style={{ width: score + '%' }} />
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="p-4 border-b border-[#2a2a2a] bg-black/20">
          <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Findings */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0d0d0d] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-sm text-gray-300">Findings</span>
          <span className="font-mono text-xs bg-[#1a1a1a] px-2 py-1 text-gray-400 rounded">{findings.length}</span>
        </div>

        {findings.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
            <p className="font-mono text-sm text-green-500">Clean code!</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {findings.map((f, i) => {
              const sev = f.severity || 'low';
              const colors = { critical: 'border-red-800 bg-red-950/30', moderate: 'border-yellow-800 bg-yellow-950/30', low: 'border-blue-800 bg-blue-950/30' };
              const badges = { critical: 'bg-red-600', moderate: 'bg-yellow-600', low: 'bg-blue-600' };
              const isOpen = expanded === i;

              return (
                <div key={f.id || i} className={"border rounded-lg overflow-hidden " + (colors[sev] || colors.low)}>
                  <div onClick={() => setExpanded(isOpen ? null : i)} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-white/5">
                    <span className={"w-2 h-2 rounded-full " + (badges[sev] || badges.low)} />
                    <span className={"font-mono text-[10px] px-1.5 py-0.5 rounded text-white uppercase " + (badges[sev] || badges.low)}>
                      {sev}
                    </span>
                    <span className="flex-1 font-sans text-sm text-gray-200 truncate">{f.title || f.id}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-black/20">
                      {f.description && <p className="text-sm text-gray-300 mb-3">{f.description}</p>}
                      {f.location && <p className="font-mono text-xs text-gray-500 mb-2">📍 {f.location}</p>}
                      {f.impact && <p className="text-sm text-orange-400 mb-3">⚠️ {f.impact}</p>}
                      {f.fix && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="font-mono text-xs text-green-400 mb-1">Fix:</p>
                          <p className="text-sm text-green-300">{f.fix}</p>
                        </div>
                      )}
                      {onRefactor && (
                        <button onClick={() => onRefactor(f)} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 border border-green-600/40 text-green-400 font-mono text-xs rounded">
                          <Wrench className="w-3 h-3" /> Apply Fix
                        </button>
                      )}
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
