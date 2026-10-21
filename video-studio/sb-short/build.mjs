// Generates index.html for the Sound Barrier short.
// Source: assets/footage/ep01_360-420.mp4 = Ep01 06:00-07:00 (a re-encoded copy; the original is untouched).
// Every time below in "src" seconds is relative to that segment.  Run: node build.mjs
import { writeFileSync } from "node:fs";

const SRC = "assets/footage/ep01_360-420_norm.mp4"; // same picture, audio loudness-normalised to -14 LUFS
const STILL = "assets/images/phone_discover_date.png";
const PHONE_SRC = "assets/footage/ep01_360-420_phone.mp4"; // phone screen pre-cropped from SRC (x1388 y78 464x964)
const STILL_BG = "assets/images/phone_discover_bg.jpg";

// ---- Edit decision list ------------------------------------------------------
// mode A = face fills the frame, B = phone screen + face side by side, C = phone still (proof)
const CLIPS = [
  { id: "c1", in: 28.62, out: 32.9, mode: "A", zoom: 1.08 }, // cold-open hook: "pehli baar ... HR se milna hoga"
  { id: "c2", in: 10.3, out: 15.3, mode: "C", zoom: 1.0 }, // "ab aapko plan banana padega: 31 Oct, Gachibowli"
  { id: "c3", in: 15.45, out: 21.32, mode: "A", zoom: 1.0, toB: 16.65 }, // Sound Barrier, ticket 399 (phone lands at 16.65)
  { id: "c4", in: 22.15, out: 28.01, mode: "A", zoom: 1.05 }, // twist: job fair before worship
  { id: "c5", in: 33.7, out: 36.45, mode: "B", zoom: 1.0 }, // lunch with industry leaders (speaker pages)
  { id: "c6", in: 37.15, out: 40.85, mode: "A", zoom: 1.12 }, // seedha sawaal
  { id: "c7", in: 41.06, out: 50.34, mode: "A", zoom: 1.0 }, // volunteer got a job offer; resume + questions
  { id: "c8", in: 51.2, out: 54.95, mode: "B", zoom: 1.0 }, // register: link in comments (register page)
];
let t = 0;
for (const c of CLIPS) { c.t = +t.toFixed(3); c.dur = +(c.out - c.in).toFixed(3); t += c.dur; }
const MAIN_END = +t.toFixed(3);
const END_DUR = 2.0;
const TOTAL = +(MAIN_END + END_DUR).toFixed(3);
const at = (src) => {
  const c = CLIPS.find((k) => src >= k.in - 1e-6 && src <= k.out + 1e-6);
  if (!c) throw new Error("src time not in edit: " + src);
  return +(c.t + src - c.in).toFixed(3);
};

// ---- Captions (Hinglish, from the episode script; keyword = yellow) -------------
const CAPS = [
  [28.7, 30.26, "PEHLI BAAR KISI CHURCH EVENT"],
  [30.26, 31.42, "SE PEHLE AAPKO"],
  [31.42, 32.9, "<b>HR</b> SE MILNA HOGA!"],
  [10.3, 12.28, "AB AAPKO PLAN BANANA PADEGA:"],
  [12.28, 13.27, "<b>31 OCTOBER</b>,"],
  [13.27, 15.3, "GACHIBOWLI INDOOR STADIUM"],
  [15.45, 16.85, "THE MIGHTY DREAMS KA"],
  [16.85, 18.94, "<b>SOUND BARRIER</b> CONFERENCE"],
  [18.94, 19.88, "HONE WALA HAI."],
  [19.88, 21.32, "TICKET HAI <b>RS. 399</b>"],
  [22.15, 23.16, "TWIST YEH HAI KI"],
  [23.16, 24.8, "WORSHIP TAK PAHUNCHNE KE LIYE"],
  [24.8, 26.39, "AAPKO <b>JOB FAIR</b>"],
  [26.39, 28.01, "SE HOKE GUZARNA PADEGA!"],
  [33.7, 35.2, "LUNCH MEIN INDUSTRY KE LEADERS"],
  [35.2, 36.45, "TABLE PE BAITHE HONGE"],
  [37.15, 38.74, "AUR JAAKE AAP SEEDHA"],
  [38.74, 40.85, "<b>SAWAAL</b> POOCH SAKTE HAIN"],
  [41.1, 42.5, "PICHHLE SAAL EK SOCIAL MEDIA"],
  [42.5, 43.91, "<b>VOLUNTEER</b> KO WAHIN PE"],
  [43.91, 45.33, "<b>JOB OFFER</b> MIL GAYA!"],
  [45.33, 46.6, "<b>VOLUNTEER</b> KO!"],
  [46.6, 48.42, "TOH <b>RESUME</b> LEKE JAANA,"],
  [48.42, 50.34, "LEKIN <b>SAWAAL</b> POOCHNA!"],
  [51.2, 52.56, "REGISTER KARNE KE LIYE"],
  [52.56, 54.95, "COMMENT PE <b>LINK</b> DEKH SAKTE HAIN"],
];

