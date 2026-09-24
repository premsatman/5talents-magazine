# Katie Taylor — Current piece + IG carousel (both live, 24 Sep 2026)

**Article:** https://www.5talentsmag.com/current/katie-taylor-croke-park-all-hail-king-jesus-psalm-18
Sanity doc dc7943cc-3e2b-473e-8154-74ce3351b078 · section Current · byline 5Talents · ~460 words
**Instagram:** https://www.instagram.com/p/Ddp0K4ekRUg/ (posted 08:00 IST)
**Images:**
- Lead: Pixabay photo of a fight night at the Ergo Arena, Gdansk (IdaT, Pixabay Content License) —
  https://pixabay.com/photos/gdansk-poland-arena-venue-sports-83358/ — Cloudinary 5talents/current/katie-taylor/arena-pixabay.
  Caption says plainly it is NOT Croke Park and not Taylor's fight.
- Homepage portrait card and all IG slides: our own artwork. Generator: current/tools/katie_taylor_slides.py
- No licensed photograph of Katie Taylor is available to us.
- Instagram reel by @tvinstaller.ie embedded after the robe paragraph (NOT rendering on the live site — see below).

**Open bug:** instagramEmbed blocks do not render on the live site even though the code is in
web/src/components/PortableBody.tsx and commit 9c0b620 is deployed on Vercel. Needs local debugging.
**No tags used** — Katie Taylor's handle not verified.

**API note:** three of five child containers failed first time with "media could not be fetched from this URI".
Retrying one at a time after ~25s fixed slides 2 and 3. Slide 5 failed four times on the same URL and only
worked after re-uploading to a NEW public_id (slide-5b). Lesson: create children sequentially, and if one
slide keeps failing, re-upload under a different public_id rather than retrying the same URL.

---

## Caption

She worshipped before the bell.

On 5 September, Katie Taylor walked out at Croke Park for the last time. 82,000 people in the stadium, in her own city, for a fight she had already said would be her final one.

The song they played was "All Hail King Jesus". Not a clip buried under a hype reel — the whole stadium got the chorus.

She was wearing a black Celtic robe worked in gold, and written down it, also in gold, Psalm 18. She has explained it before: "This is a Psalm that I regularly read when I am away in competition. It's God who trains my mind for battle and He is my shield of victory."

Then she boxed. Ten rounds, unanimous decision, three belts kept and two more taken — undisputed champion at 40 years and 65 days, the oldest fighter of any gender ever to do it. Then she retired.

Here is the part worth sitting with. Athletes thank God afterwards all the time, and it costs nothing by then: the result is in, and the camera has already found you. Taylor did it on the way in, before the first bell, while she could still have lost in front of 82,000 people and most of Ireland.

"He teacheth my hands to war... thou hast also given me the shield of thy salvation." Psalm 18:34-35

Where is it costly for you to be known? Tell us in the comments, and send this to someone who needs it this week.

Full story at the link in bio.

Artwork: 5Talents

#KatieTaylor #CrokePark #AllHailKingJesus #Psalm18 #FaithAndSport #ChristianAthletes #WomensBoxing #GenZChristian #ChristianGenZ #Ireland #Worship #5Talents #5TalentsCurrent
