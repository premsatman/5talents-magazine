import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { structure } from './lib/structure'

export default defineConfig({
  name: 'default',
  title: '5Talents Magazine',

  projectId: 'wdzgdrz5',
  dataset: 'production',

  plugins: [structureTool({ structure }), visionTool()],

  schema: {
    types: schemaTypes,
    // siteSettings is a singleton - it should never appear in the "create new" menu.
    // So is the Rewind show: the site renders one fixed id (podcast-rewind).
    templates: (prev) =>
      prev.filter((t) => t.schemaType !== 'siteSettings' && t.schemaType !== 'podcastShow'),
  },

  document: {
    actions: (prev, { schemaType }) =>
      schemaType === 'siteSettings'
        ? prev.filter(({ action }) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
