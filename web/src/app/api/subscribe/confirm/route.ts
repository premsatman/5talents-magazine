import { NextResponse, type NextRequest } from 'next/server'
import { confirm } from '@/lib/subscribers'

/** Link from the confirmation email. Always lands on a page, never on JSON. */
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const target = new URL('/newsletter/confirmed', req.url)

  try {
    const result = await confirm(token.slice(0, 200))
    target.searchParams.set('status', result.status)
  } catch (error) {
    console.error('Confirm failed', error)
    target.searchParams.set('status', 'error')
  }

  return NextResponse.redirect(target, { status: 303 })
}
