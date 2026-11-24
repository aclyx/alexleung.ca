import { isDifficulty, type Difficulty } from "./world";

export type Progress = {
  difficulty: Difficulty;
  current: number;
  frontier: number;
  tutorial: number;
  skipped: number[];
};
export const newProgress = (difficulty: Difficulty): Progress => ({
  difficulty,
  current: 0,
  frontier: 11,
  tutorial: 0,
  skipped: [],
});
export function cleared(p: Progress, n: number) {
  if (n === 0) return false;
  return n <= 10
    ? Boolean(p.tutorial & (1 << (n - 1)))
    : n < p.frontier && !p.skipped.includes(n);
}
export function finish(p: Progress): Progress {
  const n = p.current;
  if (n === 0) return { ...p, current: 1 };
  return {
    ...p,
    tutorial: n <= 10 ? p.tutorial | (1 << (n - 1)) : p.tutorial,
    frontier: Math.max(p.frontier, n + 1),
    skipped: p.skipped.filter((i) => i !== n),
  };
}
export function canSkip(p: Progress) {
  return p.current === p.frontier && p.current < 100 && p.skipped.length < 3;
}
export function skip(p: Progress): Progress {
  return canSkip(p)
    ? {
        ...p,
        current: p.current + 1,
        frontier: p.frontier + 1,
        skipped: [...p.skipped, p.current],
      }
    : p;
}
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function check(bytes: number[]) {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = ((crc << 1) ^ (crc & 128 ? 7 : 0)) & 255;
  }
  return crc;
}
export function saveCode(p: Progress) {
  const bytes = [
    p.difficulty,
    p.current,
    p.frontier,
    p.tutorial & 255,
    p.tutorial >> 8,
    ...p.skipped,
  ];
  bytes.push(check(bytes));
  let bits = 0,
    value = 0,
    out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(value >> bits) & 31];
    }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return "CW1-" + out.match(/.{1,4}/g)!.join("-");
}
export function restoreCode(text: string): Progress | null {
  const raw = text.toUpperCase().trim().replaceAll("-", "");
  if (!raw.startsWith("CW1") || raw.length > 18) return null;
  let bits = 0,
    value = 0;
  const bytes: number[] = [];
  for (const c of raw.slice(3)) {
    const n = alphabet.indexOf(c);
    if (n < 0) return null;
    value = (value << 5) | n;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 255);
    }
  }
  if (bytes.length < 6 || bytes.length > 9) return null;
  const checksum = bytes.pop();
  if (check(bytes) !== checksum) return null;
  const [difficulty, current, frontier, lo, hi, ...skipped] = bytes;
  if (
    !isDifficulty(difficulty) ||
    frontier < 11 ||
    frontier > 101 ||
    current > Math.min(100, frontier) ||
    hi > 3 ||
    skipped.some((n) => n < 11 || n >= frontier) ||
    new Set(skipped).size !== skipped.length
  )
    return null;
  const p = {
    difficulty,
    current,
    frontier,
    tutorial: lo + (hi << 8),
    skipped,
  };
  return saveCode(p).replaceAll("-", "") === raw ? p : null;
}
