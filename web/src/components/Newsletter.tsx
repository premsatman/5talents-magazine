import { NewsletterForm } from './NewsletterForm'

export function Newsletter({ compact = false }: { compact?: boolean }) {
  return (
    <section className="newsletter" id="newsletter">
      <div className="wrap">
        <h2>One good read, every Saturday</h2>
        <p>
          The cover story, two essays worth your time, and nothing else.
          {compact ? '' : ' No noise, no daily pings.'}
        </p>
        <NewsletterForm compact={compact} />
      </div>
    </section>
  )
}
