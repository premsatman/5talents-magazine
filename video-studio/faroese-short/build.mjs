// Short #5 "Sirf 55,000 logon ke liye nayi Bible" — Ep01 04:03-05:13 (assets/footage/seg.mp4 starts at 243s).
// Run: node build.mjs   (engine: ../_shared/short-engine.mjs)
import { build } from "../_shared/short-engine.mjs";

const TYNDALE = { x: 1364, y: 114, w: 456, h: 852 }; // "William Tyndale · 500 Years" poster inset

build({
  src: "assets/footage/seg_norm.mp4",
  srcB: "assets/footage/seg_broll.mp4",
  pill: "5TALENTS REWIND · FAROE ISLANDS",
  headline: ["SIRF 55,000 LOGON KE LIYE", "NAYI BIBLE!"],
  headlineSize: 112,
  clips: [
    // Faroe Islands: 18 islands, 55,000 people — over the episode's landscape B-roll
    // (opens on a clean still because the first landscape carries the episode's "KHABAR 4" title)
    { id: "c1", in: 4.3, out: 13.0, layout: { mode: "S", img: "assets/images/faroe_landscape.png", bg: "assets/images/faroe_landscape_bg.jpg", alt: "Faroe Islands fjord", fit: "cover" },
      changes: [{ at: 7.0, layout: { mode: "F" } }] },
    // "itne log toh Gachibowli ke IT park mein ek shift mein aa jaate hain"
    { id: "c2", in: 13.35, out: 19.0, layout: { mode: "A", zoom: 1.1 },
      changes: [{ at: 15.4, layout: { mode: "F" } }] },
    // first new Faroese New Testament since 1937
    { id: "c3", in: 19.5, out: 31.9, layout: { mode: "A", zoom: 1.0 },
      changes: [{ at: 24.55, layout: { mode: "F" } }] },
    // 500 years of the English Bible: Tyndale, 1526
    { id: "c4", in: 36.95, out: 50.75, layout: { mode: "A", zoom: 1.05 },
      changes: [
        { at: 41.5, layout: { mode: "B", rect: TYNDALE } },
        { at: 44.3, layout: { mode: "A", zoom: 1.0 } },
        { at: 46.95, layout: { mode: "F" } },
      ] },
    // 3,000 printed in secret; death if printed in England; 3 survive, the rest burned
    { id: "c5", in: 51.8, out: 64.95, layout: { mode: "A", zoom: 1.08 },
      changes: [
        { at: 54.55, layout: { mode: "F" } },
        { at: 60.2, layout: { mode: "A", zoom: 1.12 } },
        // old printed Bible: held as a still to the end — the episode blurs back to the face until ~63.7s
        { at: 61.75, layout: { mode: "S", img: "assets/images/tyndale_bible.png", fit: "cover", alt: "Early printed English New Testament" } },
      ] },
  ],
  captions: [
    [4.3, 6.0, "<b>FAROE ISLANDS</b>,"],
    [6.0, 8.54, "SCOTLAND AUR ICELAND KE BEECH MEIN"],
    [8.79, 11.2, "LAGBHAG <b>18 ISLANDS</b> HAIN"],
    [11.2, 13.0, "AUR SIRF <b>55,000 LOG</b>!"],
    [13.35, 15.4, "ITNE LOG TOH HUMARE"],
    [15.4, 17.0, "<b>GACHIBOWLI</b> KE IT PARK MEIN"],
    [17.0, 19.0, "EK SHIFT MEIN AA JAATE HAIN!"],
    [19.5, 21.5, "TOH INTERESTING BAAT YEH HUI KI"],
    [21.5, 24.03, "IS ISLAND PE EK NAYA"],
    [24.51, 27.3, "<b>NEW TESTAMENT</b> TRANSLATION AAYA HAI"],
    [27.3, 31.9, "JO <b>1937</b> KE BAAD PEHLI BAAR AAYA"],
    [36.95, 40.4, "INTERESTINGLY, ISI SAAL"],
    [40.4, 43.45, "<b>ENGLISH BIBLE</b> KE 500 SAAL BHI PURE HUE"],
    [43.74, 45.76, "<b>WILLIAM TYNDALE</b> NE"],
    [46.06, 48.47, "<b>1526</b> MEIN PEHLI BAAR"],
    [48.85, 50.75, "ENGLISH NEW TESTAMENT PRINT KIYA"],
    [51.8, 55.54, "CHUPKE SE <b>3,000</b> NEW TESTAMENT HI CHHAAP PAAYE"],
    [55.91, 58.96, "ENGLAND MEIN CHHAAPTE TOH <b>MAAR DIYA JAATA</b>"],
    [59.74, 61.6, "AAJ SIRF <b>3</b> HI BACHE HAIN"],
    [61.6, 64.95, "BAAKI SAB <b>JALA DIYE</b> GAYE THE"],
  ],
  chips: [
    { id: "chipprint", from: 52.9, to: 64.95, slot: 1, html: `3,000 <span style="opacity:.75">CHHAPE</span>` },
    { id: "chipleft", from: 60.2, to: 64.95, slot: 0, html: `SIRF 3 <span style="opacity:.75">BACHE</span>` },
  ],
}, import.meta.url);
