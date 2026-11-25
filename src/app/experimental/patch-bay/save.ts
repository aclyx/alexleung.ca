import {
  decodeBytes,
  encodeBytes,
  newProgress,
  readProgress,
  type Board,
  type Progress,
} from "./campaign";

// Five three-state levels fit in one byte: unknown, accessible, or cleared.
function checksum(bytes: Uint8Array) {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let bit = 0; bit < 8; bit++)
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc;
}
export function saveCode(p: Progress, count: number, full: boolean) {
  const known = new Set(p.known),
    last = Math.max(...known),
    data = [count, p.current, last, Number(full)];
  for (let n = 1; n <= last; n += 5) {
    let group = 0;
    for (let j = 0; j < 5; j++)
      group +=
        (p.best[n + j] !== undefined ? 2 : known.has(n + j) ? 1 : 0) * 3 ** j;
    data.push(group);
  }
  if (full)
    for (let n = 1; n <= last; n++) {
      if (p.best[n] === undefined) continue;
      let ticks = (p.best[n] ?? -1) + 1;
      while (ticks >= 128) {
        data.push((ticks % 128) | 128);
        ticks = Math.floor(ticks / 128);
      }
      data.push(ticks);
    }
  const crc = checksum(Uint8Array.from(data));
  data.push(crc >> 8, crc & 255);
  return (
    "PB1." +
    encodeBytes(Uint8Array.from(data))
      .replace(/=+$/, "")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
  );
}
export function restoreCode(raw: string, boards: Board[]) {
  const code = raw.trim();
  if (!/^PB1\.[A-Za-z0-9_-]{10,2048}$/.test(code))
    throw Error("Invalid save code.");
  const bytes = decodeBytes(
    code.slice(4).replaceAll("-", "+").replaceAll("_", "/")
  );
  const body = bytes.subarray(0, -2),
    [count, current, last, full] = body;
  if (
    count !== boards.length ||
    last < 1 ||
    last > count ||
    full > 1 ||
    checksum(body) !== bytes.at(-2)! * 256 + bytes.at(-1)!
  )
    throw Error("Invalid campaign or checksum.");
  const p = newProgress();
  p.current = current;
  p.known = [];
  let offset = 4;
  for (let n = 1; n <= last; n += 5) {
    let group = body[offset++];
    if (group === undefined || group >= 243) throw Error("Invalid level list.");
    for (let j = 0; j < 5; j++) {
      const state = group % 3;
      group = Math.floor(group / 3);
      if (!state) continue;
      if (n + j > last) throw Error("Invalid level number.");
      p.known.push(n + j);
      if (state === 2) p.best[n + j] = null;
    }
  }
  if (full)
    for (const n of p.known) {
      if (p.best[n] === undefined) continue;
      let value = 0,
        factor = 1,
        b: number;
      do {
        if (offset >= body.length || factor > 2 ** 49)
          throw Error("Invalid best time.");
        b = body[offset++];
        value += (b & 127) * factor;
        factor *= 128;
      } while (b & 128);
      p.best[n] = value === 0 ? null : value - 1;
    }
  if (offset !== body.length) throw Error("Unexpected save data.");
  return readProgress(JSON.stringify(p), boards);
}
