import Link from 'next/link'

export function SectionHead({
  title,
  href,
  linkText,
}: {
  title: string
  href?: string
  linkText?: string
}) {
  return (
    <div className="sechead">
      <h2 className="brush-rule">{title}</h2>
      {href && (
        <Link href={href}>
          {linkText ?? 'See all'} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  )
}
