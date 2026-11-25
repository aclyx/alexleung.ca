# Patch Bay campaign playthrough

On November 24, 2026, all 149 Windows levels cleared on desktop Chromium with arrow keys and on mobile WebKit with the on-screen directional pad. All 298 clears reached the in-game win state and saved the exact finish tick of the corresponding Microsoft-rules recording. Each run began in a fresh browser profile and used 55,482 directional inputs. Both completed saves survived a reload and restored all 149 best times in the other browser.

## Fixes and regression checks

The patched export cleared 149 of 149 levels on keyboard and 149 of 149 on emulated touch. Every finish matched the table below. Both complete saves reloaded and restored in the other browser. All 149 ready screens also fit at 320 × 568 and 667 × 320.

- **Level selection.** Entering `BIFQ` offers 095 FOUR SQUARE and 096 PARANOIA. Either can be opened from a fresh save. Opening one adds it to the level list without marking it cleared. Passwords with one match still open that level directly.
- **Death artwork.** Moving up from the starting tile in THE PRISONER (123) draws the bomb-death sprite on the outlined impact tile. Retry stays outside the board.
- **Hints and restart.** A hint that overflows the live display offers **Read hint**. It opens the pause screen, which displays the entire hint and offers **Resume game** and **Restart level**. CELLBLOCKED (16) keeps its original Windows text and adds the Patch Bay restart path. On LESSON 4 and CELLBLOCKED, the game clock stayed fixed while reading, Resume continued the attempt, and Restart returned to the starting tile.
- **Keyboard and navigation.** Focus returns to the board after selecting a level. Space pauses without opening Levels. The covered site links are outside the game's tab order, and the footer RSS link opens the XML file directly.

These regressions were checked in the static export at 1280 × 800 with desktop Chromium, and at 390 × 844, 320 × 568, and 667 × 320 with emulated WebKit touch. On the two smallest layouts, the complete hint and both pause actions were visible on levels 4 and 16. The browser logs showed no failed resources during these checks.

## Initial findings

| Priority | Where to reproduce                                                             | What the player sees                                                                                                                                                                                                                                                         | Suggested change                                                                                             |
| -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Medium   | Levels 95 FOUR SQUARE and 96 PARANOIA                                          | Both original records contain the password `BIFQ`. The Save screen on 96 gives that password, but entering it under Levels opens 95. Clearing 95 still leads to 96, and the numbered level list can reopen 96 after it is unlocked.                                          | Show both matching level numbers and titles when a password is ambiguous. Preserve both original records.    |
| Medium   | Level 123 THE PRISONER, one step up from spawn                                 | The game reports “Caught in a blast” and correctly ends the attempt. The impact tile shows the robot standing on a lit bomb. The renderer uses the ordinary north-facing sprite even though the sheet contains a bomb-death sprite. This reproduced with keyboard and touch. | Use the bomb-death artwork for a fatal blast and keep the impact border and Retry action.                    |
| Medium   | Level 16 CELLBLOCKED, four steps up from spawn                                 | The Windows hint tells players to press Ctrl+R or use Restart in the Level menu. Patch Bay’s Levels menu has no Restart action. The game let Ctrl+R pass through to the browser. The working route is **Guide → Restart level**.                                             | Keep the original hint in the level data and show the browser-specific restart action alongside it.          |
| Medium   | Level 4 LESSON 4, one step down onto the hint                                  | On a 667 × 320 phone the hint needs 129 px in a 44 px region. On a 320 × 568 phone it needs 100 px in 58 px, and the Pause button extends 17 px below the viewport. The hint scrolls while the timer runs and disappears when paused.                                        | Keep the current hint readable on pause and reserve space for the controls on short screens.                 |
| Medium   | Desktop keyboard, fresh page, Tab before starting                              | The first six Tab stops are site links covered by the game. After the game controls, Tab also reaches the hidden site footer. A player can activate navigation they cannot see.                                                                                              | Remove the covered site navigation from the tab order while the full-window game is active.                  |
| Low      | Desktop keyboard, open a level by password, move with arrows, then press Space | Focus stays on the Levels button. Space pauses the timer **and opens the Levels menu**. The guide promises pause/resume. Escape reaches the ordinary pause screen.                                                                                                           | Return focus to the board after selecting a level, while preserving normal keyboard activation inside menus. |
| Low      | Load or reload the production export in either browser                         | The site tries to prefetch a route underneath the RSS file and receives a 404 for `/feed.xml/__next._tree.txt`. The feed file exists and gameplay continues. This was the only failed resource path in the campaign logs.                                                    | Link to the RSS file with an ordinary anchor so it opens without route prefetch.                             |

