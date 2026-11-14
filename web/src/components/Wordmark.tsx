/**
 * The logotype itself, as outlines.
 *
 * This used to be the live string "5TALENTS" set in Bebas Neue. The drawn
 * artwork is the real mark: the spacing and the terminals are the designed
 * ones rather than whatever the webfont's metrics produce, and nothing
 * depends on a font file arriving - on a cold cache the masthead no longer
 * flashes a fallback face.
 *
 * `fill: currentColor`, so one file serves the ink masthead, the inverse
 * footer and dark mode without a second asset. Sized by height in `em` so it
 * tracks whatever font-size its container already declares; the width follows
 * from the 744.57 x 179.2 viewBox, trimmed tight to the letters.
 *
 * public/wordmark.svg is the same artwork as a standalone file, for press
 * kit, email and partner decks.
 */
export function Wordmark({ className = 'logo-mark' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="79.2 2.71 744.57 179.2"
      fill="currentColor"
      role="img"
      aria-label="5Talents"
    >
      <path d="M105.23 123.35v16.26q0 9.52 3.88 13.27t10.39 3.75q6.5 0 10.37-3.75 3.9-3.75 3.9-13.27v-38.54q0-9.51-3.9-13.38-3.87-3.9-10.37-3.89t-10.4 3.9q-3.87 3.86-3.87 13.37v5.26H79.2l5-101.62h72.58v25.03h-47.8l-2.25 41.8q7.76-12.77 24.02-12.77 15.27 0 22.9 10.27 7.65 10.26 7.65 29.78v39.04q0 21.29-10.4 32.68-10.38 11.37-30.65 11.37-20.28 0-30.67-11.37-10.38-11.4-10.38-32.68v-14.51ZM172.05 4.7h85.09v25.04h-28.78V179.9h-27.53V29.74h-28.78Zm186.71 175.21h-27.79l-4.75-31.78h-33.8l-4.74 31.78H262.4l28.03-175.2h40.3Zm-62.82-55.56h26.53l-13.26-88.6ZM371.53 4.7h27.53v150.18h45.3v25.03h-72.83ZM484.4 78.55h37.78v25.03H484.4v51.3h47.55v25.03h-75.08V4.71h75.08v25.03H484.4Zm89.09-25.53v126.89h-24.77V4.71h34.53l28.28 104.87V4.71h24.54v175.2h-28.29ZM648.32 4.7h85.1v25.04h-28.78V179.9H677.1V29.74h-28.79Zm94.1 42.05q0-21.26 10.14-32.65Q762.7 2.7 782.97 2.7q20.28 0 30.4 11.4 10.15 11.4 10.15 32.65v6.77h-26.03V45q0-9.49-3.63-13.37-3.63-3.9-10.14-3.9-6.5 0-10.14 3.9-3.62 3.88-3.62 13.37 0 9.03 4 15.91a67 67 0 0 0 10.01 13.02q6 6.12 12.9 12.26 6.88 6.13 12.88 13.4a68 68 0 0 1 10.02 16.5q4 9.27 4 21.77 0 21.29-10.4 32.68Q803 181.9 782.73 181.9q-20.26 0-30.66-11.37-10.38-11.4-10.39-32.68v-12.01h26.04v13.76q0 9.52 3.87 13.27 3.9 3.75 10.4 3.75t10.38-3.75 3.88-13.27q0-9-4-15.89t-10.02-13.01q-6-6.12-12.89-12.25-6.88-6.15-12.89-13.4a69 69 0 0 1-10.02-16.52q-4-9.27-4-21.79m0 0" />
    </svg>
  )
}
