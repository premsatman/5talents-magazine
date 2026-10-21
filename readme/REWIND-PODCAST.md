# 5Talents Rewind on the website and as a podcast

Built 21 October 2026, after Episode 1.

## What exists

| URL | What it is |
|---|---|
| `/rewind` | The show page: cover, description, where to listen, every episode |
| `/rewind/episode-1-…` | One page per episode: YouTube player, chapters that jump the player, audio player, Shorts, transcript |
| `/rewind/feed.xml` | The podcast RSS feed. This is what Spotify, Apple, Amazon and YouTube read |
| Homepage | A "5Talents Rewind" block under The Latest, showing the newest episode |
| Article pages | A "Covered on 5Talents Rewind #N, at m:ss" box under Sources, on every article an episode talked about |

The nav has a **Rewind** link next to Archive.

**Code:**
- **Schema:** `studio/schemaTypes/podcast.ts` (`podcastShow`, `podcastEpisode`).
- **Web helpers:** `web/src/lib/podcast.ts`.
- **Components:** `web/src/components/Rewind.tsx` and `web/src/components/EpisodeMedia.tsx`.
- **Routes:** everything under `web/src/app/rewind/`.
- **Queries:** the "5Talents Rewind" block at the end of `web/src/sanity/queries.ts`.

**Where content lives:**
- **The show:** one document with the fixed id `podcast-rewind`, opened from Studio under **Rewind show settings**.
- **Episodes:** under **Rewind episodes**.
- **Files:** the MP3 and the images are on Cloudinary, in the `5talents-rewind/` folder.

## The one idea

An episode's **chapters** point at our articles. That single reference does three jobs:
- the episode page lists the article under its timestamp;
- the article page shows the "Covered on Rewind" box;
- the feed's show notes link back to the site.

Nothing else has to be kept in step by hand.

## Every week, after the YouTube episode is up

1. **Make the MP3** from the final video:

   ```bash
   ffmpeg -i "5Talents Rewind EpNN.mp4" -vn -af loudnorm=I=-16:TP=-1.5:LRA=11 \
     -ar 44100 -ac 2 -c:a libmp3lame -b:a 128k 5talents-rewind-epNN.mp3
   ```

2. **Upload to Cloudinary:** the MP3 (it goes in as a "video" asset) and the YouTube thumbnail.
3. **Create the episode in Studio** under Rewind episodes:
   - **Basics:** number, title (without "| 5Talents Rewind #N"), slug (generate it), publishedAt (the premiere time) and a two-sentence summary.
   - **Media:** the thumbnail URL with its width and height, the YouTube URL, and the audio URL with its exact byte size and length in seconds.
   - **Chapters:** copied from the YouTube description, each one linked to its article.
   - **Transcript:** cleaned from the YouTube captions, with `[m:ss]` at the start of each paragraph.
4. **Publish.** The site, the feed and every podcast app pick it up from there.

## One-time: getting into the podcast apps

Submit `https://www.5talentsmag.com/rewind/feed.xml` to each of these:

- **Spotify for Creators** (creators.spotify.com): "I already have a podcast", then paste the RSS feed URL.
- **Apple Podcasts Connect** (podcastsconnect.apple.com): add a show by RSS feed.
- **Amazon Music for Podcasters** (podcasters.amazon.com).
- **YouTube Studio:** Content, then Podcasts, then turn the "5Talents Rewind" playlist into a podcast. YouTube already has the video, so don't make it ingest the RSS too, or every episode appears twice.

Each directory emails a verification code to the feed's owner address (`editorial@5talentsmag.com`, set in Rewind show settings). When a directory approves the show, paste its link into **Rewind show settings → Where to listen**. The buttons on `/rewind` appear by themselves.

## Rules the feed depends on

- **Never change an episode's document id** once it's published. The feed's `<guid>` is built from it, and a new guid makes every app treat the episode as new.
- **The audio byte size must match the file.** Apple checks it.
- **The cover must stay square,** at least 1400 px. The feed asks Cloudinary for a 3000 px JPG.
- **An episode without audio** shows on the site but stays out of the feed.

## Not done yet

- **Download statistics.** Cloudinary doesn't report podcast downloads. If they're needed for sponsors, put an analytics prefix such as OP3 (op3.dev) in front of the audio URL, or move the audio hosting to a podcast host.
- **Shorts.** Add each episode's Shorts to its `shorts` field once their YouTube links exist.
