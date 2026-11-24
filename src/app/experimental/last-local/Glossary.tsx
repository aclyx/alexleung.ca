import { useEffect, useRef, useState } from "react";

import { drawBoard, skins, type Skin } from "@/features/clockwerx/renderer";

import { ControlIcon } from "./Controls";
import styles from "./game.module.css";
import { exampleWorld, glossary, type BoardExample } from "./glossaryEntries";

function BoardSymbol({ example, skin }: { example: BoardExample; skin: Skin }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const [x, y] = example.center ?? [0, 0];
    drawBoard(ctx, exampleWorld(example), skin, true, 2, {
      x,
      y,
      span: example.span ?? 1.2,
    });
  }, [example, skin]);
  return (
    <canvas
      ref={canvas}
      width={128}
      height={88}
      aria-hidden="true"
      style={{ backgroundColor: skins[skin].field }}
    />
  );
}

export function Glossary({ skin }: { skin: Skin }) {
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase().split(/\s+/);
  const sections = glossary
    .map(({ section, entries }) => ({
      section,
      entries: entries.filter(({ term, meaning }) => {
        const text = (section + " " + term + " " + meaning).toLowerCase();
        return words.every((word) => text.includes(word));
      }),
    }))
    .filter(({ entries }) => entries.length);
  return (
    <div className={styles.glossary}>
      <div className={styles.glossarySearch}>
        <label htmlFor="glossary-search">Find a term or symbol</label>
        <input
          type="search"
          id="glossary-search"
          value={query}
          placeholder="Try “teal ring” or “fuse”"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {sections.map(({ section, entries }) => (
        <section key={section}>
          <h3>{section}</h3>
          <dl>
            {entries.map(({ term, meaning, example, control }) => (
              <div key={term} className={styles.glossaryEntry}>
                <dt>
                  {(example || control) && (
                    <span className={styles.swatch} aria-hidden="true">
                      {example ? (
                        <BoardSymbol example={example} skin={skin} />
                      ) : (
                        control && <ControlIcon action={control} />
                      )}
                    </span>
                  )}
                  {term}
                </dt>
                <dd>{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {!sections.length && (
        <p role="status">
          No matching entries. Try a shape, color, or game term.
        </p>
      )}
    </div>
  );
}
