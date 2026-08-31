import { defineQuery } from 'next-sanity'

/* ------------------------------------------------------------------ *
 * Fragments
 * ------------------------------------------------------------------ */

/** Cloudinary-hosted images, projected wherever an uploaded one is. */
const externalImageFragment = /* groq */ `
  url, alt, width, height, caption, credit
`

const imageFragment = /* groq */ `
  asset->{ _id, url, metadata { lqip, dimensions } },
  alt,
  caption,
  credit,
  hotspot,
  crop
`

/** Everything a card needs and nothing more. */
const cardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  deck,
  kind,
  publishedAt,
  sponsorTier,
  "section": section->{ name, "slug": slug.current },
  hero { ${imageFragment} },
  heroExternal { ${externalImageFragment} },
  "authors": authors[]->{ name, "slug": slug.current },
  "wordCount": length(pt::text(body)),
  "originalIssue": archiveMeta.originalIssue->{ title, "slug": slug.current, issueDate }
`

/**
 * Only published, non-retracted pieces are ever listed.
 *
 * `coalesce(retracted, false) == false` rather than the obvious
 * `retracted != true`. In GROQ a comparison with null evaluates to null, and a
 * filter treats null as false - so `retracted != true` would silently hide
 * every article that predates the field, which is all of them. coalesce gives
 * the missing field a real value first, so the comparison is between two
 * booleans and behaves.
 */
const live = /* groq */ `_type == "article" && defined(slug.current) && publishedAt <= now() && coalesce(retracted, false) == false`

/* ------------------------------------------------------------------ *
 * Site chrome
 * ------------------------------------------------------------------ */

export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0]{
    title, tagline, description, scopeStatement, contactEmail,
    adsEnabled, enabledSlots,
    socials[]{ platform, url }
  }
`)

export const NAV_SECTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "section"] | order(ordering asc){
    name, "slug": slug.current
  }
`)

/* ------------------------------------------------------------------ *
 * Homepage
 * ------------------------------------------------------------------ */

/**
 * The three portrait cards at the top. Relevant runs exactly three, at 396x520.
 *
 * Only articles an editor has explicitly featured appear here, and that is
 * deliberate on two counts.
 *
 * Editorially, the lead is a decision, not "whatever published last".
 *
 * Practically, a 3:4 crop is the most demanding shape on the page and the
 * 2012-14 archive photographs cannot fill it. They are landscape and about
 * 560x420, so cropping to 3:4 leaves roughly 314x419 of real pixels against a
 * slot that renders near 360x480 - an upscale of about 1.8x, and it looks it.
 * Archive pieces belong in the 5:4 and 3:2 shapes, which are close to their
 * native ratio and need no upscaling at all.
 *
 * A piece with no hero image is excluded outright. The overlay card sets its
 * headline over a photograph; with nothing behind it you get a black rectangle
 * where the lead story should be. Everywhere else on the site a missing image
 * degrades gracefully - here it is the whole component.
 */
export const HOME_HERO_QUERY = defineQuery(/* groq */ `
  *[${live} && featured in ["hero", "featured"] && (defined(hero.asset) || defined(heroExternal.url))]
  | order(select(featured == "hero" => 0, 1) asc, publishedAt desc)[0...3]{
    ${cardFragment},
    interviewMeta { subject, country, isCoverStory }
  }
`)

/** The five-across compact row under the hero. Newest first, featured or not. */
export const HOME_COMPACT_QUERY = defineQuery(/* groq */ `
  *[${live}] | order(publishedAt desc)[0...5]{
    ${cardFragment}
  }
`)

export const HOME_TALENT_SEARCH_QUERY = defineQuery(/* groq */ `
  *[${live} && kind == "interview" && interviewMeta.isCoverStory == "talentSearch"]
  | order(publishedAt desc)[0...3]{ ${cardFragment} }
`)

export const HOME_LATEST_QUERY = defineQuery(/* groq */ `
  *[${live} && featured != "hero"] | order(publishedAt desc)[0...5]{ ${cardFragment} }
`)

/**
 * Every section block in one round trip.
 *
 * Six separate queries would be six network calls for a page that is mostly
 * section blocks. Each returns one feature card plus three standard ones.
 */
export const HOME_SECTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "section"] | order(ordering asc){
    name,
    "slug": slug.current,
    description,
    "articles": *[${live} && section._ref == ^._id] | order(publishedAt desc)[0...5]{
      ${cardFragment}
    }
  }
`)

/** The long tail at the foot of the homepage. */
export const HOME_TAIL_QUERY = defineQuery(/* groq */ `
  *[${live}] | order(publishedAt desc)[8...28]{ ${cardFragment} }
`)

/** Rail module. Most-read is not measurable yet, so this is most-recent. */
export const HOME_RAIL_QUERY = defineQuery(/* groq */ `
  *[${live}] | order(publishedAt desc)[0...6]{ ${cardFragment} }
`)

export const HOME_SECTION_FEATURE_QUERY = defineQuery(/* groq */ `
  *[${live} && section->slug.current == $section] | order(publishedAt desc)[0]{ ${cardFragment} }
`)