## Playthrough notes

- **A positive chip counter at the exit can be correct.** The recorded routes cleared level 20 with 12 chips still required at a socket, 39 with 14, 46 with 13, 59 with 8, and 60 with 12. The quota controls the socket. An accessible exit still works. The underlying tile at the winning position was an exit on all 149 reference runs.
- **The campaign has two endings to check.** Level 144 displayed “Campaign complete.” Its **Bonus levels** button opened the level list, where entering the original password for 145 started the bonus sequence. Level 149 displayed “Circuit complete” and **Replay**. The Levels screen is where players can check the total number cleared.
- **Some routes depend on timing or random movement.** As a separate rules-engine check, each recorded input sequence was repeated with eight fixed test seed values at both supported starting phases. Across these 2,384 attempts the same inputs won 2,002 times. On 114 boards they won in all 16 combinations. The other 35 sometimes required different moves or timing. The two browser clears establish a winning route for each such board.
- **Previously reported issues.** In Lesson 8 the collision now showed Teeth and the fallen orange robot together on both controls, including when an old sprite URL was available. Desktop keyboard, mouse and emulated touch each delivered ten rapid direction changes in order in a separate real-time check. The 60-second stereo music loop crossed its loop point, resumed after pause and respected mute in both browsers.

## Coverage and limits

The tests used the current static export, Chromium 147.0.7727.15 at 1280 × 800 and WebKit 26.4 at 390 × 844. Each browser imported the original Microsoft Entertainment Pack 4 file through the Levels menu. The test supplied the reference seed and starting phase, advanced the animation clock in increments of at most 16 ms, and sent trusted key or touch events through Patch Bay’s ordinary controls. It used **Next level** throughout the main campaign and a password to enter the bonus sequence. Password entry alone never counted as a clear.

An independent decoder compared all 305,152 starting tile IDs across both layers with the shipped rules engine. The browser checks sampled the rendered board, HUD and controls at the start, halfway through the recorded inputs, and after the clear on every level. All 894 samples had a rendered, unobscured board and controls within the two main test viewports. I also inspected the midpoint board images for all 149 levels. I reopened all 149 boards in 320 × 568 portrait and 667 × 320 landscape using the verified progress. In portrait, Level 9’s Start button extended about one pixel below the ready screen. Long hints caused the larger overflow described above. In landscape, all ready-screen controls fit. Visual sampling can miss brief animation defects. Touch testing used browser emulation. Physical phone ergonomics, live comparison with the Windows executable, and solutions for every possible random start were outside this run.

## Reproduce the runs

