// Client-side prompt templates (mirrors server-side for reference)

export const SYSTEM_PROMPTS = {
  explain: `You are a senior software engineer and codebase analyst. You help developers understand unfamiliar code, identify technical debt, generate documentation, and suggest refactors. You are precise, structured, and direct. You never pad responses. Every finding has a severity label and a concrete next step.

Always respond in valid JSON matching the schema provided. No markdown fences. No preamble. Return only the JSON object.`,

  debt: `You are a senior software engineer and codebase analyst. You help developers understand unfamiliar code, identify technical debt, generate documentation, and suggest refactors. You are precise, structured, and direct. You never pad responses. Every finding has a severity label and a concrete next step.

Always respond in valid JSON matching the schema provided. No markdown fences. No preamble. Return only the JSON object.`,

  docs: `You are a senior software engineer and codebase analyst. You help developers understand unfamiliar code, identify technical debt, generate documentation, and suggest refactors. You are precise, structured, and direct. You never pad responses. Every finding has a severity label and a concrete next step.

Always respond in valid JSON matching the schema provided. No markdown fences. No preamble. Return only the JSON object.`,

  refactor: `You are a senior software engineer and codebase analyst. You help developers understand unfamiliar code, identify technical debt, generate documentation, and suggest refactors. You are precise, structured, and direct. You never pad responses. Every finding has a severity label and a concrete next step.

Always respond in valid JSON matching the schema provided. No markdown fences. No preamble. Return only the JSON object.`,

  map: `You are a senior software engineer and codebase analyst. You help developers understand unfamiliar code, identify technical debt, generate documentation, and suggest refactors. You are precise, structured, and direct. You never pad responses. Every finding has a severity label and a concrete next step.

Always respond in valid JSON matching the schema provided. No markdown fences. No preamble. Return only the JSON object.`
};

export const USER_PROMPTS = {
  explain: (code, language) => `Explain the following ${language || 'code'} in detail. Respond with JSON:

{
  "summary": "One paragraph plain-English explanation",
  "purpose": "What this code is trying to accomplish",
  "how_it_works": ["Step 1", "Step 2"],
  "key_concepts": [{ "term": "", "explanation": "" }],
  "dependencies": ["detected imports"],
  "entry_points": ["main functions or exports"],
  "warnings": ["ambiguities or unclear areas"]
}

CODE:
${code}`,

  debt: (code, language) => `Perform a technical debt audit on the following ${language || 'code'}. Respond with JSON:

{
  "debt_score": 0,
  "score_rationale": "",
  "findings": [
    {
      "id": "D001",
      "severity": "critical|moderate|low",
      "category": "security|performance|maintainability|reliability|style",
      "title": "",
      "description": "",
      "location": "line X or function Y",
      "impact": "",
      "fix": "Concrete one-sentence action"
    }
  ],
  "summary": "Overall assessment"
}

debt_score is 0–100. 0 = pristine. 100 = catastrophic.

CODE:
${code}`,

  docs: (code, language) => `Generate documentation for the following ${language || 'code'}. Respond with JSON:

{
  "file_summary": "",
  "functions": [
    {
      "name": "",
      "signature": "",
      "description": "",
      "params": [{ "name": "", "type": "", "description": "" }],
      "returns": { "type": "", "description": "" },
      "example": "",
      "docblock": "Full JSDoc or docstring ready to paste"
    }
  ],
  "readme_section": "Markdown-formatted README section for this module"
}

CODE:
${code}`,

  refactor: (code, language) => `Suggest refactors for the following ${language || 'code'}. Respond with JSON:

{
  "summary": "",
  "refactors": [
    {
      "id": "R001",
      "title": "",
      "rationale": "",
      "before": "code string",
      "after": "code string",
      "impact": ""
    }
  ]
}

CODE:
${code}`,

  map: (code, language) => `Analyze the architecture of the following ${language || 'code'} codebase. Respond with JSON:

{
  "modules": [
    {
      "name": "",
      "type": "component|service|utility|model|config|entry",
      "responsibilities": [],
      "exports": [],
      "imports_from": []
    }
  ],
  "data_flows": [{ "from": "", "to": "", "description": "" }],
  "patterns_detected": [],
  "issues": ["Circular dependency between X and Y"],
  "entry_points": []
}

CODE:
${code}`
};

// Command definitions for the command bar
export const COMMANDS = [
  { id: 'explain', label: 'Explain Code', description: 'Explain what the current code does', shortcut: '/explain' },
  { id: 'debt', label: 'Debt Audit', description: 'Run a full technical debt audit', shortcut: '/debt' },
  { id: 'docs', label: 'Generate Docs', description: 'Generate documentation', shortcut: '/docs' },
  { id: 'refactor', label: 'Refactor', description: 'Suggest refactors with diffs', shortcut: '/refactor' },
  { id: 'map', label: 'Architecture Map', description: 'Generate architecture map', shortcut: '/map' },
  { id: 'focus-security', label: 'Focus: Security', description: 'Re-run debt audit focused on security', shortcut: '/focus security' },
  { id: 'focus-performance', label: 'Focus: Performance', description: 'Re-run debt audit focused on performance', shortcut: '/focus performance' },
  { id: 'reset', label: 'Reset Session', description: 'Clear session and start fresh', shortcut: '/reset' },
  { id: 'export', label: 'Export Report', description: 'Download full analysis as markdown', shortcut: '/export' }
];

// Helper to detect language from code
export function detectLanguage(code) {
  if (!code) return 'text';
  
  const patterns = [
    { lang: 'javascript', regex: /const|let|var|function|=>|require\(|module\.exports|import\s+.*\s+from/i },
    { lang: 'typescript', regex: /interface\s+\w+|:\s*(string|number|boolean|any)\b|type\s+\w+\s*=|<\w+>/i },
    { lang: 'python', regex: /def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+.*:/i },
    { lang: 'go', regex: /func\s+\w+|package\s+\w+|import\s+"|\s+\w+\s*:\s*=|:=|go\s+func/i },
    { lang: 'rust', regex: /fn\s+\w+|let\s+mut|impl\s+\w+|use\s+\w+::|pub\s+fn/i },
    { lang: 'java', regex: /public\s+(class|static|void)|private\s+\w+|import\s+java\./i },
    { lang: 'css', regex: /\{[\s\S]*:[^}]+;[ \t]*\}|@media|@import|\.[\w-]+\s*\{/i },
    { lang: 'html', regex: /<[a-z][^>]*>|<\/[a-z]+>|<!DOCTYPE/i },
  ];

  for (const { lang, regex } of patterns) {
    if (regex.test(code)) return lang;
  }
  
  return 'text';
}

// Estimate token count (rough approximation)
export function estimateTokens(code) {
  return Math.ceil(code.length / 4);
}