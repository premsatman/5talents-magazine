/**
 * Small flipbook preview that sits under the "Read this issue" button.
 *
 * The host's snippet (AnyFlip) is a fixed 400x250 with a handful of legacy
 * attributes - `seamless`, `allowtransparency`, `frameborder`, `scrolling`.
 * None of those do anything in a current browser, so only the sizing survives
 * here: the iframe fills a box locked to the same 400/250 ratio, which lets it
 * sit inside the 260px cover column on desktop and go full width on a phone
 * rather than overflowing at a hard 400px.
 */
export function IssueReader({ url, title }: { url: string; title: string }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        margin: 'var(--s-4) auto 0',
        aspectRatio: '400 / 250',
        border: '1px solid var(--rule)',
        background: 'var(--paper-2, #f4f1ea)',
      }}
    >
      <iframe
        src={url}
        title={`${title} - flip through a preview`}
        loading="lazy"
        scrolling="no"
        allowFullScreen
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  )
}
