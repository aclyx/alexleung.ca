#!/bin/sh
# Tile World 2 df08b921ec718884c141020c6feaf0c0e45f8e8a, WASI SDK 34.
# Usage: build-engine.sh <Tile World source directory> <wasi-sdk bin/clang> <output directory>
set -eu
upstream=$1
cc=$2
out=$3
source_dir=$(dirname "$0")
bridge=$source_dir/bridge.c
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
patch -s -o "$work/mslogic.c" "$upstream/mslogic.c" < "$source_dir/ms-audio.patch"
"$cc" -O2 -DNDEBUG -ffunction-sections -fdata-sections -nostartfiles \
  -fmacro-prefix-map="$upstream"=tile-world -fmacro-prefix-map="$work"=tile-world \
  -I"$upstream" "$bridge" "$work/mslogic.c" "$upstream/random.c" \
  -Wl,--no-entry,--gc-sections,--strip-all -o "$out/ms-engine.wasm"
# Source accompanies the distributed binary, including this build recipe.
set -- "$bridge" "$0" "$source_dir/ms-audio.patch"
for file in COPYING mslogic.c encoding.c random.c gen.h defs.h err.h state.h logic.h encoding.h random.h; do
  set -- "$@" "$upstream/$file"
done
zip -q -j "$out/engine-source.zip" "$@"
