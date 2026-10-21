# Video Studio (HyperFrames)

AI-assisted video editing with [HyperFrames](https://github.com/heygen-com/hyperframes)
and Claude Code. Each video is its own HyperFrames project folder in here.

- Claude Code plugin: `hyperframes@hyperframes` (user scope, v0.8.174)
- Router skill in Claude Code: `/hyperframes:hyperframes`
- Plugin CLI launcher (used instead of `npx hyperframes` when the plugin is installed):
  `node ~/.claude/plugins/cache/hyperframes/hyperframes/<version>/skills/hyperframes/scripts/plugin-cli.mjs <command>`

## Where things go (inside a project, e.g. `starter/`)

| Folder | Put here |
| --- | --- |
| `assets/footage/` | Source footage: the main camera / interview / screen recordings to be edited |
| `references/` | Reference videos and style examples to imitate. Not used in the render |
| `assets/broll/` | B-roll video clips |
| `assets/images/` | Images, screenshots, photos, stills |
| `assets/audio/` | Music, voiceover, sound effects |
| `assets/brand/` | Logos, brand colours, `design.md` / `frame.md`, lower-third specs |
| `assets/fonts/` | Font files (`.woff2` / `.ttf`) so renders don't depend on web fonts |

## Start a new video

Duplicate `starter/` (it is an empty, verified project with the folders above), rename it,
drop files into the folders, and open Claude Code in it. Then ask, for example:

> Using /hyperframes:hyperframes, cut assets/footage/interview.mp4 into a 60-second vertical
> short in the style of references/example.mp4, with captions and B-roll from assets/broll/.

## 5Talents Rewind shorts (shared engine)

`sb-short/` was the first short. `dove-short/`, `chosen-short/`, `baptisms-short/` and
`faroese-short/` are each a small `build.mjs` config fed to `_shared/short-engine.mjs`.
Each config holds the cut list, the layout per beat, the captions and the callout chips.
Edit the config, then run `node build.mjs` to regenerate `index.html`.
Helpers in `_shared/`: `words.mjs` (word timings + pauses), `scenes.sh` / `strip.sh` (find
cutaways), `env.mjs` (audio envelope for cut points), `verify-cuts.mjs` (re-transcribe a draft).

## Commands (run inside a project)

```bash
npm run dev      # preview in the browser
npm run check    # lint + layout + motion + contrast
npm run render   # render to MP4
```

Update the plugin with `claude plugin update hyperframes@hyperframes`.
