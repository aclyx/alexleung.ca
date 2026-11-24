// The first line fits the reading strip. The menu has room for the full lesson.
export const tutorialNotes: Readonly<
  Record<number, readonly string[] | undefined>
> = {
  1: [
    "Hold Swing to grab the next peg.",
    "Your first move starts the clock. Guide the gold hand to the diamond. Gold rings mark bonus pegs.",
    "Watch the three hands below the starting row. Red shows Swing, green shows Flip, and blue shows Bounce. Reverse turns your hand back immediately.",
  ],
  2: [
    "Keep the whole hand clear of spikes.",
    "Enemy hands can pass through spikes. Leave room for both as you approach the diamond.",
  ],
  3: [
    "Let a wall turn your hand back.",
    "Grab a peg near the end of a wall to work your way around it. Flip keeps you turning in the same direction after the grab.",
  ],
  4: [
    "Sweep a switch to move its matching door.",
    "The green hand can operate the green door. Watch it before you cross the opening.",
  ],
  5: [
    "Leave your peg before the oil reaches it.",
    "An oil glob sleeps until your hand sweeps close. Once awake, it follows you from peg to peg.",
  ],
  6: [
    "Go around the spikes between the walls.",
    "Check where the wall will turn your hand back. Leave enough room for the return swing.",
  ],
  7: [
    "Flip above the first spike, then pass below the next.",
    "Wait for the green hand to pass before grabbing the peg on its far side. There are bonus pegs beyond the diamond.",
  ],
  8: [
    "Each switch toggles its matching door.",
    "Check the three center doors before crossing. Sweep a switch again to move its door back.",
  ],
  9: [
    "A ring peg disappears when you leave it.",
    "A safe peg protects you from enemy hands. A lit checkpoint is where you restart after a miss. Checkpoints are available through Medium difficulty.",
  ],
  10: [
    "Light the fuse and move clear of the spark.",
    "Sweep the small gold diamond to start the fuse. The spark travels to the bomb. Gold hourglasses give you extra time and points.",
  ],
};
