import express from 'express';
import { streamClaudeResponse } from '../lib/claudeClient.js';

const router = express.Router();

const SYSTEM_PROMPTS = {
  explain: `Return ONLY valid JSON. No markdown. No text. Start with { and end with }.`,
  debt: `Return ONLY valid JSON. No markdown. No text. Start with { and end with }.`,
  docs: `Return ONLY valid JSON. No markdown. No text. Start with { and end with }.`,
  refactor: `Return ONLY valid JSON. No markdown. No text. Start with { and end with }.`,
  map: `Return ONLY valid JSON. No markdown. No text. Start with { and end with }.`
};

const USER_PROMPTS = {
  explain: (code, language) => `Analyze this ${language || 'code'}. Output ONLY this JSON, nothing else:

{"summary":"brief summary","purpose":"what it does","steps":["step1","step2"],"concepts":[["term","explanation"]],"deps":["import1"],"exports":["export1"]}

CODE:
${code}`,

  debt: (code, language) => `Audit this ${language || 'code'} for debt. Output ONLY this JSON, nothing else:

{"debt_score":50,"findings":[{"id":"D001","severity":"moderate","category":"maintainability","title":"short title","description":"desc","location":"loc","impact":"impact","fix":"fix"}],"summary":"summary"}

CODE:
${code}`,

  docs: (code, language) => `Document this ${language || 'code'}. Output ONLY this JSON, nothing else:

{"file_summary":"summary","functions":[{"name":"name","signature":"sig","description":"desc","params":[["name","type","desc"]],"returns":["type","desc"]}]}

CODE:
${code}`,

  refactor: (code, language) => `Refactor this ${language || 'code'}. Output ONLY this JSON, nothing else:

{"summary":"summary","refactors":[{"id":"R001","title":"title","before":"code","after":"code","impact":"impact"}]}

CODE:
${code}`,

  map: (code, language) => `Map this ${language || 'code'} architecture. Output ONLY this JSON, nothing else:

{"modules":[{"name":"name","type":"type","exports":["x"],"imports":["y"]}],"entry_points":["x"],"issues":[]}

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

    let finalJson = null;
    let parseError = null;

    try {
      let cleaned = fullText.trim();
      cleaned = cleaned.replace(/```json\s*/gi, '');
      cleaned = cleaned.replace(/```\s*/gi, '');
      cleaned = cleaned.replace(/`+/g, '');
      cleaned = cleaned.trim();

      try {
        finalJson = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            finalJson = JSON.parse(match[0]);
          } catch {
            let fixed = match[0]
              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
              .replace(/:\s*'([^']*)'/g, ':"$1"')
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']');
            finalJson = JSON.parse(fixed);
          } catch {
            parseError = 'Could not parse JSON';
          }
        }
      }

      if (finalJson && mode === 'debt') {
        if (typeof finalJson.debt_score !== 'number') {
          finalJson.debt_score = 50;
        }
        if (!Array.isArray(finalJson.findings)) {
          finalJson.findings = [];
        }
        finalJson.findings = finalJson.findings.slice(0, 10).map((f, i) => ({
          id: f.id || 'D' + String(i + 1).padStart(3, '0'),
          severity: ['critical', 'moderate', 'low'].includes(f.severity) ? f.severity : 'moderate',
          category: f.category || 'maintainability',
          title: String(f.title || 'Issue ' + (i + 1)).substring(0, 100),
          description: String(f.description || '').substring(0, 500),
          location: String(f.location || '').substring(0, 100),
          impact: String(f.impact || '').substring(0, 200),
          fix: String(f.fix || '').substring(0, 200)
        }));
      }
    } catch (e) {
      parseError = e.message;
    }

    if (finalJson) {
      res.write(`data: ${JSON.stringify({ type: 'complete', mode: mode, data: finalJson })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'complete', mode: mode, data: null, error: parseError })}\n\n`);
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