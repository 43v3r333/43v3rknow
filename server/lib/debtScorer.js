// Simple heuristic pre-scorer for quick feedback before AI analysis
export function calculateDebtScore(code) {
  let score = 0;
  const lines = code.split('\n');
  const lineCount = lines.length;
  
  // Initialize category scores
  const categories = {
    security: 0,
    performance: 0,
    maintainability: 0,
    reliability: 0,
    style: 0
  };

  // Security issues
  if (/eval\s*\(/.test(code)) categories.security += 15;
  if (/innerHTML\s*=/.test(code)) categories.security += 10;
  if (/document\.write/.test(code)) categories.security += 10;
  if (/password\s*=/i.test(code) && !/prompt|getElementById/.test(code)) categories.security += 8;
  if (/api[_-]?key\s*=\s*['"`]/i.test(code)) categories.security += 12;
  if (/hardcoded|HARDCODED/i.test(code)) categories.security += 5;

  // Performance issues
  if (/for\s*\(\s*(?!let|const|var)/.test(code)) categories.performance += 5;
  if (/\.innerHTML\s*(?!=.*\+=)/.test(code)) categories.performance += 5;
  if (/new\s+Array\(/.test(code)) categories.performance += 3;
  if (/string\s*\+\s*(?!=)/.test(code) && lineCount > 100) categories.performance += 8;

  // Maintainability issues
  const longFunctions = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]{300,}\}/g) || [];
  categories.maintainability += Math.min(longFunctions.length * 10, 30);
  
  const nestedIfs = (code.match(/if\s*\([^)]+\)\s*\{[^}*]*if\s*\(/g) || []).length;
  categories.maintainability += Math.min(nestedIfs * 5, 20);

  if (/TODO|FIXME|HACK|XXX/.test(code)) categories.maintainability += 3;
  if (/catch\s*\(\s*\w*\s*\)/.test(code) && !/catch\s*\([^)]+\)\s*\{[^}]*console/.test(code)) {
    categories.maintainability += 5;
  }

  // Reliability issues
  if (/undefined/.test(code)) categories.reliability += 5;
  if (/null/.test(code)) categories.reliability += 2;
  if (/try\s*\{[^}]*\}\s*catch/.test(code) && !/catch[^}]*error/.test(code)) {
    categories.reliability += 3;
  }
  if (/async\s+function/.test(code) && !/await/.test(code)) categories.reliability += 5;

  // Style issues
  const tabLines = code.split('\n').filter(l => l.startsWith('\t')).length;
  const spaceLines = code.split('\n').filter(l => l.match(/^ {2,}/)).length;
  if (tabLines > 10 && spaceLines > 10) categories.style += 10;
  
  if (!/const|let|var/.test(code) && lineCount > 50) categories.style += 8;
  if (!/return/.test(code) && /function/.test(code)) categories.style += 5;

  // Calculate total score with penalties for size
  let total = Object.values(categories).reduce((a, b) => a + b, 0);
  
  // Normalize to 0-100
  score = Math.min(Math.round(total), 100);
  
  return { score, categories };
}

export function formatDebtFindings(debtScore, categories) {
  const findings = [];
  let id = 1;
  
  if (debtScore >= 60) {
    findings.push({
      id: `D${String(id++).padStart(3, '0')}`,
      severity: 'critical',
      category: 'maintainability',
      title: 'High technical debt detected',
      description: `The codebase shows significant technical debt that should be addressed. Consider running a full AI analysis for detailed findings.`,
      location: 'Multiple locations',
      impact: 'Increased maintenance cost and reduced code quality',
      fix: 'Run full debt audit with /debt command'
    });
  }
  
  if (categories.security > 15) {
    findings.push({
      id: `D${String(id++).padStart(3, '0')}`,
      severity: 'moderate',
      category: 'security',
      title: 'Potential security concerns',
      description: 'Code contains patterns that may indicate security issues. Review carefully.',
      location: 'Various',
      impact: 'Potential security vulnerabilities',
      fix: 'Run focused audit with /focus security'
    });
  }
  
  if (categories.maintainability > 20) {
    findings.push({
      id: `D${String(id++).padStart(3, '0')}`,
      severity: 'moderate',
      category: 'maintainability',
      title: 'Complex code structures detected',
      description: 'Long functions or deep nesting detected. Consider refactoring for clarity.',
      location: 'Various functions',
      impact: 'Harder to maintain and understand',
      fix: 'Run refactor analysis with /refactor'
    });
  }

  return { debt_score: debtScore, score_rationale: 'Pre-analysis based on code patterns', findings, summary: 'Quick scan complete. Full AI analysis recommended.' };
}