// ---- Geometry -----------------------------------------------------------------
const BOX = { x: 36, y: 420, w: 1008, h: 980 };
const S = 1.15; // face scale
const FACE = { cx: 860, top: 45 }; // source face centre x, first visible source row
const SP = BOX.h / 964; // phone scale: source phone rows 78..1042 fill the box height
const PH = { x: 1388, y: 78, w: 464 };
const PANE_W = +(PH.w * SP).toFixed(1);
const GAP = 12;
const FACE_B_LEFT = +(GAP + PANE_W + GAP).toFixed(1);
const FACE_B_W = +(BOX.w - FACE_B_LEFT - GAP).toFixed(1);
const FACE_B_X = +(FACE_B_LEFT + FACE_B_W / 2 - BOX.w / 2).toFixed(1); // shift that centres the face in the right column
const STILL_SCALE = BOX.h / 964;
const STILL_W = +(464 * STILL_SCALE).toFixed(1);

const f = (n) => +n.toFixed(2);
const fade = (d) =>
  JSON.stringify({ version: 1, lanes: [{ target: "volume", points: [{ t: 0, v: 0 }, { t: 0.03, v: 1 }, { t: f(d - 0.03), v: 1 }, { t: d, v: 0 }] }] });

// Face videos (carry the sound)
const faceVideos = CLIPS.map(
  (c) => `          <video id="${c.id}" class="cam" src="${SRC}" data-start="${c.t}" data-duration="${c.dur}" data-media-start="${c.in}" data-track-index="0" playsinline data-has-audio="true" data-automation='${fade(c.dur)}'></video>`,
).join("\n");

// Phone-screen copies (muted) for B windows
const bWindows = [];
for (const c of CLIPS) {
  if (c.mode === "B") bWindows.push({ id: c.id + "p", start: c.t, dur: c.dur, media: c.in, from: c.t });
  if (c.toB) bWindows.push({ id: c.id + "p", start: at(c.toB), dur: f(c.t + c.dur - at(c.toB)), media: c.toB, from: at(c.toB) });
}
const phoneVideos = bWindows
  .map((w) => `          <video id="${w.id}" class="cam" src="${PHONE_SRC}" data-start="${w.start}" data-duration="${w.dur}" data-media-start="${w.media}" data-track-index="1" playsinline muted></video>`)
  .join("\n");

const capsHtml = CAPS.map(([a, b, txt], i) => {
  const s = at(a), e = at(b);
  return `    <div id="cap${i}" class="clip cap" data-start="${s}" data-duration="${f(e - s)}" data-track-index="5"><span class="capin">${txt.replace(/<b>/g, '<span class="kw">').replace(/<\/b>/g, "</span>")}</span></div>`;
}).join("\n");

// Callout chips (inside the box, lower-left: over the desk/torso, never the face)
const CHIPS = [
  { id: "chipjob", from: 25.33, to: 28.01, html: `JOB FAIR <svg class="arr" viewBox="0 0 40 24"><path d="M2 12h30M24 4l10 8-10 8" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg> WORSHIP` },
  { id: "chipres", from: 46.84, to: 50.34, html: `<svg class="tick" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>RESUME` },
  { id: "chipq", from: 49.17, to: 50.34, html: `<svg class="tick" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>SAWAAL` },
];
const chipsHtml = CHIPS.map((c, i) => {
  const s = at(c.from), e = at(c.to);
  const bottom = c.id === "chipq" ? 40 : c.id === "chipres" ? 128 : 40;
  return `      <div id="${c.id}" class="clip chipwrap" data-start="${s}" data-duration="${f(e - s)}" data-track-index="4" style="bottom:${bottom}px"><div class="chip">${c.html}</div></div>`;
}).join("\n");

