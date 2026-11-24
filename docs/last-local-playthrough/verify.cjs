// Use the same replay assertions and TypeScript configuration as the game suite.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

execFileSync(
  process.execPath,
  [
    require.resolve("jest/bin/jest"),
    "--watchman=false",
    "--runInBand",
    "--runTestsByPath",
    "src/features/clockwerx/__tests__/campaign.test.ts",
    "--testNamePattern=recorded browser",
  ],
  { cwd: path.resolve(__dirname, "../.."), stdio: "inherit" }
);
