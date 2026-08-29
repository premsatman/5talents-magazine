/** The brush stroke under the masthead, from design/wordmark.svg. */
export function BrushStroke({ className = 'stroke-under' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 460 34" aria-hidden="true" preserveAspectRatio="none">
      <path
        fill="#FDEF0A"
        d="M2,12 C68,6 138,10 208,4 C278,-2 348,2 415,-4 L412,26 C348,33 278,28 208,34 C138,40 68,35 5,42 Z"
      />
    </svg>
  )
}
