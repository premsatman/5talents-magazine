// Print a project's word timings in compact lines plus detected pauses, for picking cut points.
// usage: node ../_shared/words.mjs   (run inside a short's project folder)
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const words = JSON.parse(readFileSync("assets/footage/transcript.json", "utf8"));
const list = Array.isArray(words) ? words : words.words;
let line = "", lineStart = null;
for (const w of list) {
  if (lineStart === null) lineStart = w.start;
  line += `${w.text}(${w.start.toFixed(1)}) `;
  if (/[।?!.]$/.test(w.text) || line.length > 150) { console.log(line); line = ""; lineStart = null; }
}
if (line) console.log(line);
const out = execSync(`ffmpeg -v info -i assets/footage/seg.mp4 -af "highpass=f=120,silencedetect=n=-32dB:d=0.25" -f null - 2>&1 | grep silence_end || true`).toString();
console.log("\npauses (start-end):");
console.log(out.trim().split("\n").map((l) => { const m = l.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/); return m ? `${(m[1] - m[2]).toFixed(2)}-${(+m[1]).toFixed(2)}` : ""; }).join("  "));
