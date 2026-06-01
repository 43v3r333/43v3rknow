import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'codebase_sessions';

export function useSession() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  const saveSession = useCallback((sessionData) => {
    const session = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: sessionData.source || 'Untitled',
      language: sessionData.language || 'unknown',
      debtScore: sessionData.debtScore,
      summary: sessionData.summary || '',
      results: sessionData.results,
      code: sessionData.code,
      mode: sessionData.mode
    };

    setSessions(prev => [session, ...prev].slice(0, 50)); // Keep last 50 sessions
    setCurrentSession(session);
    
    return session;
  }, []);

  const loadSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      return session;
    }
    return null;
  }, [sessions]);

  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [currentSession]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSession(null);
  }, []);

  const resetCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    resetCurrentSession
  };
}