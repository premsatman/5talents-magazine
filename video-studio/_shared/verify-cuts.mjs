// Re-transcribe a rendered draft and print the words with "||" at each edit cut,
// so clipped or doubled words at cut points are easy to spot.
// usage: node ../_shared/verify-cuts.mjs .review/draft.mp4 CUT1 CUT2 ...   (run inside a project)
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";

const [draft, ...cutArgs] = process.argv.slice(2);
const cuts = cutArgs.map(Number);
mkdirSync(".review/tx", { recursive: true });
execSync(`ffmpeg -v error -y -i ${draft} -vn -ac 1 -ar 16000 .review/tx/draft.wav`);
const cli = `${homedir()}/.claude/plugins/cache/hyperframes/hyperframes/0.8.174/skills/hyperframes/scripts/plugin-cli.mjs`;
const res = JSON.parse(execSync(`node "${cli}" transcribe .review/tx/draft.wav --dir .review/tx --model large-v3 --language hi --json 2>/dev/null`).toString());
const words = JSON.parse(readFileSync(res.transcriptPath, "utf8"));
const list = (Array.isArray(words) ? words : words.words).filter((w) => w.end - w.start > 0.02); // drop zero-length hallucinations
let out = "", ci = 0;
for (const w of list) {
  while (ci < cuts.length && w.start >= cuts[ci] - 0.05) out += ` ||${cuts[ci++]}|| `;
  out += w.text + " ";
}
console.log(out);