// Whoosh on each layout change (reference: blur-whip cutaways)
const c2 = CLIPS[1], c3 = CLIPS[2], c4 = CLIPS[3], c5 = CLIPS[4], c6 = CLIPS[5], c8 = CLIPS[7];
const tB3 = at(c3.toB);
const WHOOSH = [c2.t, c3.t, tB3, c4.t, c5.t, c6.t, c8.t, MAIN_END];
const whooshHtml = WHOOSH.map((w, i) => `    <audio id="wh${i}" src="assets/audio/whoosh.wav" data-start="${f(Math.max(0, w - 0.18))}" data-duration="0.42" data-track-index="7" data-volume="0.3"></audio>`).join("\n");

// ---- Timeline script ------------------------------------------------------------
const js = [];
const modeA = (time) => js.push(`tl.set("#facepane", { x: 0 }, ${time}); tl.set("#phonepane", { opacity: 0 }, ${time});`);
const modeB = (time, animate) => {
  if (animate) {
    js.push(`tl.fromTo("#facepane", { x: 0 }, { x: ${FACE_B_X}, duration: 0.38, ease: "power3.inOut", immediateRender: false }, ${time});`);
  } else {
    js.push(`tl.set("#facepane", { x: ${FACE_B_X} }, ${time});`);
  }
  js.push(`tl.set("#phonepane", { opacity: 1 }, ${time});`);
  js.push(`tl.fromTo("#phoneblur", { filter: "blur(14px)", x: -90, skewX: -6, opacity: 0 }, { filter: "blur(0px)", x: 0, skewX: 0, opacity: 1, duration: 0.34, ease: "power3.out", immediateRender: false }, ${time});`);
};
const faceFlash = (time) => js.push(`tl.fromTo("#faceblur", { filter: "blur(12px)", x: 60, skewX: 4 }, { filter: "blur(0px)", x: 0, skewX: 0, duration: 0.24, ease: "power3.out", immediateRender: false }, ${time});`);

for (const c of CLIPS) {
  js.push(`tl.set("#facezoom", { scale: ${c.zoom} }, ${c.t});`);
  if (c.mode === "A" || c.mode === "C") modeA(c.t);
  if (c.mode === "B") modeB(c.t, false);
}
// transitions into face shots after a layout change
faceFlash(c3.t); faceFlash(c4.t); faceFlash(c6.t);
modeB(tB3, true);
// punch-in on the comic beat "volunteer ko!" and release on "toh resume"
js.push(`tl.set("#facezoom", { scale: 1.15 }, ${at(45.33)}); tl.set("#facezoom", { scale: 1.0 }, ${at(46.6)});`);

// still zoom origin: centre of the date/venue text block (still px 140,820)
const ZO = { x: f(140 * STILL_SCALE), y: f(820 * STILL_SCALE) };
// Mode C: phone still of the conference page, zoom to date/venue, marker sweeps
const zoomT = at(12.28);
js.push(`tl.fromTo("#stillblur", { filter: "blur(16px)", x: 90, skewX: 5 }, { filter: "blur(0px)", x: 0, skewX: 0, duration: 0.3, ease: "power3.out" }, ${c2.t});`);
js.push(`tl.fromTo("#stillzoom", { scale: 1, x: 0, y: 0 }, { scale: 2.15, x: ${f(BOX.w / 2 - ((BOX.w - STILL_W) / 2 + ZO.x))}, y: -330, duration: 0.7, ease: "power2.inOut" }, ${f(zoomT - 0.35)});`);
js.push(`tl.fromTo(".hl1", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${f(zoomT + 0.3)});`);
js.push(`tl.fromTo(".hl2", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${at(13.3)});`);
js.push(`tl.fromTo(".hl3", { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "power2.out" }, ${f(at(13.3) + 0.25)});`);

