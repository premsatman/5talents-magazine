import 'server-only'

/**
 * Newsletter subscribers live in Supabase, in the same table PS.Today sends
 * from (project "pstoday+crb"). 5Talents Weekly is sent from the PS.Today admin.
 *
 * Each reader has one row and one switch per letter. This site only ever turns
 * on `fivetalents_weekly`; it never opts anyone into PS.Today's own emails.
 *
 * All the logic is in two Postgres functions (migration
 * 20261029120000_fivetalents_weekly.sql in the pstoday2 repo), called over
 * PostgREST with the service key. No Supabase SDK, so no new dependency here.
 *
 *   fivetalents_subscribe(p_email, p_source) -> { status, token? }
 *   fivetalents_confirm(p_token)             -> { status, email? }
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Server only - the service key
 * bypasses row-level security and must never reach the browser.
 */

export type SubscribeStatus = 'subscribed' | 'confirm' | 'pending' | 'undeliverable' | 'invalid'
export type ConfirmStatus = 'confirmed' | 'expired' | 'invalid'

export class SubscribersUnavailable extends Error {}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new SubscribersUnavailable('Supabase is not configured')

  let res: Response
  try {
    res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
    })
  } catch (error) {
    throw new SubscribersUnavailable(`Supabase unreachable: ${String(error)}`)
  }

  if (!res.ok) {
    throw new SubscribersUnavailable(`Supabase ${fn} failed: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as T
}

export function subscribe(email: string, source = '5talentsmag_web') {
  return rpc<{ status: SubscribeStatus; token?: string }>('fivetalents_subscribe', {
    p_email: email,
    p_source: source,
  })
}

export function confirm(token: string) {
  return rpc<{ status: ConfirmStatus; email?: string }>('fivetalents_confirm', {
    p_token: token,
  })
}

/* ---------------------------------------------------------------- email -- */

const FROM = process.env.NEWSLETTER_FROM || '5Talents Weekly <editorial@5talentsmag.com>'
const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || 'prem@5talentsmag.com'

/**
 * The double opt-in email. Table layout and inline styles, same palette as the
 * weekly letter: Charcoal #171717, Lemon #FFF21A, Electric Lavender #A66BFF.
 */
export async function sendConfirmation(email: string, confirmUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new SubscribersUnavailable('Resend is not configured')

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#EFE6FF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFE6FF;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;color:#171717;">
  <tr><td style="background:#171717;padding:20px 24px;">
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:38px;line-height:36px;color:#FFFFFF;letter-spacing:0.02em;">5TALENTS <span style="background:#FFF21A;color:#171717;padding:0 8px;">WEEKLY</span></div>
  </td></tr>
  <tr><td style="padding:26px 24px 8px 24px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-weight:bold;font-size:24px;line-height:30px;">One click and you are in</div>
    <div style="font-size:15px;line-height:23px;color:#333333;padding-top:12px;">Confirm this address and every Saturday evening you will get everything 5Talents Magazine published that week.</div>
  </td></tr>
  <tr><td style="padding:18px 24px 6px 24px;">
    <a href="${confirmUrl}" style="display:inline-block;background:#FFF21A;color:#171717;font-weight:bold;font-size:15px;text-decoration:none;padding:13px 22px;">Confirm my subscription</a>
  </td></tr>
  <tr><td style="padding:14px 24px 26px 24px;font-size:12px;line-height:18px;color:#6B6B6B;border-top:3px solid #A66BFF;">
    The link works for seven days. If you did not ask for this, ignore this email and nothing will happen.
    <br><br>5Talents Magazine, Hyderabad, Telangana, India &middot; <a href="https://5talentsmag.com" style="color:#6B6B6B;">5talentsmag.com</a>
  </td></tr>
</table>
</td></tr></table></body></html>`

  const text = `Confirm your 5Talents Weekly subscription:\n\n${confirmUrl}\n\nEvery Saturday evening you will get everything 5Talents Magazine published that week. The link works for seven days. If you did not ask for this, ignore this email.\n\n5Talents Magazine, Hyderabad, India - 5talentsmag.com`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject: 'Confirm your 5Talents Weekly subscription',
      html,
      text,
    }),
  })
  if (!res.ok) {
    throw new SubscribersUnavailable(`Resend confirmation failed: ${res.status} ${await res.text()}`)
  }
}
