import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>Page not found</h1>
          <p>
            That address does not exist. It may have moved, or it may never have been here at all.
          </p>
        </div>
        <div className="prose">
          <p>
            Try the <Link href="/">homepage</Link>, the <Link href="/archive">archive of all 17
            back issues</Link>, or the <Link href="/interviews">cover stories</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
