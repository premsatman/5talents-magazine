import { article } from './article'
import { author } from './author'
import { section } from './section'
import { tag } from './tag'
import { archiveIssue } from './archiveIssue'
import { advertiser } from './advertiser'
import { submission } from './submission'
import { siteSettings } from './siteSettings'
import { blockContent } from './blockContent'
import { externalImage } from './externalImage'

export const schemaTypes = [
  // Documents
  article,
  author,
  section,
  tag,
  archiveIssue,
  advertiser,
  submission,
  siteSettings,
  // Objects
  blockContent,
  externalImage,
]