The routes came from the public Microsoft-rules solution collection, which credits each player. Patch Bay runs the Tile World Microsoft rules engine. [Recordings and player credits](https://davidstolp.com/old/chips/tws/?set=CHIPS) · [Rules implementation](https://github.com/SicklySilverMoon/tworld/blob/df08b921ec718884c141020c6feaf0c0e45f8e8a/mslogic.c)

Serve a production export on localhost. Point `DAT` at the original Windows file and `TWS` at the public MS solution file. The public export starts with an original two-chip practice circuit. Under `yarn dev`, a private copy at `.cache/patch-bay/CHIPS.DAT` loads automatically. On the exported site, select **Levels → Open CHIPS.DAT** once per browser.

```sh
URL=http://127.0.0.1:4180/experimental/patch-bay/
yarn patch-bay:check-layouts "$DAT" public/assets/patch-bay/ms-engine.wasm
yarn patch-bay:verify "$URL" "$DAT" "$TWS" keyboard /tmp/patch-bay-keyboard.json
PATCH_BAY_BROWSER=webkit yarn patch-bay:verify "$URL" "$DAT" "$TWS" touch /tmp/patch-bay-touch.json
```

| Input            | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Windows campaign | `b0a68f21642447385512e0ed9386a4a13a4f7e9a38f909da772104d8e6b5c1fb` |
| Public solutions | `d29ca2d15736f5344b9b3df5e7fff92fa009979c1e967f8b02fc2803b3ca6605` |
| Shipped engine   | `b306f8ff046d45d2902e64148db4f8b1b36203b69051098e7e0d382cb548ca97` |
| Sprite sheet     | `9356288ec3d89ab6737e4d39ee49f2e0f7c9beddbc5af799b45c9714a65345bc` |

## Finish ticks by board

The keyboard and touch columns come from the best times saved by each browser. A tick is one twentieth of a game second. The last column counts successful replays of the same inputs across the 16 additional seed and phase combinations.

| Level | Windows title       | Directional inputs | Reference tick | Keyboard tick | Touch tick | Alternate clears / 16 |
| ----: | ------------------- | -----------------: | -------------: | ------------: | ---------: | --------------------: |
|     1 | LESSON 1            |                 90 |            356 |           356 |        356 |                    16 |
|     2 | LESSON 2            |                 51 |            200 |           200 |        200 |                    16 |
|     3 | LESSON 3            |                 60 |            236 |           236 |        236 |                    16 |
|     4 | LESSON 4            |                171 |            680 |           680 |        680 |                    16 |
|     5 | LESSON 5            |                 77 |            316 |           316 |        316 |                    16 |
|     6 | LESSON 6            |                 35 |            136 |           136 |        136 |                    16 |
|     7 | LESSON 7            |                 58 |            228 |           228 |        228 |                    16 |
|     8 | LESSON 8            |                 21 |             80 |            80 |         80 |                     8 |
|     9 | NUTS AND BOLTS      |                447 |           1892 |          1892 |       1892 |                    16 |
|    10 | BRUSHFIRE           |                148 |            588 |           588 |        588 |                    16 |
|    11 | TRINITY             |                469 |           1792 |          1792 |       1792 |                    16 |
|    12 | HUNT                |                655 |           2616 |          2616 |       2616 |                    16 |
|    13 | SOUTHPOLE           |                  8 |            343 |           343 |        343 |                    16 |
|    14 | TELEBLOCK           |                246 |            936 |           936 |        936 |                    16 |
|    15 | ELEMENTARY          |                793 |           3228 |          3228 |       3228 |                    16 |
|    16 | CELLBLOCKED         |                144 |            572 |           572 |        572 |                    16 |
|    17 | NICE DAY            |                 90 |            356 |           356 |        356 |                     6 |
|    18 | CASTLE MOAT         |                240 |            956 |           956 |        956 |                    16 |
|    19 | DIGGER              |                198 |            788 |           788 |        788 |                     8 |
|    20 | TOSSED SALAD        |                219 |           1216 |          1216 |       1216 |                    16 |
|    21 | ICEBERG             |                122 |            636 |           636 |        636 |                    16 |
|    22 | FORCED ENTRY        |                 49 |            148 |           148 |        148 |                    16 |
|    23 | BLOBNET             |                316 |           1292 |          1292 |       1292 |                     0 |
|    24 | OORTO GELD          |                601 |           2400 |          2400 |       2400 |                    16 |
|    25 | BLINK               |                855 |           3304 |          3304 |       3304 |                    16 |
|    26 | CHCHCHIPS           |                231 |            928 |           928 |        928 |                     8 |
|    27 | GO WITH THE FLOW    |                235 |           1068 |          1068 |       1068 |                    16 |
|    28 | PING PONG           |                250 |           1220 |          1220 |       1220 |                    16 |
|    29 | ARCTICFLOW          |                418 |           1960 |          1960 |       1960 |                    16 |
|    30 | MISHMESH            |                733 |           2928 |          2928 |       2928 |                    16 |
|    31 | KNOT                |                128 |            472 |           472 |        472 |                    16 |
|    32 | SCAVENGER HUNT      |               1106 |           4420 |          4420 |       4420 |                    16 |
|    33 | ON THE ROCKS        |               1577 |           6308 |          6308 |       6308 |                    16 |
|    34 | CYPHER              |                263 |           1060 |          1060 |       1060 |                    16 |
|    35 | LEMMINGS            |                117 |            464 |           464 |        464 |                    16 |
|    36 | LADDER              |                592 |           2364 |          2364 |       2364 |                    16 |
|    37 | SEEING STARS        |               1019 |           4072 |          4072 |       4072 |                    16 |
|    38 | SAMPLER             |                205 |            760 |           760 |        760 |                     7 |
|    39 | GLUT                |                 18 |             72 |            72 |         72 |                     8 |
|    40 | FLOORGASBORG        |                 33 |            112 |           112 |        112 |                     6 |
|    41 | I.C. YOU            |                409 |           1572 |          1572 |       1572 |                    16 |
|    42 | BEWARE OF BUG       |                478 |           2268 |          2268 |       2268 |                    16 |
|    43 | LOCK BLOCK          |                345 |           1492 |          1492 |       1492 |                    16 |
|    44 | REFRACTION          |                730 |           3084 |          3084 |       3084 |                    16 |
|    45 | MONSTER LAB         |                 44 |            172 |           172 |        172 |                     0 |
|    46 | THREE DOORS         |                 65 |            572 |           572 |        572 |                     4 |
|    47 | PIER SEVEN          |                343 |           1380 |          1380 |       1380 |                    16 |
|    48 | MUGGER SQUARE       |                114 |            464 |           464 |        464 |                    16 |
|    49 | PROBLEMS            |                194 |            768 |           768 |        768 |                    16 |
|    50 | DIGDIRT             |                160 |            648 |           648 |        648 |                    16 |
|    51 | I SLIDE             |                 34 |           1919 |          1919 |       1919 |                    16 |
|    52 | THE LAST LAUGH      |                 92 |            368 |           368 |        368 |                     8 |
|    53 | TRAFFIC COP         |                113 |            444 |           444 |        444 |                    16 |
|    54 | GRAIL               |                120 |            492 |           492 |        492 |                     0 |
|    55 | POTPOURRI           |                151 |            604 |           604 |        604 |                    16 |
|    56 | DEEPFREEZE          |                143 |           1768 |          1768 |       1768 |                    16 |
|    57 | STRANGE MAZE        |                860 |           3436 |          3436 |       3436 |                    16 |
|    58 | LOOP AROUND         |                185 |           1012 |          1012 |       1012 |                    16 |
|    59 | HIDDEN DANGER       |                119 |            655 |           655 |        655 |                    16 |
|    60 | SCOUNDREL           |                 33 |            124 |           124 |        124 |                     0 |
|    61 | RINK                |                146 |            980 |           980 |        980 |                    16 |
|    62 | SLO MO              |                 81 |            364 |           364 |        364 |                     0 |
|    63 | BLOCK FACTORY       |                130 |            476 |           476 |        476 |                    16 |
|    64 | SPOOKS              |                262 |           1052 |          1052 |       1052 |                     8 |
|    65 | AMSTERDAM           |                402 |           2079 |          2079 |       2079 |                    16 |
|    66 | VICTIM              |                 45 |            172 |           172 |        172 |                    16 |
|    67 | CHIPMINE            |                912 |           3644 |          3644 |       3644 |                    16 |
|    68 | EENY MINY MOE       |                808 |           3224 |          3224 |       3224 |                    16 |
|    69 | BOUNCE CITY         |                285 |           1424 |          1424 |       1424 |                    16 |
|    70 | NIGHTMARE           |                309 |           1272 |          1272 |       1272 |                    14 |
|    71 | CORRIDOR            |                729 |           2912 |          2912 |       2912 |                    12 |
|    72 | REVERSE ALLEY       |                181 |            760 |           760 |        760 |                    16 |
|    73 | MORTON              |                579 |           2312 |          2312 |       2312 |                     8 |
|    74 | PLAYTIME            |                143 |            828 |           828 |        828 |                    16 |
|    75 | STEAM               |                109 |            432 |           432 |        432 |                    16 |
|    76 | FOUR PLEX           |                651 |           2685 |          2685 |       2685 |                    16 |
|    77 | INVINCIBLE CHAMPION |                 91 |            380 |           380 |        380 |                    16 |
|    78 | FORCE SQUARE        |                106 |            412 |           412 |        412 |                    16 |
|    79 | DRAWN AND QUARTERED |                407 |           1616 |          1616 |       1616 |                    16 |
|    80 | VANISHING ACT       |                340 |           1356 |          1356 |       1356 |                    16 |
|    81 | WRITERS BLOCK       |               2420 |           9676 |          9676 |       9676 |                    16 |
|    82 | SOCIALIST ACTION    |                148 |            608 |           608 |        608 |                     8 |
|    83 | UP THE BLOCK        |                505 |           2052 |          2052 |       2052 |                    16 |
|    84 | WARS                |                 99 |            416 |           416 |        416 |                    16 |
|    85 | TELENET             |                348 |           1292 |          1292 |       1292 |                    16 |
|    86 | SUICIDE             |                 89 |            388 |           388 |        388 |                    16 |
|    87 | CITYBLOCK           |               2194 |           9032 |          9032 |       9032 |                    16 |
|    88 | SPIRALS             |                416 |           1660 |          1660 |       1660 |                    16 |
|    89 | BLOCK BUSTER        |                255 |            976 |           976 |        976 |                    16 |
|    90 | PLAYHOUSE           |                369 |           1648 |          1648 |       1648 |                    16 |
|    91 | JUMPING SWARM       |                169 |            672 |           672 |        672 |                     0 |
|    92 | VORTEX              |                281 |           1136 |          1136 |       1136 |                     0 |
|    93 | ROADSIGN            |                782 |           2992 |          2992 |       2992 |                    16 |
|    94 | NOW YOU SEE IT      |                467 |           1864 |          1864 |       1864 |                    16 |
|    95 | FOUR SQUARE         |                 79 |            300 |           300 |        300 |                     8 |
|    96 | PARANOIA            |                363 |           1592 |          1592 |       1592 |                    16 |
|    97 | METASTABLE TO CHAOS |                 52 |            212 |           212 |        212 |                    16 |
|    98 | SHRINKING           |                 76 |            258 |           258 |        258 |                    16 |
|    99 | CATACOMBS           |                103 |            396 |           396 |        396 |                     0 |
|   100 | COLONY              |                441 |           1760 |          1760 |       1760 |                    16 |
|   101 | APARTMENT           |                304 |           1212 |          1212 |       1212 |                    16 |
|   102 | ICEHOUSE            |                 73 |            475 |           475 |        475 |                    16 |
|   103 | MEMORY              |                562 |           2244 |          2244 |       2244 |                    16 |
|   104 | JAILER              |                323 |           1304 |          1304 |       1304 |                     2 |
|   105 | SHORT CIRCUIT       |                480 |           1916 |          1916 |       1916 |                    16 |
|   106 | KABLAM              |                164 |           1856 |          1856 |       1856 |                    16 |
|   107 | BALLS O FIRE        |                204 |            812 |           812 |        812 |                    16 |
|   108 | BLOCK OUT           |                319 |           1440 |          1440 |       1440 |                    16 |
|   109 | TORTURECHAMBER      |                 84 |            352 |           352 |        352 |                    16 |
|   110 | CHILLER             |                341 |           2448 |          2448 |       2448 |                    16 |
|   111 | TIME LAPSE          |                188 |            728 |           728 |        728 |                    16 |
|   112 | FORTUNE FAVOURS THE |                 71 |            288 |           288 |        288 |                    16 |
|   113 | OPEN QUESTION       |                165 |            760 |           760 |        760 |                    16 |
|   114 | DECEPTION           |                117 |            568 |           568 |        568 |                    16 |
|   115 | OVERSEA DELIVERY    |                434 |           1548 |          1548 |       1548 |                    16 |
|   116 | BLOCK BUSTER II     |                161 |            736 |           736 |        736 |                    16 |
|   117 | THE MARSH           |                290 |           1156 |          1156 |       1156 |                    16 |
|   118 | MISS DIRECTION      |                141 |            810 |           810 |        810 |                    15 |
|   119 | SLIDE STEP          |                201 |            808 |           808 |        808 |                    16 |
|   120 | ALPHABET SOUP       |                266 |           1008 |          1008 |       1008 |                     8 |
|   121 | PERFECT MATCH       |                121 |            624 |           624 |        624 |                    16 |
|   122 | TOTALLY FAIR        |                139 |            568 |           568 |        568 |                     8 |
|   123 | THE PRISONER        |                111 |            540 |           540 |        540 |                     8 |
|   124 | FIRETRAP            |                557 |           2667 |          2667 |       2667 |                    16 |
|   125 | MIXED NUTS          |                781 |           3380 |          3380 |       3380 |                    16 |
|   126 | BLOCK N ROLL        |                788 |           3156 |          3156 |       3156 |                     0 |
|   127 | SKELZIE             |                253 |            928 |           928 |        928 |                     0 |
|   128 | ALL FULL            |                423 |           1708 |          1708 |       1708 |                    16 |
|   129 | LOBSTER TRAP        |                 69 |            280 |           280 |        280 |                    16 |
|   130 | ICE CUBE            |                 51 |           1332 |          1332 |       1332 |                    16 |
|   131 | TOTALLY UNFAIR      |                170 |            692 |           692 |        692 |                     8 |
|   132 | MIX UP              |               1520 |           6332 |          6332 |       6332 |                     8 |
|   133 | BLOBDANCE           |                245 |            976 |           976 |        976 |                     0 |
|   134 | PAIN                |               3894 |          15628 |         15628 |      15628 |                    16 |
|   135 | TRUST ME            |                 36 |            140 |           140 |        140 |                    16 |
|   136 | DOUBLEMAZE          |                725 |           1461 |          1461 |       1461 |                    16 |
|   137 | GOLDKEY             |                238 |           1168 |          1168 |       1168 |                    16 |
|   138 | PARTIAL POST        |                338 |           1209 |          1209 |       1209 |                    16 |
|   139 | YORKHOUSE           |                400 |           1596 |          1596 |       1596 |                     0 |
|   140 | ICEDEATH            |                113 |            752 |           752 |        752 |                    16 |
|   141 | UNDERGROUND         |                156 |            628 |           628 |        628 |                    16 |
|   142 | PENTAGRAM           |                163 |            624 |           624 |        624 |                    16 |
|   143 | STRIPES?            |                709 |           2832 |          2832 |       2832 |                    16 |
|   144 | FIREFLIES           |                821 |           3352 |          3352 |       3352 |                    16 |
|   145 | Thanks to...        |                 38 |            175 |           175 |        175 |                     0 |
|   146 | CAKE WALK           |               1478 |           5752 |          5752 |       5752 |                    16 |
|   147 | FORCE FIELD         |                 96 |            592 |           592 |        592 |                    16 |
|   148 | MIND BLOCK          |               1854 |           7412 |          7412 |       7412 |                    16 |
|   149 | SPECIAL             |                115 |            892 |           892 |        892 |                    16 |