// Ticket price proof on the live phone: punch into the nav bar and ring "REGISTER NOW - RS. 399"
const t399 = at(19.9);
js.push(`tl.fromTo("#phonezoom", { scale: 1 }, { scale: 1.75, duration: 0.35, ease: "power2.out" }, ${f(t399 - 0.1)});`);
js.push(`tl.fromTo("#ring399", { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, ${f(t399 + 0.2)});`);
js.push(`tl.to("#phonezoom", { scale: 1, duration: 0.3, ease: "power2.inOut" }, ${f(c3.t + c3.dur - 0.32)});`);
js.push(`tl.set("#ring399", { opacity: 0 }, ${f(c3.t + c3.dur)});`);

// caption pop-ins
CAPS.forEach(([a], i) => js.push(`tl.fromTo("#cap${i} .capin", { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(2)" }, ${at(a)});`));
// chips slide in
CHIPS.forEach((c) => js.push(`tl.fromTo("#${c.id} .chip", { x: -60, opacity: 0, filter: "blur(8px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, ${at(c.from)});`));
// end card
js.push(`tl.fromTo("#endin", { filter: "blur(18px)", scale: 1.06, opacity: 0 }, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" }, ${MAIN_END});`);

// ---- Marker band rectangles on the still (image px -> box px) --------------------
const band = (cls, x0, y0, x1, y1) => {
  const k = STILL_SCALE;
  const st = `left:${f(x0 * k)}px;top:${f(y0 * k)}px;width:${f((x1 - x0) * k)}px;height:${f((y1 - y0) * k)}px`;
  return `<div class="hl ${cls} inv" style="${st}"></div><div class="hl ${cls} mul" style="${st}"></div>`;
};
// text rows in the still (464x964): "31ST OCTOBER 2026" y794-808, "GACHIBOWLI INDOOR" y813-827, "STADIUM" y832-846, x from 52
const bands = [band("hl1", 48, 791, 229, 811), band("hl2", 48, 811, 239, 830), band("hl3", 48, 830, 129, 849)].join("\n              ");

