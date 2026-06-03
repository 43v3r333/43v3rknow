import express from 'express';
import { streamClaudeResponse } from '../lib/claudeClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { mode, code, language } = req.body;

    if (!code || !mode) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders();

    let prompt = '';
    
    if (mode === 'debt') {
      prompt = 'Analyze code for technical debt. Return ONLY this JSON format with NO extra text:\n{"debt_score":0,"findings":[{"severity":"low","title":"x","fix":"y"}],"summary":"z"}\nScore 0-100. Code to analyze:\n' + code;
    } else if (mode === 'explain') {
      prompt = 'Explain code. Return ONLY this JSON format with NO extra text:\n{"summary":"x","purpose":"y"}\nCode:\n' + code;
    } else if (mode === 'docs') {
      prompt = 'Document code. Return ONLY this JSON format with NO extra text:\n{"file_summary":"x","functions":[{"name":"n","description":"d"}]}\nCode:\n' + code;
    } else if (mode === 'refactor') {
      prompt = 'Refactor code. Return ONLY this JSON format with NO extra text:\n{"summary":"x","refactors":[{"title":"y","before":"a","after":"b"}]}\nCode:\n' + code;
    } else if (mode === 'map') {
      prompt = 'Map architecture. Return ONLY this JSON format with NO extra text:\n{"modules":[{"name":"x","type":"y"}]}\nCode:\n' + code;
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const stream = await streamClaudeResponse({
      systemPrompt: 'Output JSON only. No markdown. No explanation. Start with { and end with }.',
      userMessage: prompt,
      maxTokens: 4096
    });

    let fullText = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        fullText += chunk.delta.text;
        res.write('data: ' + JSON.stringify({ text: chunk.delta.text, full: fullText }) + '\n\n');
      }
    }

    // Extract and send final JSON
    let finalJson = null;
    try {
      // Remove all non-JSON characters
      let cleaned = fullText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .replace(/`/g, '')
        .trim();
      
      // Find JSON object
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
        finalJson = JSON.parse(cleaned);
      }
    } catch (e) {
      console.error('JSON parse error:', e.message);
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