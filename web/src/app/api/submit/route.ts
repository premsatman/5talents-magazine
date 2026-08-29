import { createClient } from 'next-sanity'
import { NextResponse, type NextRequest } from 'next/server'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { writeToken } from '@/sanity/token'
import { clientIp, rateLimit, verifyTurnstile } from '@/lib/rate-limit'
import { SECTION_SLUGS } from '@/lib/sections'

/**
 * The pitch form's server route.
 *
 * Blueprint s7: a public form cannot write to Sanity from the browser without
 * exposing a write token. The token lives here, server-side, and never reaches
 * the client. Three defences in front of it, because unauthenticated writes into
 * the dataset are a spam vector that will consume the document quota:
 *
 *   1. honeypot field
 *   2. per-IP rate limit
 *   3. Turnstile, when configured
 *
 * Submissions land as `submission` documents, so contributors never need a
 * Sanity seat (trigger 2).
 */
export const runtime = 'nodejs'

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  if (!writeToken) {
    return NextResponse.json(
      { message: 'The submission form is not configured yet. Please email us instead.' },
      { status: 503 },
    )
  }

  const ip = clientIp(req.headers)
  const limit = rateLimit(`submit:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.ok) {
    return NextResponse.json(
      { message: 'That is a lot of pitches at once. Try again in an hour.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSeconds) } },
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ message: 'Could not read that submission.' }, { status: 400 })
  }

  // Honeypot. A real person never fills this in; it is off-screen.
  if (str(payload.company, 200)) {
    // Answer as if it succeeded. Telling a bot it failed teaches it to retry.
    return NextResponse.json({ message: 'Pitch received.' })
  }

  const passedTurnstile = await verifyTurnstile(
    str(payload['cf-turnstile-response'], 4000) || undefined,
    ip,
  )
  if (!passedTurnstile) {
    return NextResponse.json(
      { message: 'The spam check did not pass. Reload the page and try once more.' },
      { status: 400 },
    )
  }

  const name = str(payload.name, 120)
  const email = str(payload.email, 200)
  const pitch = str(payload.pitch, 4000)
  const pitchTitle = str(payload.pitchTitle, 160)

  if (!name || !email || !pitchTitle || pitch.length < 80) {
    return NextResponse.json(
      { message: 'Name, email, a working title and a pitch of at least 80 characters, please.' },
      { status: 400 },
    )
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: 'That email address does not look right.' }, { status: 400 })
  }

  const proposedSection = str(payload.proposedSection, 40)

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token: writeToken,
    useCdn: false,
  })

  try {
    await client.create({
      _type: 'submission',
      name,
      email,
      country: str(payload.country, 80),
      institution: str(payload.institution, 160),
      proposedSection: (SECTION_SLUGS as readonly string[]).includes(proposedSection)
        ? proposedSection
        : '',
      pitchTitle,
      pitch,
      links: str(payload.links, 1200),
      status: 'new',
      submittedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { message: 'We could not save that. Please try again, or email us directly.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ message: 'Pitch received.' })
}
