// Shared generator for 5Talents Rewind vertical shorts (HyperFrames).
// Style: Sound Barrier short (video-studio/sb-short) — yellow Bebas headline band, framed media box,
// one-line Hinglish captions, yellow callout chips, blur-whip layout changes, brand end card.
//
// A short's build.mjs calls build(config) and writes index.html next to it.
// All "src" times are seconds into the project's source segment (assets/footage/seg.mp4).
//
// config = {
//   src: "assets/footage/seg_norm.mp4",      // picture + loudness-normalised sound
//   srcB: "assets/footage/seg_broll.mp4",    // same picture, no audio (feeds inset panes)
//   pill, headline: [line1, line2],
//   clips: [{ id, in, out, layout, changes?: [{ at, layout }] }],
//   captions: [[srcFrom, srcTo, "TEXT <b>KEYWORD</b>"]],
//   chips?: [{ id, from, to, html, slot }],   // slot 0 = lowest
//   punches?: [{ at, scale }],                // instant zoom change on the face (comic beats)
//   bands?: { ... }                           // optional marker highlights on a still layout
// }
// layout = { mode: "A", zoom?, cx? }           face fills the box (cx = source x of the face)
//        | { mode: "F", cx?, zoom? }           full source frame (B-roll) covers the box
//        | { mode: "B", rect: {x,y,w,h} }      inset rect from the source frame beside the face
//        | { mode: "S", img, bg?, fit? }       still image; fit "cover" fills the box (default contain)
import { writeFileSync } from "node:fs";

const BOX = { x: 36, y: 420, w: 1008, h: 980 };
const FACE_S = 1.15;
const FACE_TOP = 45; // first visible source row in face mode
const GAP = 12;
const f = (n) => +(+n).toFixed(2);