const ring = { x: f((1652 - PH.x) * SP - 10), y: f((150 - PH.y) * SP - 7), w: f(180 * SP + 20), h: f(16 * SP + 14) };
const phoneOrigin = { x: PANE_W, y: f((158 - PH.y) * SP) }; // grow from the right edge so the nav-bar price stays in frame

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Bebas Neue"; src: url("assets/fonts/BebasNeue-Regular.ttf") format("truetype"); font-weight: 400; }
      :root { --ink: #0f0d0c; --paper: #f5f2e8; --yellow: #fde50b; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: var(--ink); }
      #root { width: 100%; height: 100%; position: relative; background: var(--ink); font-family: Montserrat, sans-serif; color: var(--paper); }
      #glow { position: absolute; left: -200px; right: -200px; top: 260px; height: 1300px; background: radial-gradient(closest-side, rgba(253,229,11,0.07), rgba(253,229,11,0) 70%); }
      #pill { position: absolute; top: 92px; left: 0; right: 0; display: flex; justify-content: center; }
      #pill span { font-weight: 700; font-size: 26px; letter-spacing: 0.32em; color: var(--yellow); }
      #headline { position: absolute; top: 140px; left: 40px; right: 40px; text-align: center; font-family: "Bebas Neue"; font-size: 132px; line-height: 0.93; letter-spacing: 0.005em; }
      #headline .l1 { display: block; color: var(--paper); }
      #headline .l2 { display: block; color: var(--yellow); }
      #box { position: absolute; left: ${BOX.x}px; top: ${BOX.y}px; width: ${BOX.w}px; height: ${BOX.h}px; overflow: hidden; border-radius: 30px; background: #1b1714; }
      #facepane { position: absolute; top: 0; left: 0; width: ${BOX.w}px; height: ${BOX.h}px; overflow: hidden; border-radius: 22px; }
      #faceblur, #facezoom { position: absolute; inset: 0; }
      #facezoom { transform-origin: 50% 39%; }
      #facecam { position: absolute; width: ${f(1920 * S)}px; height: ${f(1080 * S)}px; left: calc(50% - ${f(FACE.cx * S)}px); top: ${f(-FACE.top * S)}px; }
      #facecam video.cam, #phonecam video.cam { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; }
      #phonepane { position: absolute; top: 0; left: 0; width: ${FACE_B_LEFT}px; height: ${BOX.h}px; opacity: 0; background: #1b1714; }
      #phoneblur { position: absolute; top: 0; left: ${GAP}px; width: ${PANE_W}px; height: ${BOX.h}px; overflow: hidden; border-radius: 22px; background: #111; }
      #phonezoom { position: absolute; inset: 0; }
      #phonezoom { transform-origin: ${phoneOrigin.x}px ${phoneOrigin.y}px; }
      #phonecam { position: absolute; left: 0; top: 0; width: ${PANE_W}px; height: ${BOX.h}px; }
      #ring399 { position: absolute; left: ${ring.x}px; top: ${ring.y}px; width: ${ring.w}px; height: ${ring.h}px; border: 4px solid var(--yellow); border-radius: 10px; box-shadow: 0 0 0 3px rgba(0,0,0,0.55); opacity: 0; }
      #stillpane { position: absolute; inset: 0; background: #14110f; overflow: hidden; }
      #stillbg { position: absolute; inset: -60px; width: calc(100% + 120px); height: calc(100% + 120px); object-fit: cover; }
      #stillblur { position: absolute; inset: 0; }
      #stillzoom { position: absolute; top: 0; left: ${f((BOX.w - STILL_W) / 2)}px; width: ${STILL_W}px; height: ${BOX.h}px; transform-origin: ${ZO.x}px ${ZO.y}px; }
      #stillzoom img { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 18px; }
      .hl { position: absolute; transform-origin: left center; }
      .hl.inv { background: #fff; mix-blend-mode: difference; }
      .hl.mul { background: var(--yellow); mix-blend-mode: multiply; }
      .chipwrap { position: absolute; left: 28px; width: 640px; height: 80px; }
      .chip { display: inline-flex; align-items: center; gap: 14px; background: var(--yellow); color: var(--ink); font-family: "Bebas Neue"; font-size: 58px; line-height: 1; padding: 12px 22px 8px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.45); }
      .chip svg.arr { width: 46px; height: 28px; margin-top: -4px; }
      .chip svg.tick { width: 40px; height: 40px; margin-top: -6px; }
      .cap { position: absolute; left: 90px; right: 90px; top: 1430px; height: 150px; display: flex; justify-content: center; align-items: flex-start; text-align: center; }
      .capin { display: block; font-family: "Bebas Neue"; font-size: 80px; line-height: 0.98; color: var(--paper); text-shadow: 0 4px 0 rgba(0,0,0,0.6); }
      .capin .kw { color: var(--yellow); }
      #endcard { position: absolute; inset: 0; }
      #endin { position: absolute; inset: 0; }
      #endin img { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
      <div id="glow"></div>
      <div id="pill"><span>5TALENTS REWIND · HYDERABAD</span></div>
      <h1 id="headline"><span class="l1">PEHLE HR,</span><span class="l2">PHIR WORSHIP!</span></h1>
      <div id="box">
        <div id="facepane" data-layout-allow-overflow>
          <div id="faceblur"><div id="facezoom"><div id="facecam">
${faceVideos}
          </div></div></div>
        </div>
        <div id="phonepane">
          <div id="phoneblur"><div id="phonezoom"><div id="phonecam">
${phoneVideos}
            <div id="ring399"></div>
          </div></div></div>
        </div>
        <div id="stillpane" class="clip" data-start="${c2.t}" data-duration="${c2.dur}" data-track-index="3">
          <img id="stillbg" src="${STILL_BG}" alt="" data-layout-allow-overflow />
          <div id="stillblur">
            <div id="stillzoom">
              <img src="${STILL}" alt="tmdconference.com page: 31st October 2026, Gachibowli Indoor Stadium, Hyderabad" />
              ${bands}
            </div>
          </div>
        </div>
${chipsHtml}
      </div>
${capsHtml}
      <div id="endcard" class="clip" data-start="${MAIN_END}" data-duration="${END_DUR}" data-track-index="8"><div id="endin"><img src="assets/brand/endcard.png" alt="5Talents Rewind #1 full episode" /></div></div>
    <audio id="hit" src="assets/audio/hit.mp3" data-start="0" data-duration="2.15" data-track-index="6" data-volume="0.35"></audio>
    <audio id="rewind" src="assets/audio/rewind.mp3" data-start="${MAIN_END}" data-duration="1.6" data-track-index="6" data-volume="0.6"></audio>
${whooshHtml}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("clips", CLIPS.map((c) => `${c.id}@${c.t}+${c.dur}`).join(" "), "| total", TOTAL);
