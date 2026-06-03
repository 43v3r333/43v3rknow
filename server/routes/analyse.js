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
      // Clean the raw text
      let cleaned = fullText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/gi, '')
        .replace(/`/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Find JSON boundaries precisely
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
        finalJson = JSON.parse(cleaned);
        
        // Format/validate based on mode
        if (mode === 'debt') {
          finalJson = formatDebtJson(finalJson);
        } else if (mode === 'explain') {
          finalJson = formatExplainJson(finalJson);
        } else if (mode === 'map') {
          finalJson = formatMapJson(finalJson);
        }
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

// JSON formatters to ensure consistent structure
function formatDebtJson(data) {
  return {
    debt_score: Math.min(100, Math.max(0, Number(data.debt_score) || 50)),
    findings: (data.findings || []).slice(0, 10).map((f, i) => ({
      id: f.id || ('D' + String(i + 1).padStart(3, '0')),
      severity: ['critical', 'moderate', 'low'].includes(f.severity) ? f.severity : 'low',
      category: f.category || 'maintainability',
      title: String(f.title || 'Issue ' + (i + 1)).slice(0, 100),
      description: String(f.description || '').slice(0, 500),
      location: String(f.location || '').slice(0, 100),
      impact: String(f.impact || '').slice(0, 200),
      fix: String(f.fix || '').slice(0, 200)
    })),
    summary: String(data.summary || '').slice(0, 500)
  };
}

function formatExplainJson(data) {
  return {
    summary: String(data.summary || '').slice(0, 300),
    purpose: String(data.purpose || '').slice(0, 300),
    steps: Array.isArray(data.steps) ? data.steps.slice(0, 10) : [],
    concepts: Array.isArray(data.concepts) ? data.concepts.slice(0, 10) : [],
    deps: Array.isArray(data.deps) ? data.deps.slice(0, 20) : [],
    exports: Array.isArray(data.exports) ? data.exports.slice(0, 20) : []
  };
}

function formatMapJson(data) {
  return {
    modules: (data.modules || []).slice(0, 50).map(m => ({
      name: String(m.name || '').slice(0, 50),
      type: ['component', 'service', 'utility', 'model', 'config'].includes(m.type) ? m.type : 'other',
      exports: Array.isArray(m.exports) ? m.exports.slice(0, 20) : [],
      imports: Array.isArray(m.imports) ? m.imports.slice(0, 20) : []
    })),
    entry_points: Array.isArray(data.entry_points) ? data.entry_points.slice(0, 10) : [],
    issues: Array.isArray(data.issues) ? data.issues.slice(0, 10) : []
  };
}

export default router;