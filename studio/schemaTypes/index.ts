import { article } from './article'
import { author } from './author'
import { section } from './section'
import { tag } from './tag'
import { archiveIssue } from './archiveIssue'
import { onlineIssue } from './onlineIssue'
import { advertiser } from './advertiser'
import { submission } from './submission'
import { siteSettings } from './siteSettings'
import { blockContent } from './blockContent'
import { externalImage } from './externalImage'
import { spotifyCard, youtubeCard, bookCard, linkCard } from './endCards'

export const schemaTypes = [
  // Documents
  article,
  author,
  section,
  tag,
  archiveIssue,
  onlineIssue,
  advertiser,
  submission,
  siteSettings,
  // Objects
  blockContent,
  externalImage,
  // End-of-article cards a contributor can attach to their own piece
  spotifyCard,
  youtubeCard,
  bookCard,
  linkCard,
]
