import { stegaClean } from 'next-sanity'

/**
 * The golden rule of stega: if a string controls logic - a comparison, a lookup
 * key, an array membership test - it must be cleaned first, or it will behave
 * correctly in production and mysteriously fail inside the Presentation tool.
 *
 * Use `clean()` on any value you are about to compare, index by, or put in a
 * <head> tag. Leave display strings alone so click-to-edit keeps working.
 */
export function clean<T>(value: T) {
  return stegaClean(value)
}
