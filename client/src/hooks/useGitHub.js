import { useState, useCallback } from 'react';

export function useGitHub() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repo, setRepo] = useState(null);

  const parseRepoUrl = useCallback((url) => {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }
    return null;
  }, []);

  const fetchRepoTree = useCallback(async (repoUrl) => {
    setIsLoading(true);
    setError(null);
    setFiles([]);

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Use format: owner/repo or https://github.com/owner/repo');
      setIsLoading(false);
      return;
    }

    const repoPath = `${parsed.owner}/${parsed.repo}`;
    setRepo(repoPath);

    try {
      const response = await fetch(`/api/github/tree?repo=${repoPath}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to fetch repository');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [parseRepoUrl]);

  const fetchFileContent = useCallback(async (filePath) => {
    if (!repo) return null;

    try {
      const response = await fetch(`/api/github/raw?repo=${repo}&path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      console.error('Failed to fetch file content:', err);
      return null;
    }
  }, [repo]);

  const fetchMultipleFiles = useCallback(async (selectedPaths, onProgress) => {
    const contents = {};
    let loaded = 0;

    for (const path of selectedPaths) {
      const content = await fetchFileContent(path);
      if (content) {
        contents[path] = content;
      }
      loaded++;
      if (onProgress) {
        onProgress(loaded, selectedPaths.length);
      }
    }

    return contents;
  }, [fetchFileContent]);

  const reset = useCallback(() => {
    setFiles([]);
    setRepo(null);
    setError(null);
  }, []);

  return {
    files,
    repo,
    isLoading,
    error,
    fetchRepoTree,
    fetchFileContent,
    fetchMultipleFiles,
    reset
  };
}