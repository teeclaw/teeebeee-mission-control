import { recoverMessageAddress } from "viem";

type Challenge = {
  nonce: string;
  message: string;
  issuedAt: number;
};

const challenges = new Map<string, Challenge>();
const CHALLENGE_TTL_MS = 1000 * 60 * 5;

export function buildChallenge(wallet: string, domain: string) {
  const nonce = crypto.randomUUID();
  const issuedAt = new Date().toISOString();
  const message = [
    "Teeebeee Mission Control - Chairman Auth",
    `Domain: ${domain}`,
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join("\n");

  challenges.set(wallet.toLowerCase(), { nonce, message, issuedAt: Date.now() });
  return { nonce, message };
}

export async function verifyChallenge(wallet: string, signature: string) {
  const w = wallet.toLowerCase();
  const challenge = challenges.get(w);
  if (!challenge) return { ok: false as const, error: "No active challenge" };
  if (Date.now() - challenge.issuedAt > CHALLENGE_TTL_MS) {
    challenges.delete(w);
    return { ok: false as const, error: "Challenge expired" };
  }

  try {
    const recovered = await recoverMessageAddress({
      message: challenge.message,
      signature: signature as `0x${string}`
    });
    if (recovered.toLowerCase() !== w) return { ok: false as const, error: "Invalid signature" };
    challenges.delete(w);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Signature verification failed" };
  }
}
