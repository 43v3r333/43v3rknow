import { useState, useCallback, useRef } from 'react';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const fullTextRef = useRef('');

  const startStream = useCallback(async (mode, code, language, onComplete) => {
    // Clear previous state
    setStreamText('');
    setError(null);
    setIsStreaming(true);
    fullTextRef.current = '';

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, code, language }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              return fullTextRef.current;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                fullTextRef.current += parsed.text;
                setStreamText(fullTextRef.current);
              }
              // Handle the complete structured event from server - pass parsed data directly
              if (parsed.type === 'complete' && parsed.data) {
                if (onComplete) onComplete(parsed.data);
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setIsStreaming(false);
        return null;
      }
      setError(err.message);
      setIsStreaming(false);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  }, []);

  return { isStreaming, streamText, error, startStream, stopStream };
}
