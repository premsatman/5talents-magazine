import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { NewsletterForm } from '@/components/NewsletterForm'

export const metadata: Metadata = {
  title: 'Newsletter',
  robots: { index: false, follow: false },
}

const COPY: Record<string, { title: string; body: string; retry?: boolean }> = {
  confirmed: {
    title: 'You are in',
    body: '5Talents Weekly arrives every Saturday evening with everything we published that week. Add editorial@5talentsmag.com to your contacts so it lands in your inbox.',
  },
  expired: {
    title: 'That link has expired',
    body: 'Confirmation links last seven days. Enter your email again and we will send a fresh one.',
    retry: true,
  },
  invalid: {
    title: 'That link has already been used',
    body: 'If you clicked it before, you are already subscribed. If not, enter your email and we will send a new link.',
    retry: true,
  },
  error: {
    title: 'Something went wrong on our side',
    body: 'We could not confirm you just now. Please click the link in the email again in a minute.',
  },
}

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const copy = COPY[status ?? ''] ?? COPY.invalid

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className="pagehead">
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        {copy.retry ? (
          <section className="newsletter" id="newsletter">
            <div className="wrap">
              <NewsletterForm />
            </div>
          </section>
        ) : (
          <p>
            <Link href="/">Read this week&apos;s stories</Link>
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
