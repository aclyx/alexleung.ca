const campaignHash =
  "b0a68f21642447385512e0ed9386a4a13a4f7e9a38f909da772104d8e6b5c1fb";

export interface Board {
  number: number;
  title: string;
  hint: string;
  password: string;
  seconds: number;
  record: Uint8Array;
}

function word(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export async function readWindowsCampaign(
  bytes: Uint8Array<ArrayBuffer>
): Promise<Board[]> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  if (hash !== campaignHash)
    throw Error(
      "Choose the original CHIPS.DAT from Microsoft Entertainment Pack 4 (149 levels)."
    );
  // The exact digest covers both layers, all ordered monster/device lists and all metadata.
  const boards: Board[] = [];
  const decoder = new TextDecoder("windows-1252");
  for (let i = 6; i < bytes.length; ) {
    const length = word(bytes, i);
    i += 2;
    const record = bytes.slice(i, i + length);
    i += length;
    let p = 8;
    for (let layer = 0; layer < 2; layer++) p += 2 + word(record, p);
    p += 2;
    const board = {
      number: word(record, 0),
      seconds: word(record, 2),
      title: "",
      hint: "",
      password: "",
      record,
    };
    while (p < length) {
      const type = record[p++],
        size = record[p++];
      const data = record.subarray(p, p + size);
      p += size;
      const str = data.subarray(
        0,
        data.indexOf(0) < 0 ? size : data.indexOf(0)
      );
      if (type === 3) board.title = decoder.decode(str);
      if (type === 7) board.hint = decoder.decode(str);
      if (type === 6)
        board.password = String.fromCharCode(...str.map((b) => b ^ 0x99));
    }
    boards.push(board);
  }
  return boards;
}

// A small original board lets visitors try the controls before importing a campaign.
export function benchTest(): Board {
  const rows = [
    "#########",
    "#..#....#",
    "#..i..#.#",
    "#.##..#.#",
    "#.@..i#.#",
    "#.##....#",
    "#....#s##",
    "#....#e##",
    "#########",
  ];
  const ids: Record<string, number> = {
    "#": 1,
    ".": 0,
    "@": 0x6e,
    i: 2,
    s: 0x22,
    e: 0x15,
  };
  const top = new Uint8Array(1024).fill(1);
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++) top[(y + 11) * 32 + x + 11] = ids[rows[y][x]];
  const record = Uint8Array.from([
    1,
    0,
    0,
    0,
    2,
    0,
    1,
    0,
    0,
    4,
    ...top,
    0,
    4,
    ...new Uint8Array(1024),
    0,
    0,
  ]);
  return {
    number: 1,
    title: "Bench test",
    seconds: 0,
    hint: "",
    password: "",
    record,
  };
}

export function encodeBytes(bytes: Uint8Array) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
export function decodeBytes(text: string) {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

export interface Progress {
  current: number;
  known: number[];
  best: Record<number, number | null>;
}
export const newProgress = (): Progress => ({
  current: 1,
  known: [1],
  best: {},
});
export function readProgress(raw: string, boards: Board[]): Progress {
  const p: Progress = JSON.parse(raw);
  const valid = (n: number) =>
    Number.isInteger(n) && n > 0 && n <= boards.length;
  if (
    !p ||
    !valid(p.current) ||
    !Array.isArray(p.known) ||
    !p.known.includes(1) ||
    !p.known.includes(p.current) ||
    !p.known.every(valid) ||
    !p.best ||
    typeof p.best !== "object" ||
    Array.isArray(p.best)
  )
    throw Error("Invalid save code.");
  for (const [n, t] of Object.entries(p.best))
    if (
      !valid(Number(n)) ||
      !p.known.includes(Number(n)) ||
      (t !== null && (!Number.isSafeInteger(t) || t < 0))
    )
      throw Error("Invalid best time.");
  return {
    current: p.current,
    known: [...new Set(p.known)].sort((a, b) => a - b),
    best: { ...p.best },
  };
}
