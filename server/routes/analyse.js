import express from 'express';
import { streamClaudeResponse } from '../lib/claudeClient.js';

const router = express.Router();

const SYSTEM_PROMPTS = {
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

const USER_PROMPTS = {
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

router.post('/', async (req, res) => {
  try {
    const { mode, code, language, context } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (!mode || !USER_PROMPTS[mode]) {
      return res.status(400).json({ error: 'Invalid mode. Use: explain, debt, docs, refactor, map' });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode];
    const userMessage = USER_PROMPTS[mode](code, language);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await streamClaudeResponse({
      systemPrompt,
      userMessage,
      maxTokens: 4096
    });

    let fullText = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        fullText += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text, full: fullText })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Analysis error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed', message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

export default router;