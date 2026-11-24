import { TextDecoder } from "node:util";

import { COLS, ROWS, type Level } from "./level";

// Windows v1.0 stores a little-endian NE directory around big-endian Mac board records.
export function readLibrary(input: Uint8Array): Level[] {
  const checksum = (bytes: Uint8Array) => {
    let crc = -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  };
  const bytes =
    input.length === 47772 && checksum(input) === 0xe6e2801c
      ? expandInstaller(input)
      : input;
  if (bytes.length !== 147744 || checksum(bytes) !== 0x25d05712)
    throw new Error(
      "Choose LEVELS.CLL or LEVELS.CL_ from the 1995 US Windows CD."
    );
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const le = (p: number) => view.getUint16(p, true);
  const string = (p: number) =>
    String.fromCharCode(...bytes.subarray(p + 1, p + 1 + bytes[p]));
  const ne = view.getUint32(60, true);
  const table = ne + le(ne + 36);
  const unit = 2 ** le(table);
  const boards = new Map<number, number>();
  let catalog = 0;
  let entry = table + 2;
  while (le(entry)) {
    const type = string(table + le(entry));
    const count = le(entry + 2);
    entry += 8;
    for (let i = 0; i < count; i++, entry += 12) {
      const offset = le(entry) * unit,
        id = le(entry + 6) & 0x7fff;
      if (type === "RND2") boards.set(id, offset);
      if (type === "RNDM" && id === 1000) catalog = offset;
    }
  }
  const count = le(catalog);
  let cursor = catalog + 2;
  return Array.from({ length: count }, (_, i) => {
    const offset = boards.get(le(cursor));
    if (offset === undefined) throw new Error("Missing board record.");
    const name = string(cursor + 2);
    cursor += 3 + name.length;
    cursor += cursor % 2;
    return readLevel(view, offset, i + 1, name);
  });
}

function expandInstaller(input: Uint8Array) {
  const result = new Uint8Array(147744);
  const ring = new Uint8Array(4096).fill(32);
  let dst = 0,
    src = 14,
    cursor = 4080;
  while (dst < result.length) {
    const flags = input[src++];
    for (let bit = 0; bit < 8 && dst < result.length; bit++) {
      let count = 1,
        pos = 0;
      const literal = flags & (1 << bit);
      if (!literal) {
        const low = input[src++],
          high = input[src++];
        pos = low | ((high & 240) << 4);
        count = 3 + (high & 15);
      }
      for (let j = 0; j < count; j++) {
        const value = literal ? input[src++] : ring[(pos + j) & 4095];
        result[dst++] = value;
        ring[cursor] = value;
        cursor = (cursor + 1) & 4095;
      }
    }
  }
  return result;
}

function readLevel(
  view: DataView,
  start: number,
  number: number,
  name: string
): Level {
  let p = start;
  const word = () => {
    const v = view.getInt16(p);
    p += 2;
    return v;
  };
  const align = () => {
    p += p % 2;
  };
  const string = () => {
    const n = view.getUint8(p++);
    const bytes = new Uint8Array(view.buffer, view.byteOffset + p, n);
    p += n;
    return String.fromCharCode(...bytes);
  };
  const list = (size: number) =>
    Array.from({ length: word() }, () => Array.from({ length: size }, word));
  word();
  const variant = word(),
    seconds = word();
  word();
  const cells = Array.from({ length: COLS * ROWS }, () => {
    const flags = word(),
      mask = word() & 0xffff;
    let path = "";
    if (flags & 128) {
      path = string();
      align();
    }
    return { flags, mask, path };
  });
  const warps = list(5),
    spikes = list(6),
    walls = list(6),
    doors = list(4),
    switches = list(4);
  const oil = list(5),
    fuses = list(4),
    glasses = list(5),
    stations = list(6);
  const paths = Array.from({ length: word() }, string);
  align();
  const actors = list(variant === 11 ? 10 : 11);
  const macRoman = new TextDecoder("macintosh");
  const notes = Array.from({ length: word() }, () => {
    const start = p;
    p += 107;
    const text = new Uint8Array(
      view.buffer,
      view.byteOffset + start + 44,
      view.getUint8(start + 43)
    );
    return {
      x: view.getInt16(start + 39),
      y: view.getInt16(start + 41),
      size: view.getUint8(start + 34),
      text: macRoman.decode(text).trim(),
    };
  });
  align();
  const rails = list(3),
    lifts = list(6),
    guns = list(7),
    triggers = list(6);
  return {
    number,
    name,
    seconds,
    cells,
    warps,
    spikes,
    walls,
    doors,
    switches,
    oil,
    fuses,
    glasses,
    stations,
    notes,
    paths,
    actors,
    rails,
    lifts,
    guns,
    triggers,
  };
}
