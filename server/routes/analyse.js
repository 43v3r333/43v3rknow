import express from 'express';
import { streamClaudeResponse } from '../lib/claudeClient.js';

const router = express.Router();

const PROMPTS = {
  debt: 'Return ONLY this JSON: {"debt_score":50,"findings":[{"id":"D001","severity":"moderate","title":"title","description":"desc","fix":"fix"}],"summary":"summary"}',
  explain: 'Return ONLY this JSON: {"summary":"brief","purpose":"what","steps":["s1"],"concepts":[["t","e"]],"deps":["x"],"exports":["y"]}',
  docs: 'Return ONLY this JSON: {"file_summary":"x","functions":[{"name":"n","signature":"s","description":"d","params":[["n","t","d"]]}]}',
  refactor: 'Return ONLY this JSON: {"summary":"x","refactors":[{"id":"R001","title":"t","before":"b","after":"a","impact":"i"}]}',
  map: 'Return ONLY this JSON: {"modules":[{"name":"n","type":"t","exports":["e"],"imports":["i"]}],"entry_points":["x"],"issues":[]}'
};

router.post('/', async (req, res) => {
  try {
    const { mode, code, language } = req.body;

    if (!code || !mode || !PROMPTS[mode]) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    const stream = await streamClaudeResponse({
      systemPrompt: PROMPTS[mode],
      userMessage: 'CODE:\n' + code,
      maxTokens: 4096
    });

    let fullText = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        fullText += chunk.delta.text;
        res.write('data: ' + JSON.stringify({ text: chunk.delta.text, full: fullText }) + '\n\n');
      }
    }

    let finalJson = null;
    try {
      let cleaned = fullText.replace(/```json/gi, '').replace(/```/gi, '').replace(/`/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        finalJson = JSON.parse(match[0]);
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }

    res.write('data: ' + JSON.stringify({ type: 'complete', mode: mode, data: finalJson }) + '\n\n');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.end();
    }
  }
});

export default router;