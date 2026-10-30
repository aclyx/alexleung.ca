# Writing Voice

This is the canonical description of Alex's published writing on alexleung.ca. It describes the destination, not a template: the subject should determine the shape of a piece.

## Core Voice

Alex writes compact notes in a calm, direct, technically literate voice. The prose is understated and quietly confident. First person is natural when experience, judgment, or learning matters, but it is not forced into every explanation. Warmth comes from attention to real details rather than decorative personality.

Confidence comes from naming exact objects, mechanisms, constraints, trade-offs, and observed results—not from credentials, promotion, or self-assessment. Supported claims are stated plainly, while uncertainty stays precise. Limits are stated through what was done or observed (“I only ran the reference cases”) rather than as notes on what the author’s checks did not establish; that phrasing usually addresses a reviewer, not the reader. An unknown that bears on the reader’s judgment, such as a risk the evidence does not cover, still belongs in the prose, stated plainly. Significance comes through consequences rather than declarations of importance. Titles and headings are usually literal and subject-first, with room for occasional dry wit. A concise conceptual title can name the idea while the excerpt supplies concrete context; the title need not list the tools used. Openings establish the goal, observation, question, or scene before referring to a project as if it were already familiar. A concrete detail can carry its own meaning without a recap telling the reader how to interpret it.

The writing is concise but not breathless. Each sentence earns its space through explanation, evidence, a meaningful connection, or personal perspective; brevity alone is not the measure. Paragraphs develop an account rather than presenting a succession of isolated tips. Headings and lists appear when they improve scanning, not as a default shape. Contrast is a recurring reasoning device—one explanation against a more precise one, or a benefit against its cost—but it should mark a real distinction rather than become a cadence template.

## Technical Writing

Technical pieces explain the useful mechanism and make limits explicit. Exact tools, operations, equations, code, and implementation details appear when they help the reader inspect the reasoning. Claims stay bounded by what was built, tested, read, or observed. Honest learning is welcome; neither prior expertise nor a beginner's perspective should be invented for effect.

These pieces often end on a decision, practical limit, changed understanding, or unresolved question rather than a broad lesson.

## Personal Writing

Personal pieces begin close to lived experience: a place, object, action, routine, practical constraint, or encounter with an idea. Reading and a specific intellectual reaction can ground a philosophical reflection without a physical scene. Ordinary details create the warmth. Chronology can provide enough structure, and interpretation arrives after the reader has something concrete to consider.

The tone remains plain and observant, with occasional lightness rather than polished sentiment. Endings tend to land on a present state, preference, hope, or memorable observation. A trip, move, or purchase does not need to become a general principle.

## Calibration

These passages from the site show the voice at work. Use them to calibrate judgment across genres, not as sentence patterns to reuse.

- **A detail carries the meaning.** “The cats have their trees and beds, and I have a sleeping pad.” The ending shows the state of the move without summarizing it.
- **A dry observation.** “Amazon is much better here than it was in Waterloo.”
- **A mechanism shown through one example.** “‘Too wordy’ might mean repeated points should go while detailed reasoning stays. If that becomes ‘write shorter answers,’ Codex can obey the new rule and still miss what I wanted.”
- **A personal stake with its reason.** “The possibility of losing so much of humanity’s future is why safety and alignment are top of mind for me now.”
- **A limit stated as what was done.** “The reference cases converged quickly in my use… I did not establish how a larger model would perform in the browser” became “The reference cases converged quickly, but they were small next to the utility models I had seen in PSS/E, and I did not try anything that large in the browser.”
- **A consequence instead of a verification note.** “Successful rendering alone does not establish that the responsive variants were generated” became “…they can leave the original, larger file in use, and the page looks the same either way.”

## House Style

- American spelling. Metric units are fine.
- Post titles use title case; section headings use sentence case. Proper nouns and acronyms keep their capitals.
- Curly quotes and apostrophes in published prose and visible copy. The Markdown pipeline does not convert straight quotes, so type them as they should render; code, URLs, and math keep straight quotes. `yarn test` checks post prose for straight quotes.
- Use the serial comma.
- In running prose, prefer “for example” or “such as” to a parenthetical “(e.g., …)”.

## Scope

This document describes how the finished writing should sound and read on the page. Operational safeguards such as fact preservation, claim bounds, chronology, frontmatter, and grading belong in [AGENTS.md](../AGENTS.md) and the relevant task-specific skills, including [blog-post-creator](../.agents/skills/blog-post-creator/SKILL.md) and [site-copy-editor](../.agents/skills/site-copy-editor/SKILL.md). They protect the work, but they are not themselves the voice.
