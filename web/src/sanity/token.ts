import 'server-only'

export const readToken = process.env.SANITY_API_READ_TOKEN ?? ''
export const writeToken = process.env.SANITY_API_WRITE_TOKEN ?? ''
