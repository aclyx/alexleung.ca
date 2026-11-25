// Decode Tile World solution recordings for verification. Times are in ticks, twenty per game second.
export function readSolutions(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const word = (p) => view.getUint16(p, true);
  const long = (p) => view.getUint32(p, true);
  if (long(0) !== 0x999b3335 || bytes[4] !== 2)
    throw Error("Expected an MS solution file");
  const solutions = new Map();
  const directions = [1, 2, 4, 8, 3, 6, 9, 12];
  for (let p = 8 + bytes[7]; p < bytes.length; ) {
    const size = long(p);
    p += 4;
    const end = p + size;
    if (end > bytes.length) throw Error("Truncated recording");
    if (size > 16 && word(p)) {
      const level = word(p),
        seed = long(p + 8),
        phase = (bytes[p + 7] >> 3) & 7;
      const time = long(p + 12),
        moves = [];
      let tick = -1;
      const add = (delta, command) => moves.push([(tick += delta), command]);
      for (let i = p + 16; i < end; ) {
        const b = bytes[i++];
        switch (b & 3) {
          case 0:
            for (const shift of [2, 4, 6]) add(4, directions[(b >> shift) & 3]);
            break;
          case 1:
            add(1 + (b >> 5), directions[(b >> 2) & 7]);
            break;
          case 2:
            add(1 + (b >> 5) + (bytes[i++] << 3), directions[(b >> 2) & 7]);
            break;
          case 3: {
            if (b & 16) {
              const c = bytes[i++],
                n = (b >> 2) & 3;
              let delta = 1 + (c >> 6);
              for (let j = 0; j < n; j++)
                delta += bytes[i++] * 2 ** (2 + j * 8);
              add(delta, (b >> 5) | ((c & 63) << 3));
            } else {
              add(
                1 +
                  (b >> 5) +
                  (bytes[i++] << 3) +
                  (bytes[i++] << 11) +
                  (bytes[i++] << 19),
                directions[(b >> 2) & 3]
              );
            }
            break;
          }
        }
        if (i > end) throw Error("Truncated move");
      }
      const password = String.fromCharCode(...bytes.subarray(p + 2, p + 6));
      solutions.set(level, { seed, phase, time, moves, password });
    }
    p = end;
  }
  return solutions;
}
