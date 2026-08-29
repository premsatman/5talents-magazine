import type { StructureResolver } from 'sanity/structure'
import { CogIcon } from '@sanity/icons/Cog'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { UserIcon } from '@sanity/icons/User'
import { TagIcon } from '@sanity/icons/Tag'
import { BookIcon } from '@sanity/icons/Book'
import { CaseIcon } from '@sanity/icons/Case'
import { InboxIcon } from '@sanity/icons/Inbox'

/**
 * Studio navigation.
 *
 * Articles are grouped by `kind` rather than by document type, because the
 * content model uses one `article` type with a discriminator (blueprint s7).
 * Editors think in terms of "interviews" and "reviews"; the schema does not
 * need to.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('5Talents')
    .items([
      S.listItem()
        .title('Articles')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Articles')
            .items([
              S.listItem()
                .title('All articles')
                .icon(DocumentTextIcon)
                .child(S.documentTypeList('article').title('All articles')),
              S.divider(),
              S.listItem()
                .title('Cover stories & interviews')
                .child(
                  S.documentList()
                    .title('Interviews')
                    .filter('_type == "article" && kind == "interview"')
                    .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Features')
                .child(
                  S.documentList()
                    .title('Features')
                    .filter('_type == "article" && kind == "feature"'),
                ),
              S.listItem()
                .title('Reviews')
                .child(
                  S.documentList().title('Reviews').filter('_type == "article" && kind == "review"'),
                ),
              S.listItem()
                .title('Essays')
                .child(
                  S.documentList().title('Essays').filter('_type == "article" && kind == "essay"'),
                ),
              S.divider(),
              S.listItem()
                .title('From the archive')
                .child(
                  S.documentList()
                    .title('Republished from 2012-14')
                    .filter('_type == "article" && defined(archiveMeta.originalIssue)'),
                ),
              S.listItem()
                .title('Sponsored & supplied')
                .child(
                  S.documentList()
                    .title('Anything carrying a disclosure label')
                    .filter('_type == "article" && defined(sponsorTier) && sponsorTier != "none"'),
                ),
            ]),
        ),
      S.divider(),
      S.documentTypeListItem('author').title('Contributors').icon(UserIcon),
      S.documentTypeListItem('section').title('Sections').icon(TagIcon),
      S.documentTypeListItem('tag').title('Tags').icon(TagIcon),
      S.documentTypeListItem('archiveIssue').title('Archive issues').icon(BookIcon),
      S.documentTypeListItem('advertiser').title('Advertisers').icon(CaseIcon),
      S.divider(),
      S.listItem()
        .title('Submissions')
        .icon(InboxIcon)
        .child(
          S.documentList()
            .title('Pitches from the public form')
            .filter('_type == "submission"')
            .defaultOrdering([{ field: '_createdAt', direction: 'desc' }]),
        ),
      S.divider(),
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ])