export function build(cfg, outUrl) {
  const clips = cfg.clips.map((c) => ({ ...c }));
  let t = 0;
  for (const c of clips) { c.t = f(t); c.dur = f(c.out - c.in); t += c.out - c.in; }
  const MAIN_END = f(t);
  const END_DUR = 2.0;
  const TOTAL = f(MAIN_END + END_DUR);
  const at = (src) => {
    const c = clips.find((k) => src >= k.in - 1e-6 && src <= k.out + 1e-6);
    if (!c) throw new Error("src time not inside the edit: " + src);
    return f(c.t + src - c.in);
  };

  // ---- layout events on the timeline --------------------------------------------
  const events = [];
  for (const c of clips) {
    events.push({ t: c.t, layout: c.layout, cut: true, clip: c });
    for (const ch of c.changes || []) events.push({ t: at(ch.at), layout: ch.layout, cut: false, clip: c });
  }
  events.sort((a, b) => a.t - b.t);
  events.forEach((e, i) => { e.end = i + 1 < events.length ? events[i + 1].t : MAIN_END; });

  // panes for B layouts and stills for S layouts (one element per window, static geometry)
  const panes = [];
  const stills = [];
  events.forEach((e, i) => {
    const L = e.layout;
    if (L.mode === "B") {
      const r = L.rect;
      const paneW = Math.max(360, Math.min(520, (r.w / r.h) * BOX.h));
      const k = Math.min(paneW / r.w, BOX.h / r.h);
      const id = `pane${i}`;
      const faceCenter = (GAP + paneW + GAP + (BOX.w - GAP)) / 2;
      panes.push({
        id, e, paneW: f(paneW), k,
        vx: f(-r.x * k + (paneW - r.w * k) / 2), vy: f(-r.y * k + (BOX.h - r.h * k) / 2),
        faceX: f(faceCenter - BOX.w / 2),
      });
      e.pane = id;
    }
    if (L.mode === "S") { const id = `still${i}`; stills.push({ id, e }); e.still = id; }
  });

  // ---- media ------------------------------------------------------------------------
  const fade = (d) => JSON.stringify({ version: 1, lanes: [{ target: "volume", points: [{ t: 0, v: 0 }, { t: 0.03, v: 1 }, { t: f(d - 0.03), v: 1 }, { t: d, v: 0 }] }] });
  const faceVideos = clips.map((c) => `            <video id="${c.id}" class="cam" src="${cfg.src}" data-start="${c.t}" data-duration="${c.dur}" data-media-start="${c.in}" data-track-index="0" playsinline data-has-audio="true" data-automation='${fade(c.dur)}'></video>`).join("\n");
  // a time exactly on a cut belongs to the clip that starts there
  const srcAt = (tl) => { const c = clips.find((k) => tl >= k.t - 1e-6 && tl < k.t + k.dur - 1e-6) || clips[clips.length - 1]; return f(c.in + (tl - c.t)); };
  const paneHtml = panes.map((p) => {
    const e = p.e;
    return `        <div id="${p.id}" class="pane" style="width:${f(p.paneW + GAP * 2)}px">
          <div class="panein" style="left:${GAP}px;width:${p.paneW}px"><div class="panecam" data-layout-allow-overflow style="transform:translate(${p.vx}px,${p.vy}px) scale(${f(p.k)})">
            <video id="${p.id}v" class="cam" src="${cfg.srcB}" data-start="${e.t}" data-duration="${f(e.end - e.t)}" data-media-start="${srcAt(e.t)}" data-track-index="1" playsinline muted></video>
          </div></div>
        </div>`;
  }).join("\n");
  const stillHtml = stills.map((s) => {
    const L = s.e.layout;
    return `        <div id="${s.id}" class="clip stillpane" data-start="${s.e.t}" data-duration="${f(s.e.end - s.e.t)}" data-track-index="3">
          ${L.bg ? `<img class="stillbg" src="${L.bg}" alt="" data-layout-allow-overflow />` : ""}
          <div class="stillblur"><div class="stillzoom"><img class="stillimg" src="${L.img}" alt="${L.alt || ""}"${L.fit === "cover" ? ' style="object-fit:cover"' : ""} /></div></div>
        </div>`;
  }).join("\n");

  const caps = cfg.captions.map(([a, b, txt], i) => {
    const s = at(a), e = at(b);
    return `    <div id="cap${i}" class="clip cap" data-start="${s}" data-duration="${f(e - s)}" data-track-index="5"><span class="capin">${txt.replace(/<b>/g, '<span class="kw">').replace(/<\/b>/g, "</span>")}</span></div>`;
  }).join("\n");
  const chips = (cfg.chips || []).map((c) => {
    const s = at(c.from), e = at(c.to);
    return `        <div id="${c.id}" class="clip chipwrap" data-start="${s}" data-duration="${f(e - s)}" data-track-index="4" style="bottom:${40 + (c.slot || 0) * 88}px;${c.right ? "left:auto;right:28px;text-align:right;" : ""}"><div class="chip">${c.html}</div></div>`;
  }).join("\n");

  // ---- timeline -----------------------------------------------------------------------
  const js = [];
  const faceSet = (L) => {
    if (L.mode === "F") {
      const s = (L.zoom || 1) * Math.max(BOX.w / 1920, BOX.h / 1080);
      const cx = L.cx ?? 960, cy = L.cy ?? 540;
      return { x: f(BOX.w / 2 - cx * s), y: f(BOX.h / 2 - cy * s), scale: f(s) };
    }
    const s = FACE_S;
    const cx = L.cx ?? 860;
    return { x: f(BOX.w / 2 - cx * s), y: f(-FACE_TOP * s), scale: s };
  };
  const whooshAt = [];
  let prevMode = null;
  for (const e of events) {
    const L = e.layout;
    const fs = faceSet(L.mode === "B" || L.mode === "S" ? { mode: "A", cx: L.cx } : L);
    js.push(`tl.set("#facecam", ${JSON.stringify(fs)}, ${e.t});`);
    js.push(`tl.set("#facezoom", { scale: ${L.mode === "A" ? L.zoom || 1 : 1} }, ${e.t});`);
    const p = panes.find((q) => q.e === e);
    js.push(`tl.set("#facepane", { x: ${p ? p.faceX : 0} }, ${e.t});`);
    for (const q of panes) js.push(`tl.set("#${q.id}", { opacity: ${q.e === e ? 1 : 0} }, ${e.t});`);
    const changed = prevMode !== null && (L.mode !== prevMode || L.mode === "B" || L.mode === "F" || L.mode === "S");
    if (changed) {
      whooshAt.push(e.t);
      if (p) js.push(`tl.fromTo("#${p.id} .panein", { filter: "blur(14px)", x: -90, skewX: -6, opacity: 0 }, { filter: "blur(0px)", x: 0, skewX: 0, opacity: 1, duration: 0.34, ease: "power3.out" }, ${e.t});`);
      else if (e.still) js.push(`tl.fromTo("#${e.still} .stillblur", { filter: "blur(16px)", x: 90, skewX: 5 }, { filter: "blur(0px)", x: 0, skewX: 0, duration: 0.3, ease: "power3.out" }, ${e.t});`);
      else js.push(`tl.fromTo("#faceblur", { filter: "blur(12px)", x: 60, skewX: 4 }, { filter: "blur(0px)", x: 0, skewX: 0, duration: 0.24, ease: "power3.out", immediateRender: false }, ${e.t});`);
    }
    prevMode = L.mode;
  }
  for (const pu of cfg.punches || []) js.push(`tl.set("#facezoom", { scale: ${pu.scale} }, ${at(pu.at)});`);
  for (const b of cfg.bandsJs ? cfg.bandsJs(at) : []) js.push(b);
  cfg.captions.forEach(([a], i) => js.push(`tl.fromTo("#cap${i} .capin", { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "back.out(2)" }, ${at(a)});`));
  (cfg.chips || []).forEach((c) => js.push(`tl.fromTo("#${c.id} .chip", { x: ${c.right ? 60 : -60}, opacity: 0, filter: "blur(8px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }, ${at(c.from)});`));
  js.push(`tl.fromTo("#endin", { filter: "blur(18px)", scale: 1.06, opacity: 0 }, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" }, ${MAIN_END});`);
  whooshAt.push(MAIN_END);
  const whoosh = whooshAt.map((w, i) => `    <audio id="wh${i}" src="assets/audio/whoosh.wav" data-start="${f(Math.max(0, w - 0.18))}" data-duration="0.42" data-track-index="7" data-volume="0.3"></audio>`).join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <!-- generated by build.mjs via ../_shared/short-engine.mjs; edit the config, not this file -->
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
      #headline { position: absolute; top: 140px; left: 40px; right: 40px; text-align: center; font-family: "Bebas Neue"; font-size: ${cfg.headlineSize || 132}px; line-height: 0.93; letter-spacing: 0.005em; }
      #headline .l1 { display: block; color: var(--paper); }
      #headline .l2 { display: block; color: var(--yellow); }
      #box { position: absolute; left: ${BOX.x}px; top: ${BOX.y}px; width: ${BOX.w}px; height: ${BOX.h}px; overflow: hidden; border-radius: 30px; background: #1b1714; }
      #facepane { position: absolute; top: 0; left: 0; width: ${BOX.w}px; height: ${BOX.h}px; overflow: hidden; border-radius: 22px; }
      #faceblur, #facezoom { position: absolute; inset: 0; }
      #facezoom { transform-origin: 50% 39%; }
      #facecam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; }
      video.cam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: fill; }
      .pane { position: absolute; top: 0; left: 0; height: ${BOX.h}px; opacity: 0; background: #1b1714; }
      .panein { position: absolute; top: 0; height: ${BOX.h}px; overflow: hidden; border-radius: 22px; background: #0c0b0a; }
      .panecam { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; transform-origin: 0 0; }
      .stillpane { position: absolute; inset: 0; background: #14110f; overflow: hidden; }
      .stillbg { position: absolute; inset: -60px; width: calc(100% + 120px); height: calc(100% + 120px); object-fit: cover; }
      .stillblur, .stillzoom { position: absolute; inset: 0; }
      .stillimg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
      .chipwrap { position: absolute; left: 28px; width: 760px; height: 80px; }
      .chip { display: inline-flex; align-items: center; gap: 14px; background: var(--yellow); color: var(--ink); font-family: "Bebas Neue"; font-size: 58px; line-height: 1; padding: 12px 22px 8px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.45); }
      .chip svg { width: 40px; height: 40px; margin-top: -6px; }
      .chip svg.arr { width: 46px; height: 28px; margin-top: -4px; }
      .cap { position: absolute; left: 90px; right: 90px; top: 1430px; height: 150px; display: flex; justify-content: center; align-items: flex-start; text-align: center; }
      .capin { display: block; text-wrap: balance; max-width: 900px; font-family: "Bebas Neue"; font-size: 80px; line-height: 0.98; color: var(--paper); text-shadow: 0 4px 0 rgba(0,0,0,0.6); }
      .capin .kw { color: var(--yellow); }
      #endcard, #endin { position: absolute; inset: 0; }
      #endin img { width: 100%; height: 100%; }
${cfg.extraCss || ""}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1080" data-height="1920">
      <div id="glow"></div>
      <div id="pill"><span>${cfg.pill}</span></div>
      <h1 id="headline"><span class="l1">${cfg.headline[0]}</span><span class="l2">${cfg.headline[1]}</span></h1>
      <div id="box">
        <div id="facepane" data-layout-allow-overflow>
          <div id="faceblur"><div id="facezoom"><div id="facecam">
${faceVideos}
          </div></div></div>
        </div>
${paneHtml}
${stillHtml}
${chips}
      </div>
${caps}
      <div id="endcard" class="clip" data-start="${MAIN_END}" data-duration="${END_DUR}" data-track-index="8"><div id="endin"><img src="assets/brand/endcard.png" alt="5Talents Rewind #1 full episode" /></div></div>
    <audio id="hit" src="assets/audio/hit.mp3" data-start="0" data-duration="2.15" data-track-index="6" data-volume="0.35"></audio>
    <audio id="rewind" src="assets/audio/rewind.mp3" data-start="${MAIN_END}" data-duration="1.6" data-track-index="6" data-volume="0.6"></audio>
${whoosh}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${js.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
  writeFileSync(new URL("./index.html", outUrl), html);
  console.log(clips.map((c) => `${c.id}@${c.t}+${c.dur}`).join(" "), "| total", TOTAL);
  return { clips, at, TOTAL };
}

// Common chip icons
export const TICK = `<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const ARROW = `<svg class="arr" viewBox="0 0 40 24"><path d="M2 12h30M24 4l10 8-10 8" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
