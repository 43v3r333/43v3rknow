import express from 'express';

const router = express.Router();

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';

const SUPPORTED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', 
  '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.html', '.css',
  '.json', '.yaml', '.yml', '.md', '.txt'
];

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 
                   '__pycache__', '.next', '.nuxt', 'vendor', 'venv'];

function isCodeFile(path) {
  return SUPPORTED_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
}

function shouldSkipPath(path) {
  return SKIP_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`));
}

// GET /api/github/tree?repo=owner/repo
router.get('/tree', async (req, res) => {
  const { repo } = req.query;
  
  if (!repo) {
    return res.status(400).json({ error: 'Repo parameter required (owner/repo)' });
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Codebase-App'
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/git/trees/HEAD?recursive=1`, {
      headers
    });

    if (response.status === 403) {
      return res.status(403).json({
        error: 'GitHub rate limit hit',
        message: 'Add GITHUB_TOKEN to Replit Secrets for higher rate limits'
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch repo',
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    const files = (data.tree || [])
      .filter(item => item.type === 'blob' && isCodeFile(item.path) && !shouldSkipPath(item.path))
      .map(item => ({
        path: item.path,
        size: item.size,
        sha: item.sha
      }));

    res.json({ files, repo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repository', message: error.message });
  }
});

// GET /api/github/content?repo=owner/repo&path=file/path
router.get('/content', async (req, res) => {
  const { repo, path } = req.query;
  
  if (!repo || !path) {
    return res.status(400).json({ error: 'Repo and path parameters required' });
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Codebase-App'
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
      headers
    });

    if (response.status === 403) {
      return res.status(403).json({
        error: 'GitHub rate limit hit',
        message: 'Add GITHUB_TOKEN to Replit Secrets for higher rate limits'
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch file',
        message: response.statusText 
      });
    }

    const data = await response.json();
    
    // Decode base64 content if needed
    let content = data.content || '';
    if (data.encoding === 'base64') {
      content = atob(content.replace(/\n/g, ''));
    }

    res.json({ content, path, encoding: data.encoding });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file', message: error.message });
  }
});

// GET /api/github/raw?repo=owner/repo&path=file/path
router.get('/raw', async (req, res) => {
  const { repo, path } = req.query;
  
  if (!repo || !path) {
    return res.status(400).json({ error: 'Repo and path parameters required' });
  }

  try {
    const response = await fetch(`${GITHUB_RAW}/${repo}/HEAD/${path}`);

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Failed to fetch raw file',
        message: response.statusText 
      });
    }

    const content = await response.text();
    res.json({ content, path });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch raw file', message: error.message });
  }
});

export default router;