export const HOME_ARCHIVE_STRIP_QUERY = defineQuery(/* groq */ `
  *[_type == "archiveIssue"] | order(issueDate desc)[0...6]{
    _id, title, "slug": slug.current, issueDate,
    coverImage { ${imageFragment} }
  }
`)

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

/**
 * Blueprint section 7 puts search on Sanity GROQ and calls it adequate under
 * ~500 articles. That is the right call: no index to maintain, no extra
 * service, and nothing to go stale.
 *
 * `match` is a full-text operator, so it hits the tokenised index rather than
 * scanning strings. The $q parameter arrives with a trailing wildcard from the
 * page, which makes it prefix-match as you would expect from a search box.
 *
 * Body text is searched through pt::text(), which flattens Portable Text to a
 * plain string. That part is not index-backed, so it is the slow half - fine
 * at this scale, and the thing to watch if the archive ever gets large.
 *
 * One constraint worth knowing, because it fails at runtime rather than at
 * build: score() will not take a dereference. `tags[]->name match $q` is fine
 * in the filter and throws "score() function received unexpected expression"
 * inside score(). So matches on tags, authors and section still FIND a piece,
 * they just do not contribute to its ranking. Only direct fields are scored.
 */
export const SEARCH_QUERY = defineQuery(/* groq */ `
  *[${live} && (
    title match $q ||
    deck match $q ||
    pt::text(body) match $q ||
    section->name match $q ||
    tags[]->name match $q ||
    authors[]->name match $q
  )] | score(
    boost(title match $q, 4),
    boost(deck match $q, 2),
    pt::text(body) match $q
  ) | order(_score desc, publishedAt desc)[0...40]{
    ${cardFragment},
    _score
  }
`)

export const SEARCH_COUNT_QUERY = defineQuery(/* groq */ `
  count(*[${live} && (
    title match $q ||
    deck match $q ||
    pt::text(body) match $q ||
    section->name match $q ||
    tags[]->name match $q ||
    authors[]->name match $q
  )])
`)

/** Tags actually in use, grouped by section. Drives the header dropdowns. */
export const SECTION_TAGS_QUERY = defineQuery(/* groq */ `
  *[_type == "section"] | order(ordering asc){
    name,
    "slug": slug.current,
    "tags": array::unique(
      *[${live} && section._ref == ^._id].tags[]->{ name, "slug": slug.current }
    )[0...6]
  }
`)

/* ------------------------------------------------------------------ *
 * Sections, tags, authors
 * ------------------------------------------------------------------ */

export const SECTION_QUERY = defineQuery(/* groq */ `
  *[_type == "section" && slug.current == $slug][0]{
    name, "slug": slug.current, description
  }
`)

export const SECTION_ARTICLES_QUERY = defineQuery(/* groq */ `
  *[${live} && section->slug.current == $slug] | order(publishedAt desc)[0...30]{
    ${cardFragment}
  }
`)

export const SECTION_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "section" && defined(slug.current)]{ "slug": slug.current }
`)

export const TAG_QUERY = defineQuery(/* groq */ `
  *[_type == "tag" && slug.current == $slug][0]{ name, "slug": slug.current, description }
`)

export const TAG_ARTICLES_QUERY = defineQuery(/* groq */ `
  *[${live} && $slug in tags[]->slug.current] | order(publishedAt desc)[0...50]{
    ${cardFragment}
  }
`)

export const TAG_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "tag" && defined(slug.current)]{ "slug": slug.current }
`)

export const AUTHOR_QUERY = defineQuery(/* groq */ `
  *[_type == "author" && slug.current == $slug][0]{
    name, "slug": slug.current, bio, role, institution, country, isStaff,
    photo { ${imageFragment} },
    socials[]{ platform, url }
  }
`)

export const AUTHOR_ARTICLES_QUERY = defineQuery(/* groq */ `
  *[${live} && $slug in authors[]->slug.current] | order(publishedAt desc)[0...50]{
    ${cardFragment}
  }
`)

export const AUTHOR_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "author" && defined(slug.current)]{ "slug": slug.current }
`)

/* ------------------------------------------------------------------ *
 * Article
 * ------------------------------------------------------------------ */

export const ARTICLE_QUERY = defineQuery(/* groq */ `
  *[${live} && slug.current == $slug && section->slug.current == $section][0]{
    _id,
    title,
    "slug": slug.current,
    deck,
    kind,
    publishedAt,
    sponsorTier,
    "section": section->{ name, "slug": slug.current },
    hero { ${imageFragment} },
    heroExternal { ${externalImageFragment} },
    body[]{
      ...,
      _type == "image" => { ${imageFragment} },
      _type == "externalImage" => { ${externalImageFragment} },
      markDefs[]{ ... }
    },
    "authors": authors[]->{
      name, "slug": slug.current, bio, role, institution,
      photo { ${imageFragment} }
    },
    "sponsor": sponsor->{ name, url, logo { ${imageFragment} } },
    interviewMeta {
      subject, subjectBio, country, isCoverStory, pullQuotes,
      subjectPhoto { ${imageFragment} }
    },
    reviewMeta { workTitle, creator, workType, rating, year },
    archiveMeta {
      originalPage, republishedAt, rewrittenAt, editNote,
      originalIssue->{ title, "slug": slug.current, issueDate }
    },
    "tags": tags[]->{ name, "slug": slug.current },
    "related": relatedArticles[]->{ ${cardFragment} },
    "wordCount": length(pt::text(body)),
    seo { title, description, noIndex, ogImage { ${imageFragment} } }
  }
