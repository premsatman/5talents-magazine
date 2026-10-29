import { NewsletterForm } from './NewsletterForm'

export function Newsletter({ compact = false }: { compact?: boolean }) {
  return (
    <section className="newsletter" id="newsletter">
      <div className="wrap">
        <h2>5Talents Weekly, every Saturday</h2>
        <p>
          Everything we published this week, in one email on Saturday evening.
          {compact ? '' : ' No noise, no daily pings.'}
        </p>
        <NewsletterForm compact={compact} />
      </div>
    </section>
  )
}
