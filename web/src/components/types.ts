import type { ImageLike } from '@/sanity/image'
import type { ExternalImage } from '@/sanity/media'

/**
 * The shape returned by the shared `cardFragment` in queries.ts.
 *
 * Strings are typed loosely because query results carry stega branding when
 * Visual Editing is on. Anything used for logic goes through clean() first;
 * anything rendered is passed straight through so click-to-edit keeps working.
 */
export type ArticleCardData = {
  _id: string
  title?: string | null
  slug?: string | null
  deck?: string | null
  kind?: string | null
  publishedAt?: string | null
  sponsorTier?: string | null
  section?: { name?: string | null; slug?: string | null } | null
  hero?: ImageLike
  /** Cloudinary alternative. Wins over the upload when set. */
  heroExternal?: ExternalImage
  /** 3:4 art for the homepage hero row only. Falls back to the lead image. */
  heroPortrait?: ExternalImage
  authors?: ({ name?: string | null; slug?: string | null } | null)[] | null
  wordCount?: number | null
  originalIssue?: { title?: string | null; slug?: string | null; issueDate?: string | null } | null
  /**
   * First tag on a brief, projected by HOME_BRIEFS_QUERY and the stream page.
   * On /current every card would otherwise read CURRENT, which tells the reader
   * nothing - the franchise is the useful label.
   */
  franchise?: { name?: string | null; slug?: string | null } | null
  interviewMeta?: {
    subject?: string | null
    subjectBio?: string | null
    country?: string | null
  } | null
}
