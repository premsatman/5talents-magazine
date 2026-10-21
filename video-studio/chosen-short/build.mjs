// Short #2 "The Chosen khatam... spoiler alert" — Ep01 00:20-01:35 (assets/footage/seg.mp4 starts at 20s).
// Run: node build.mjs   (engine: ../_shared/short-engine.mjs)
import { build } from "../_shared/short-engine.mjs";

const PHONE = { x: 1396, y: 90, w: 416, h: 900 };   // phone screen-recording inset (Instagram / thechosentv.in)
const ROUMIE = { x: 1400, y: 380, w: 464, h: 620 }; // Jonathan Roumie name card inset

build({
  src: "assets/footage/seg_norm.mp4",
  srcB: "assets/footage/seg_broll.mp4",
  pill: "5TALENTS REWIND · THE CHOSEN",
  headline: ["THE CHOSEN KHATAM…", "SPOILER ALERT!"],
  headlineSize: 124,
  clips: [
    // hook: shooting is over (Dallas Jenkins' Season 7 post on the phone)
    { id: "c1", in: 9.18, out: 11.08, layout: { mode: "B", rect: PHONE } },
    // 7 years, 7 seasons, 528 days on set (phone scrolls to the year list)
    { id: "c2", in: 14.76, out: 21.28, layout: { mode: "B", rect: PHONE } },
    // they already shot Season 7 (resurrection) — we haven't even seen the crucifixion season
    { id: "c3", in: 31.37, out: 41.94, layout: { mode: "B", rect: ROUMIE },
      changes: [{ at: 34.5, layout: { mode: "A", zoom: 1.05 } }] },
    // spoiler alert: He rises — the episode's own "HE RISES" graphic shown whole
    { id: "c4", in: 42.36, out: 49.07, layout: { mode: "A", zoom: 1.1 },
      changes: [
        { at: 44.4, layout: { mode: "F", cx: 965 } },
        { at: 47.65, layout: { mode: "A", zoom: 1.0 } }, // after the episode's HE RISES text has cleared
      ] },
    // Season 6 on Prime Video 15 Nov, free on The Chosen app
    { id: "c5", in: 49.36, out: 58.7, layout: { mode: "A", zoom: 1.0 },
      changes: [{ at: 50.55, layout: { mode: "B", rect: PHONE } }] },
    // share with your pastor uncle
    { id: "c6", in: 65.36, out: 70.42, layout: { mode: "A", zoom: 1.1 } },
  ],
  captions: [
    [9.18, 11.08, "<b>THE CHOSEN</b> KI SHOOTING KHATAM!"],
    [14.76, 16.77, "<b>7 SAAL</b>, 7 SEASON"],
    [16.77, 21.28, "AUR <b>528 DIN</b> SET PE"],
    [31.37, 33.6, "MAZEDAAR BAAT YEH HAI KI"],
    [33.6, 35.6, "INHONE <b>SEASON 7</b> SHOOT KAR LIYA"],
    [35.6, 37.94, "JO <b>RESURRECTION</b> KE BAARE MEIN HAI"],
    [37.94, 39.1, "AUR HUMNE TOH ABHI TAK"],
    [39.1, 41.94, "<b>CRUCIFIXION</b> WALA SEASON HI NAHI DEKHA"],
    [42.36, 44.4, "WAISE, SPOILER ALERT:"],
    [45.3, 47.4, "SORRY, AAPNE <b>2000 SAAL</b> PEHLE"],
    [47.4, 49.07, "HI SUN LIYA HOGA"],
    [49.36, 51.2, "<b>SEASON 6</b> PRIME VIDEO PE"],
    [51.2, 53.52, "<b>15 NOVEMBER</b> KO AA RAHA HAI"],
    [53.81, 56.02, "AGAR AAPNE <b>THE CHOSEN APP</b> DOWNLOAD KIYA HAI"],
    [56.29, 58.7, "TOH AAP <b>FREE</b> MEIN DEKH SAKTE HAIN"],
    [65.36, 67.38, "AGAR ABHI TAK NAHI DEKHA HAI"],
    [67.38, 70.42, "TOH YEH VIDEO <b>PASTOR UNCLE</b> KO SHARE KIJIYE!"],
  ],
  chips: [
    { id: "chipprime", from: 51.6, to: 58.7, slot: 1, right: true, html: `15 NOV <span style="opacity:.75">PRIME VIDEO</span>` },
    { id: "chipapp", from: 56.6, to: 58.7, slot: 0, right: true, html: `CHOSEN APP <span style="opacity:.75">FREE</span>` },
  ],
}, import.meta.url);
