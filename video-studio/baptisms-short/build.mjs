// Short #3 "882 baptisms in one Sunday" — Ep01 01:28-03:04 (assets/footage/seg.mp4 starts at 88s).
// Run: node build.mjs   (engine: ../_shared/short-engine.mjs)
// Cuts inside continuous speech were placed in measured envelope dips (node ../_shared/env.mjs).
import { build, TICK } from "../_shared/short-engine.mjs";

const PHONE = { x: 1396, y: 90, w: 416, h: 900 }; // phone screen-recording inset (Instagram)
const CROSS = `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`;

build({
  src: "assets/footage/seg_norm.mp4",
  srcB: "assets/footage/seg_broll.mp4",
  pill: "5TALENTS REWIND · REVIVAL REPORT",
  headline: ["882 BAPTISMS", "EK SUNDAY MEIN!"],
  clips: [
    // hook: one Sunday, 882 baptisms (Lakepointe's "882 BAPTISMS" post on the phone)
    { id: "c1", in: 9.4, out: 14.1, layout: { mode: "A", zoom: 1.08 },
      changes: [{ at: 10.0, layout: { mode: "B", rect: PHONE } }] },
    // pastor uncle's BP joke
    { id: "c2", in: 14.4, out: 25.22, layout: { mode: "B", rect: PHONE },
      changes: [{ at: 23.3, layout: { mode: "A", zoom: 1.12 } }] },
    // the debate + Pastor Josh Howerton's answer (his reel on the phone)
    { id: "c3", in: 48.5, out: 65.45, layout: { mode: "A", zoom: 1.0 },
      changes: [{ at: 59.5, layout: { mode: "B", rect: PHONE } }] },
    // Acts 8: Philip never handed the Ethiopian official a workbook
    { id: "c4", in: 69.65, out: 79.62, layout: { mode: "A", zoom: 1.05 } },
    // heard, decided, "baptise me" — over the episode's river-baptism B-roll
    { id: "c5", in: 82.8, out: 95.0, layout: { mode: "F" },
      changes: [{ at: 86.05, layout: { mode: "A", zoom: 1.08 } }] },
  ],
  captions: [
    [9.4, 10.5, "EK SUNDAY KO"],
    [10.5, 14.1, "<b>882 LOGON</b> NE BAPTISMA LIYA!"],
    [14.4, 16.5, "HUMARE YAHAN TOH <b>82 LOG</b>"],
    [16.5, 18.9, "AGAR CHURCH AA JAATE HAIN"],
    [18.9, 21.9, "TOH PASTOR UNCLE KA <b>BP CHECK</b>"],
    [21.9, 23.8, "KARWANA PADEGA"],
    [23.8, 25.22, "KI ITNE LOG KAISE AA GAYE!"],
    [48.5, 50.2, "AB <b>DEBATE</b> YEH HAI KI"],
    [50.2, 53.2, "ITNA JALDI BAPTISMA LENA THEEK HAI?"],
    [53.6, 55.6, "NA <b>CLASS</b>, NA <b>INTERVIEW</b>"],
    [55.6, 58.6, "AUR SABHI LOG PAANI PE!"],
    [58.6, 61.1, "<b>PASTOR JOSH HOWERTON</b> NE KAHA"],
    [61.1, 65.45, "NEW TESTAMENT MEIN HAR BAPTISMA <b>SPONTANEOUS</b> THA"],
    [69.65, 72.6, "PHILIP NE ETHIOPIAN OFFICIAL SE"],
    [72.6, 74.1, "YEH TOH NAHI KAHA KI"],
    [74.1, 75.5, "PEHLE AAP JAIYE,"],
    [75.5, 77.2, "YEH <b>WORKBOOK</b> COMPLETE KARO"],
    [77.2, 79.62, "PHIR MAIN AAPKO BAPTISMA DUNGA"],
    [82.8, 84.9, "KISI NE SUNA,"],
    [84.9, 87.5, "AUR <b>INSTANTLY</b> DECISION LE LIYA"],
    [87.5, 91.5, "KI AAJ MAIN ISE <b>FOLLOW</b> KARTA HOON"],
    [91.5, 95.0, "AUR KAHA: MUJHE <b>BAPTISMA</b> DE DO!"],
  ],
  chips: [
    { id: "chiplp", from: 10.6, to: 14.1, slot: 0, html: `LAKEPOINTE <span style="opacity:.75">· DALLAS</span>` },
    { id: "chipclass", from: 53.8, to: 58.6, slot: 1, html: `${CROSS}CLASS` },
    { id: "chipint", from: 54.6, to: 58.6, slot: 0, html: `${CROSS}INTERVIEW` },
    { id: "chipacts", from: 69.75, to: 74.1, slot: 0, html: `ACTS 8 <span style="opacity:.75">· PHILIP</span>` },
  ],
}, import.meta.url);
