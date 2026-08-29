import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/client'
import { readToken } from '@/sanity/token'

/** Powers the Presentation tool and Visual Editing in the Studio. */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken }),
})
