import { preferredSourceUrl, siteName } from '@/lib/site'

/**
 * "Tell Google you want 5Talents in your Top Stories."
 *
 * The same ask as the footer link, at the foot of an article instead. Someone
 * who has just finished reading is the one person likely to say yes; the
 * footer catches only people already hunting for a way to follow us. Both are
 * worth having, and neither belongs on a section or archive page, where
 * nobody has read anything yet.
 *
 * No JavaScript and no Google logo. The plain deeplink is one of the three
 * methods Google documents, and it avoids pulling publisher.js onto every
 * article for a feature that does nothing until a reader acts. To use the
 * official badge instead, download Google's translated button artwork, drop
 * the PNG in web/public/, and swap the <span> below for an <img>; the link
 * itself does not change.
 *
 * The #article fragment exists to be counted. Fragments are never sent to the
 * server, so it cannot affect the tool, but GA4's enhanced measurement records
 * the href on an outbound click - which makes "did the article placement beat
 * the footer" a question the analytics can answer rather than a guess.
 */
export function PreferredSource({ placement = 'article' }: { placement?: 'article' | 'footer' }) {
  return (
    <aside className="prefsource">
      <p className="prefsource__line">
        Would you rather hear it from us? Tell Google to put {siteName} in your Top Stories.
      </p>
      <a
        className="prefsource__btn"
        href={`${preferredSourceUrl}#${placement}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Add as a preferred source
      </a>
    </aside>
  )
}
