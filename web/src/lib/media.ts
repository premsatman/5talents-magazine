/**
 * Image and ad sizing.
 *
 * Measured off relevantmagazine.com on 28 Aug 2026 at a 1955px viewport, by
 * reading the rendered dimensions of all 88 images on the homepage. Their whole
 * system reduces to five aspect ratios, and the sizes below are the ones that
 * actually recur.
 *
 *   ratio   count  rendered at            used for
 *   3:4     3      396 x 520              the three hero cards
 *   16:10   12     585x364, 810x504       section feature card
 *   5:4     30     278x225, 400x324       the workhorse card
 *   3:2     5      216x144                compact row under the hero
 *   1:1     34     337x337, 90x90         square promo, list thumbnails
 *
 * Keeping this in one file matters more than the individual numbers: cards that
 * drift apart in ratio are what makes a grid look homemade.
 */

export type CardShape = 'portrait' | 'feature' | 'standard' | 'compact' | 'square' | 'thumb'

type Spec = {
  /** Width requested from the Sanity CDN. Roughly 2x the rendered size. */
  width: number
  height: number
  /** CSS aspect-ratio, so the box reserves its space before the image loads. */
  ratio: string
  sizes: string
}

export const SHAPES: Record<CardShape, Spec> = {
  // Hero row. Portrait crops carry a face better than landscape ones, which is
  // why Relevant uses them for the three lead stories and nowhere else.
  portrait: { width: 800, height: 1066, ratio: '3 / 4', sizes: '(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 400px' },

  // One per section block.
  feature: { width: 1200, height: 750, ratio: '16 / 10', sizes: '(max-width: 800px) 100vw, 600px' },

  // The default. Anything without a reason to be another shape is this.
  standard: { width: 800, height: 640, ratio: '5 / 4', sizes: '(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 290px' },

  // The five-across row under the hero.
  compact: { width: 640, height: 426, ratio: '3 / 2', sizes: '(max-width: 700px) 45vw, 220px' },

  square: { width: 680, height: 680, ratio: '1 / 1', sizes: '(max-width: 700px) 45vw, 340px' },

  // List rows in the rail and the long tail.
  thumb: { width: 180, height: 180, ratio: '1 / 1', sizes: '90px' },
}

/**
 * Ad slots, at the sizes and positions measured on the same pass.
 *
 * Their placement rule turned out to be simple and worth copying: a 728x90
 * leaderboard immediately before every section heading, and nowhere else in the
 * flow. Eleven of them down an 18,000px page, at 73, 905, 1448, 3454, 4708,
 * 7281, 8517, 9714, 10939, 12193 and 17627px. Plus one 293x505 tall unit in the
 * rail and one 337x337 square.
 *
 * The blueprint's warning still stands and is why slot A is off by default: an
 * above-fold leaderboard is the most reliable way to wreck LCP and CLS. Relevant
 * runs one at 73px. You do not have to.
 */
export const AD_SIZES = {
  // Billboard. The highest-CPM display unit there is, and the riskiest place to
  // put it - 250px of above-fold height is a direct hit on LCP and CLS. Reserved
  // properly here, and still off by default in siteSettings.
  A: { w: 970, h: 250, label: 'Billboard', accepts: ['970×250', '970×90', '728×90', '320×100'] },

  // In-article units float left with the text wrapping beside them, so they are
  // rectangles rather than leaderboards. A 728-wide banner spans the whole
  // measure and can only sit between paragraphs; 336x280 leaves roughly 320px
  // of text alongside, which is a readable column and the shape advertisers
  // most want after the leaderboard.
  B: { w: 336, h: 280, label: 'Large rectangle', accepts: ['336×280', '300×250'] },
  C: { w: 336, h: 280, label: 'Large rectangle', accepts: ['336×280', '300×250'] },

  D: { w: 300, h: 600, label: 'Half page', accepts: ['300×600', '300×250'] },
  E: { w: 336, h: 280, label: 'Large rectangle', accepts: ['336×280', '300×250'] },

  /**
   * Large leaderboard between section blocks. 970 wide sits inside the 1200px
   * measure with margin either side, and steps to 728 on narrower screens.
   *
   * On a phone it becomes a 320x100 large mobile banner rather than the 320x50
   * it used to collapse to. Stretched to phone width a 90px unit reads as a
   * horizontal rule rather than an advertisement, which is worth nothing to
   * sell - the height is what makes it an ad, not the width.
   */
  F: { w: 970, h: 90, label: 'Large leaderboard', accepts: ['970×90', '728×90', '320×100'] },


  /**
   * Gutter skyscrapers, fixed in the empty margins either side of the 1200px
   * measure. Relevant runs the same pair.
   *
   * They appear only above 1500px, where there is genuinely 150px of dead space
   * on each side. Below that they are not rendered at all — not shrunk, not
   * repositioned. A fixed-position ad crowding a narrow screen is what Google
   * classes as an intrusive interstitial, and it is a ranking problem rather
   * than a taste one.
   */
  I: { w: 160, h: 600, label: 'Left skyscraper', accepts: ['160×600', '120×600'] },
  J: { w: 160, h: 600, label: 'Right skyscraper', accepts: ['160×600', '120×600'] },
} as const

export type SlotId = keyof typeof AD_SIZES
