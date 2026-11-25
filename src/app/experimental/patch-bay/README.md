# Patch Bay

Patch Bay plays the 149-level Windows edition of _Chip’s Challenge_ with keyboard or touch controls at `/experimental/patch-bay/`.

## Architecture

```mermaid
flowchart TB
    accTitle: Patch Bay build, browser runtimes, and campaign loading
    accDescr: Tile World supplies C source. Patch Bay compiles it to WebAssembly. On a first visit the browser fetches CHIPS.DAT from GitHub Raw. On return it reads the verified file and saved level from local storage.
    legend["<b>Legend</b><br/>🟦 Tile World source<br/>🟩 Built for Patch Bay<br/>🟪 External campaign host<br/>🟨 Player’s file<br/>⬜ Built into the browser"]:::key

    subgraph build["Build time"]
        rules["Tile World<br/>Windows rules in C"]:::tileworld
        glue["Patch Bay<br/>C adapter + sound patch"]:::patchbay
        compiler["Patch Bay build script<br/>Invokes Clang"]:::patchbay
        rules --> compiler
        glue --> compiler
    end

    subgraph site["Files served by Patch Bay"]
        wasm["ms-engine.wasm"]:::patchbay
        app["JavaScript app<br/>Includes practice board"]:::patchbay
        media["Sprites and music"]:::patchbay
    end
    compiler -->|Produces| wasm

    mirror["GitHub Raw · gcmaniac/win10_cc<br/>Windows CHIPS.DAT"]:::external
    file["Player’s local CHIPS.DAT"]:::player

    subgraph device["Player’s browser"]
        js["JavaScript runtime<br/>Runs controls and verifies CHIPS.DAT"]:::browser
        store[("Local storage<br/>Campaign, progress and settings")]:::browser
        runtime["WebAssembly runtime<br/>Executes the game rules"]:::browser
        output["Canvas and Web Audio<br/>Draw sprites and play sound"]:::browser
    end

    app -->|Runs in| js
    wasm -->|Runs in| runtime
    media --> output
    mirror -->|"First visit or invalid cache · fetch file"| js
    legend ~~~ file
    file -.->|"Optional · open from Levels"| js
    js -->|"Save verified file and progress"| store
    store -->|"Return visit · read file and saved level"| js
    js <-->|"Moves in · board state and sound cues out"| runtime
    js --> output

    classDef key fill:#ffffff,stroke:#9ca3af,color:#20252b
    classDef tileworld fill:#dceafa,stroke:#376892,color:#152b40
    classDef patchbay fill:#d9f2e8,stroke:#267052,color:#122b22
    classDef external fill:#ece4f5,stroke:#75568d,color:#30203e
    classDef player fill:#fff0cb,stroke:#956f21,color:#392b0f
    classDef browser fill:#eceef1,stroke:#65707e,color:#20252b
```

- **First visit.** The browser downloads `CHIPS.DAT` directly from the external host, checks its SHA-256, saves the verified file locally when storage is available, and opens Lesson 1. The default URL points to a specific revision. [Campaign file on GitHub Raw](https://raw.githubusercontent.com/gcmaniac/win10_cc/74da8199a3e45b7d154f08a683132761fabd7663/direct_method/chips_challenge/CHIPS.DAT)
- **Return visit.** The browser checks the saved file again and opens the current level from saved progress. A valid local copy lets it skip the campaign download.
- **Missing or damaged copy.** The browser tries the external host again. If the download fails or its hash differs, the two-chip **Bench test** opens. Players can also import their own copy through **Levels → Open CHIPS.DAT**.

To change the external host, set `NEXT_PUBLIC_PATCH_BAY_CAMPAIGN_URL` before building. The host must allow cross-origin reads. [Campaign playthrough and verification](../../../../docs/patch-bay-verification.md)
