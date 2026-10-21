// Print the audio envelope of assets/footage/seg.mp4 in 20 ms steps between two times,
// to place cuts in the dips between words.  usage: node ../_shared/env.mjs FROM TO [FROM TO ...]
import { execSync } from "node:child_process";
const pcm = execSync(`ffmpeg -v error -i assets/footage/seg.mp4 -vn -ac 1 -ar 1000 -af highpass=f=120 -f s16le -`, { maxBuffer: 1 << 28 });
const args = process.argv.slice(2).map(Number);
for (let i = 0; i < args.length; i += 2) {
  let out = "";
  for (let t = args[i]; t < args[i + 1]; t += 0.02) {
    let m = 0;
    const s = Math.round(t * 1000);
    for (let k = s; k < s + 20; k++) m = Math.max(m, Math.abs(pcm.readInt16LE(k * 2)));
    const lvl = Math.min(9, Math.round(m / 500));
    out += (Math.abs(t * 10 - Math.round(t * 10)) < 0.01 ? `|${t.toFixed(1)}` : "") + " .:-=+*#%@"[lvl];
  }
  console.log(out);
}
