// Independently expand both 32×32 RLE layers, then read back the engine's initial board.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";

const [file, wasm, report] = process.argv.slice(2);
const bytes = fs.readFileSync(file);
const hash = (b) => createHash("sha256").update(b).digest("hex");
assert.equal(
  hash(bytes),
  "b0a68f21642447385512e0ed9386a4a13a4f7e9a38f909da772104d8e6b5c1fb"
);
const { instance } = await WebAssembly.instantiate(fs.readFileSync(wasm));
const engine = instance.exports,
  rows = [];
assert.equal(bytes.readUInt16LE(4), 149);
for (let n = 1, p = 6; n <= 149; n++) {
  const size = bytes.readUInt16LE(p);
  p += 2;
  const board = bytes.subarray(p, p + size);
  p += size;
  assert.equal(board.readUInt16LE(0), n);
  let at = 8;
  const layers = [];
  for (let layer = 0; layer < 2; layer++) {
    const length = board.readUInt16LE(at);
    at += 2;
    const end = at + length,
      tiles = [];
    while (at < end) {
      const id = board[at++];
      if (id !== 255) tiles.push(id);
      else {
        const run = board[at++],
          value = board[at++];
        assert(run && at <= end);
        for (let i = 0; i < run; i++) tiles.push(value);
      }
    }
    assert.equal(tiles.length, 1024);
    layers.push(Buffer.from(tiles));
  }
  assert.equal(board.readUInt16LE(at) + at + 2, size);
  new Uint8Array(engine.memory.buffer, engine.buffer(), size).set(board);
  assert(engine.start(size, 0, 0));
  assert.equal(engine.chips(), board.readUInt16LE(4));
  for (let i = 0; i < 1024; i++)
    assert.equal(
      engine.cell(i),
      layers[0][i] + 256 * layers[1][i],
      "Level " + n + " cell " + i
    );
  rows.push({
    number: n,
    upper: hash(layers[0]),
    lower: hash(layers[1]),
    metadata: hash(board.subarray(at + 2)),
    record: hash(board),
  });
  if (n === 149) assert.equal(p, bytes.length);
}
if (report) fs.writeFileSync(report, JSON.stringify(rows, null, 2) + "\n");
console.log(
  rows.length + " boards matched, 305152 original tile IDs verified."
);
