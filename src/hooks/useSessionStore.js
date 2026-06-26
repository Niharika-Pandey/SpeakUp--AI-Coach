const STORAGE_KEY = 'speakup_sessions';

export function getSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSession(session) {
  const sessions = getSessions();
  const newSession = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ...session,
  };
  sessions.unshift(newSession); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return newSession;
}

export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useSessionStore() {
  return { getSessions, addSession, clearSessions };
}
