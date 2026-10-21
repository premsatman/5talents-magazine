// Short #1 "Doomscroll = Song of the Year" — Ep01 03:00-04:10 (assets/footage/seg.mp4 starts at 178s).
// Run: node build.mjs   (engine: ../_shared/short-engine.mjs)
import { build } from "../_shared/short-engine.mjs";

const POSTER = { x: 1130, y: 80, w: 734, h: 916 }; // "Winner, Song of the Year" poster inset in the episode frame

build({
  src: "assets/footage/seg_norm.mp4",
  srcB: "assets/footage/seg_broll.mp4",
  pill: "5TALENTS REWIND · DOVE AWARDS",
  headline: ["1 GHANTA DOOMSCROLL", "= SONG OF THE YEAR!"],
  headlineSize: 112,
  clips: [
    // cold-open hook over the episode's doomscroll / window B-roll
    { id: "c1", in: 39.25, out: 44.9, layout: { mode: "F" } },
    // 57th Dove Awards, Song of the Year: Josiah Queen, Dusty Bibles
    { id: "c2", in: 8.8, out: 22.6, layout: { mode: "S", img: "assets/images/dove_awards.png", bg: "assets/images/dove_awards_bg.jpg", alt: "57th annual Dove Awards, October 6, 2026" },
      changes: [
        { at: 13.95, layout: { mode: "A", zoom: 1.0 } },
        { at: 18.5, layout: { mode: "A", cx: 720 } },   // keep the episode's lower-right name card out of frame; our chip names him
        { at: 22.1, layout: { mode: "F" } },           // interview clip begins
      ] },
    // he wrote it after an hour of doomscrolling
    { id: "c3", in: 23.3, out: 31.9, layout: { mode: "F" },
      changes: [
        { at: 26.5, layout: { mode: "A", zoom: 1.05 } },
        { at: 28.0, layout: { mode: "F" } },
      ] },
    // biggest award in the worship industry ... because of its lyrics
    { id: "c4", in: 51.35, out: 59.87, layout: { mode: "A", zoom: 1.0 },
      changes: [
        { at: 55.46, layout: { mode: "B", rect: POSTER } },
        { at: 57.83, layout: { mode: "A", zoom: 1.08 } },
      ] },
    // the sting
    { id: "c5", in: 60.22, out: 66.93, layout: { mode: "A", zoom: 1.12 } },
  ],
  captions: [
    [39.25, 40.9, "EK GHANTA USNE SCROLL KIYA,"],
    [40.9, 42.2, "<b>SCROLL</b> KIYA, THAK GAYA..."],
    [42.2, 44.9, "AND THEN HE WROTE A <b>SONG</b>."],
    [8.8, 11.16, "57TH <b>DOVE AWARDS</b>"],
    [11.16, 13.1, "JAANA MAANA AWARD HAI"],
    [13.1, 15.2, "CHRISTIAN MUSIC INDUSTRY MEIN"],
    [15.2, 17.85, "IS BAAR <b>SONG OF THE YEAR</b>"],
    [17.85, 19.65, "MILA <b>JOSIAH QUEEN</b> KO"],
    [19.65, 22.6, "GAANA: <b>DUSTY BIBLES</b>"],
    [23.3, 25.1, "JOSIAH NE BATAYA KI"],
    [25.1, 27.2, "YEH GAANA TAB LIKHA JAB"],
    [27.2, 29.4, "EK AFTERNOON, EK GHANTE TAK"],
    [29.4, 31.9, "PHONE PE <b>DOOMSCROLL</b> KAR RAHA THA"],
    [51.35, 53.9, "LEKIN SOCHO, <b>WORSHIP INDUSTRY</b> KA"],
    [53.9, 57.5, "SABSE BADA AWARD IS GAANE KO"],
    [57.5, 59.87, "BECAUSE OF ITS <b>LYRICS</b>"],
    [60.22, 62.34, "AUR LYRICS MEIN YEH HAI KI"],
    [62.34, 64.7, "<b>BIBLE</b> MEIN DHOOL JAM GAYI HAI"],
    [64.7, 66.93, "LEKIN <b>PHONE</b> FULL CHARGE HAI!"],
  ],
  chips: [
    { id: "chipjq", from: 17.85, to: 22.1, slot: 0, html: `JOSIAH QUEEN <span style="opacity:.75">· DUSTY BIBLES</span>` },
    { id: "chipbible", from: 62.6, to: 66.93, slot: 1, html: `BIBLE: <span style="opacity:.75">DHOOL</span>` },
    { id: "chipphone", from: 65.3, to: 66.93, slot: 0, html: `PHONE: <span style="opacity:.75">100% CHARGED</span>` },
  ],
}, import.meta.url);
