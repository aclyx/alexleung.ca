// SPDX-License-Identifier: GPL-2.0-or-later
// Browser boundary for Tile World's Microsoft rules. Coordinates are board cells.
#include "encoding.c"
#include "logic.h"
#include "random.h"

#define EXPORT(name) __attribute__((export_name(name)))
static gamestate state;
static gamesetup setup;
static gamelogic *logic;
static unsigned char record[65536], atlas_id[256];
static int outcome;

char const *err_cfile_;
unsigned long err_lineno_;
int pedanticmode = 0;
void warn_(char const *fmt, ...) {}
void errmsg_(char const *prefix, char const *fmt, ...) {}
void die_(char const *fmt, ...) { __builtin_trap(); }

EXPORT("buffer") unsigned char *buffer(void) { return record; }

EXPORT("start") int start(int size, unsigned seed, int phase) {
    if (size < 12 || size > 65535) return 0;
    if (logic) logic->endgame(logic);
    else {
        logic = mslogicstartup();
        for (int n = sizeof(fileids)/sizeof(*fileids)-1; n >= 0; --n)
            atlas_id[fileids[n]] = n;
    }
    memset(&state, 0, sizeof(state));
    setup.number = readword(record);
    setup.time = readword(record + 2);
    setup.leveldata = record;
    setup.levelsize = size;
    state.game = &setup;
    state.ruleset = Ruleset_MS;
    state.replay = -1;
    state.currenttime = -1;
    state.timelimit = setup.time * TICKS_PER_SECOND;
    logic->state = &state;
    outcome = 0;
    if (!expandleveldata(&state) || !logic->initgame(logic)) return 0;
    restartprng(&state.mainprng, seed);
    state.stepping = phase & 7;
    return 1;
}

// The browser retains each press until choosechipmove takes it. Passing zero
// also cancels pending input when a paused or interrupted game resumes.
EXPORT("step") int step(int command) {
    if (outcome) return outcome;
    state.currenttime++;
    state.soundeffects = 0; /* MS emits terrain and device cues on the interaction tick. */
    state.currentinput = (command == NORTH || command == WEST || command == SOUTH || command == EAST)
                         ? command : CmdNone;
    return outcome = logic->advancegame(logic);
}
EXPORT("inputPending") int inputPending(void) { return state.currentinput != CmdNone; }

EXPORT("cell") int cell(unsigned pos) {
    if (pos >= 1024) return 0;
    mapcell c = state.map[pos];
    return atlas_id[c.top.id] | (atlas_id[c.bot.id] << 8);
}
EXPORT("position") int position(void) { return state.xviewpos / 8 + 32 * (state.yviewpos / 8); }
EXPORT("chips") int chips(void) { return state.chipsneeded; }
EXPORT("ticks") int ticks(void) { return state.currenttime + state.timeoffset; }
EXPORT("equipment") int equipment(int slot) {
    if ((unsigned)slot >= 8) return 0;
    return slot < 4 ? state.keys[slot] : state.boots[slot-4];
}
EXPORT("hint") int hint(void) { return !!(state.statusflags & SF_SHOWHINT); }
EXPORT("cause") int cause(void) { return state.msstate.chipstatus; }
EXPORT("sounds") unsigned sounds(void) { return state.soundeffects; }
