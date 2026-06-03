import express from 'express';
import { streamClaudeResponse } from '../lib/claudeClient.js';

const router = express.Router();

const SYSTEM_PROMPTS = {
  explain: `You are a code analysis tool. Return ONLY raw JSON - no markdown, no code fences, no backticks, no explanation. Your response must start with "{" and be valid JSON.`,

  debt: `You are a code analysis tool. Return ONLY raw JSON - no markdown, no code fences, no backticks, no explanation. Your response must start with "{" and be valid JSON.`,

  docs: `You are a code analysis tool. Return ONLY raw JSON - no markdown, no code fences, no backticks, no explanation. Your response must start with "{" and be valid JSON.`,

  refactor: `You are a code analysis tool. Return ONLY raw JSON - no markdown, no code fences, no backticks, no explanation. Your response must start with "{" and be valid JSON.`,

  map: `You are a code analysis tool. Return ONLY raw JSON - no markdown, no code fences, no backticks, no explanation. Your response must start with "{" and be valid JSON.`
};

const USER_PROMPTS = {
  explain: (code, language) => `Explain the following ${language || 'code'} in detail. Return ONLY valid JSON starting with "{" and ending with "}". No markdown, no text before or after JSON.

Output this exact JSON structure (fill in the values):
{
  "summary": "one sentence summary",
  "purpose": "what this does",
  "how_it_works": ["step1", "step2"],
  "key_concepts": [{"term": "x", "explanation": "y"}],
  "dependencies": ["import1", "import2"],
  "entry_points": ["main1", "main2"],
  "warnings": ["warn1"]
}

CODE:
${code}`,

  debt: (code, language) => `Analyze this ${language || 'code'} for technical debt. Return ONLY valid JSON starting with "{" and ending with "}". No markdown, no text.

Output this exact structure:
{
  "debt_score": 0,
  "findings": [
    {
      "id": "D001",
      "severity": "critical|moderate|low",
      "category": "security|performance|maintainability|reliability|style",
      "title": "short title",
      "description": "one sentence description",
      "location": "where",
      "impact": "why it matters",
      "fix": "how to fix"
    }
  ],
  "summary": "overall assessment"
}

debt_score: 0=perfect, 100=terrible. Include 3-5 key findings.

CODE:
${code}`,

  docs: (code, language) => `Document this ${language || 'code'}. Return ONLY valid JSON starting with "{" and ending with "}". No markdown, no text.

Output this exact structure:
{
  "file_summary": "what this file does",
  "functions": [
    {
      "name": "functionName",
      "signature": "params and return type",
      "description": "what it does",
      "params": [{"name": "x", "type": "string", "description": "param desc"}],
      "returns": {"type": "void", "description": "return desc"},
      "docblock": "complete JSDoc ready to use"
    }
  ]
}

CODE:
${code}`,

  refactor: (code, language) => `Suggest refactors for this ${language || 'code'}. Return ONLY valid JSON starting with "{" and ending with "}". No markdown, no text.

Output this exact structure:
{
  "summary": "overall assessment",
  "refactors": [
    {
      "id": "R001",
      "title": "short title",
      "before": "code before",
      "after": "code after",
      "impact": "why this helps"
    }
  ]
}

CODE:
${code}`,

  map: (code, language) => `Map the architecture of this ${language || 'code'}. Return ONLY valid JSON starting with "{" and ending with "}". No markdown, no text.

Output this exact structure:
{
  "modules": [
    {
      "name": "ModuleName",
      "type": "component|service|utility|model",
      "exports": ["export1", "export2"],
      "imports": ["import1", "import2"]
    }
  ],
  "entry_points": ["main modules"],
  "issues": ["architecture issues if any"]
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

    // Send the complete parsed JSON as a structured event at the end
    let finalJson = null;
    try {
      // Try to extract and parse the JSON from the response
      let cleaned = fullText.trim();
      
      // Remove any leading/trailing markdown code blocks
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      
      finalJson = JSON.parse(cleaned.trim());
    } catch (e) {
      console.error('Failed to parse final JSON:', e);
      // Send partial data even if JSON parsing fails
      res.write(`data: ${JSON.stringify({ error: 'JSON parse failed', partial: fullText.slice(-500) })}\n\n`);
    }

    // Send the complete structured result
    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      mode: mode,
      data: finalJson
    })}\n\n`);
    
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