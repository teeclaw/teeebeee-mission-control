type Session = {
  wallet: string;
  expiresAt: number;
};

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 1000 * 60 * 20;

export function createChairmanSession(wallet: string) {
  const token = crypto.randomUUID();
  sessions.set(token, {
    wallet: wallet.toLowerCase(),
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return token;
}

export function readChairmanSession(token: string | null | undefined) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return s;
}
