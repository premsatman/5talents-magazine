/**
 * Derived at render, never stored. Blueprint s7: a stored readingTime goes
 * stale on every edit.
 *
 * 220 wpm is a reasonable rate for magazine prose. `wordCount` comes from the
 * GROQ projection `length(pt::text(body))`, which is a character count, so we
 * divide by an average word length first.
 */
export function readingTime(charCount: number | null | undefined): number {
  if (!charCount || charCount < 1) return 1
  const words = charCount / 5.6
  return Math.max(1, Math.round(words / 220))
}

export function readingTimeLabel(charCount: number | null | undefined): string {
  return `${readingTime(charCount)} min read`
}
