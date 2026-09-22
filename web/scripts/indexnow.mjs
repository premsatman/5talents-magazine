#!/usr/bin/env node
/**
 * Tell IndexNow search engines (Bing, Yandex, Naver, Seznam, Yep; Yahoo,
 * DuckDuckGo and Ecosia via Bing) that pages are new or changed.
 * Google does not take part - use Search Console "Request indexing" for it.
 *
 *   node scripts/indexnow.mjs https://www.5talentsmag.com/screen/some-slug [more urls]
 *
 * The key is public by design: IndexNow proves ownership by fetching
 * https://www.5talentsmag.com/<key>.txt, which lives in web/public/.
 * Ping only live pages (after publishedAt). Pinging a 404 wastes trust.
 */
const KEY = 'b26d72876fb816a1df92ee9f19d6be05'
const HOST = 'www.5talentsmag.com'
const urls = process.argv.slice(2)
if (!urls.length) { console.error('usage: node scripts/indexnow.mjs <url> [url...]'); process.exit(1) }
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
})
console.log(res.status, res.status === 200 || res.status === 202 ? 'accepted' : await res.text())