`)

export const ARTICLE_SEO_QUERY = defineQuery(/* groq */ `
  *[${live} && slug.current == $slug && section->slug.current == $section][0]{
    title, deck, publishedAt,
    "authors": authors[]->{ name },
    hero { asset->{ url } },
    heroExternal { url },
    seo { title, description, noIndex, ogImage { asset->{ url } } }
  }
`)

export const ARTICLE_PATHS_QUERY = defineQuery(/* groq */ `
  *[${live} && defined(section->slug.current)]{
    "slug": slug.current,
    "section": section->slug.current
  }
`)

/** The article page's sidebar list. Newest first, excluding the piece on screen. */
export const ARTICLE_SIDEBAR_QUERY = defineQuery(/* groq */ `
  *[${live} && _id != $id] | order(publishedAt desc)[0...5]{ ${cardFragment} }
`)

/** Fills the "read next" list when an editor has not chosen related pieces. */
export const ARTICLE_FALLBACK_RELATED_QUERY = defineQuery(/* groq */ `
  *[${live} && _id != $id && section->slug.current == $section]
  | order(publishedAt desc)[0...3]{ ${cardFragment} }
`)

/* ------------------------------------------------------------------ *
 * Interviews, Talent Search, Archive
 * ------------------------------------------------------------------ */

export const COVER_STORIES_QUERY = defineQuery(/* groq */ `
  *[${live} && kind == "interview" && interviewMeta.isCoverStory == "cover"]
  | order(publishedAt desc)[0...50]{
    ${cardFragment},
    interviewMeta { subject, subjectBio, country }
  }
`)

export const TALENT_SEARCH_QUERY = defineQuery(/* groq */ `
  *[${live} && kind == "interview" && interviewMeta.isCoverStory == "talentSearch"]
  | order(publishedAt desc)[0...50]{
    ${cardFragment},
    interviewMeta { subject, subjectBio, country }
  }
`)

export const ARCHIVE_ISSUES_QUERY = defineQuery(/* groq */ `
  *[_type == "archiveIssue"] | order(issueDate desc){
    _id, title, "slug": slug.current, issueDate, issueNumber, pageCount,
    coverImage { ${imageFragment} },
    "articleCount": count(tableOfContents[defined(article)])
  }
`)

export const ARCHIVE_ISSUE_QUERY = defineQuery(/* groq */ `
  *[_type == "archiveIssue" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, issueDate, issueNumber, pageCount, pdfUrl,
    "pdfFile": pdfFile.asset->url,
    coverImage { ${imageFragment} },
    tableOfContents[]{
      _key, title, page, byline,
      "article": article->{
        title, "slug": slug.current,
        "section": section->{ name, "slug": slug.current }
      }
    }
  }
`)

export const ARCHIVE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "archiveIssue" && defined(slug.current)]{ "slug": slug.current }
`)

/* ------------------------------------------------------------------ *
 * Advertising
 * ------------------------------------------------------------------ */

export const ACTIVE_ADS_QUERY = defineQuery(/* groq */ `
  *[_type == "advertiser" && $slot in slots && activeFrom <= $today && activeTo >= $today]{
    _id, name, url, tier,
    creative { ${imageFragment} }
  }
`)

/* ------------------------------------------------------------------ *
 * Feeds and sitemap
 * ------------------------------------------------------------------ */

export const FEED_QUERY = defineQuery(/* groq */ `
  *[${live}] | order(publishedAt desc)[0...40]{
    title, "slug": slug.current, deck, publishedAt, sponsorTier,
    "section": section->{ name, "slug": slug.current },
    "authors": authors[]->{ name }
  }
`)

export const SITEMAP_QUERY = defineQuery(/* groq */ `{
  "articles": *[${live} && seo.noIndex != true]{
    "slug": slug.current, "section": section->slug.current, _updatedAt
  },
  "sections": *[_type == "section" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "tags": *[_type == "tag" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "authors": *[_type == "author" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "issues": *[_type == "archiveIssue" && defined(slug.current)]{ "slug": slug.current, _updatedAt }
}`)

/* ------------------------------------------------------------------ *
 * About page
 * ------------------------------------------------------------------ */

export const ABOUT_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0]{
    title, tagline, mission, scopeStatement, contactEmail,
    doctrinalStatement,
    masthead[]{
      role,
      "person": person->{ name, "slug": slug.current, role, bio, photo { ${imageFragment} } }
    }
  }
`)

export const POLICY_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0]{
    correctionsPolicy, privacyPolicy, contactEmail, scopeStatement,
    grievanceOfficer { name, email, address }
  }
`)
