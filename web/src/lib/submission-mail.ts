/**
 * Pitch-form email, via Resend.
 *
 * Two sends per submission, both fire-and-forget:
 *
 *   1. a notification to the editorial address, so a pitch does not sit unseen
 *      in the Studio inbox. Jesus Calls waited three weeks in September 2026
 *      because nothing here existed.
 *   2. an acknowledgement to the person who pitched.
 *
 * Neither can fail the submission. The document is already written to Sanity by
 * the time these run, and a contributor who got a "Pitch received" message must
 * not see an error because Resend was down. Failures are logged, nothing more.
 *
 * Sending domain is 5talentsmag.com, verified in Resend. `editorial@` is a real
 * mailbox, so replies to either message land somewhere a person reads - Resend
 * itself does not receive mail for this domain.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Default kept here rather than required in env: the address is not a secret. */
const EDITORIAL = process.env.EDITORIAL_EMAIL || 'editorial@5talentsmag.com'
const FROM = process.env.EDITORIAL_FROM || `5Talents Magazine <${EDITORIAL}>`

export type SubmissionMail = {
  name: string
  email: string
  country: string
  institution: string
  proposedSection: string
  pitchTitle: string
  pitch: string
  links: string
  documentId: string
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Paragraphs, not a <pre>: pitches arrive as plain text with blank lines. */
function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${esc(block).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

async function send(body: Record<string, unknown>): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error(`Resend submission mail failed: ${res.status} ${await res.text()}`)
    }
  } catch (error) {
    console.error('Resend submission mail failed', error)
  }
}

/**
 * To the desk. Reply-to is the contributor, so answering the notification
 * answers the pitch - no copying addresses out of the Studio.
 */
function notifyEditorial(data: SubmissionMail): Promise<void> {
  const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.replace(/\/$/, '')
  const link = studioUrl
    ? `${studioUrl}/structure/submissions;${data.documentId}`
    : `Document ID ${data.documentId}`

  const fields = [
    ['From', `${data.name} <${data.email}>`],
    ['Writing from', data.country],
    ['Institution', data.institution],
    ['Section', data.proposedSection || '(not chosen)'],
    ['Published work', data.links],
  ].filter(([, value]) => Boolean(value))

  const text = [
    `${data.pitchTitle}`,
    '',
    ...fields.map(([label, value]) => `${label}: ${value}`),
    '',
    '---',
    '',
    data.pitch,
    '',
    '---',
    '',
    link,
  ].join('\n')

  const html = [
    `<h2>${esc(data.pitchTitle)}</h2>`,
    '<ul>',
    ...fields.map(([label, value]) => `<li><strong>${esc(label)}:</strong> ${esc(value)}</li>`),
    '</ul>',
    '<hr>',
    paragraphs(data.pitch),
    '<hr>',
    studioUrl
      ? `<p><a href="${esc(link)}">Open in the Studio</a></p>`
      : `<p>${esc(link)}</p>`,
  ].join('\n')

  return send({
    from: FROM,
    to: [EDITORIAL],
    reply_to: data.email,
    subject: `Pitch: ${data.pitchTitle} - ${data.name}`,
    text,
    html,
  })
}

/**
 * To the contributor. The wording tracks /write-for-us - "everything is read,
 * we reply to what we can commission, usually within two weeks". Do not
 * promise a reply to every pitch here unless that page changes too.
 */
function acknowledge(data: SubmissionMail): Promise<void> {
  const text = [
    `Dear ${data.name},`,
    '',
    `Thank you for pitching "${data.pitchTitle}" to 5Talents Magazine. It has reached our desk and a person will read it.`,
    '',
    'Everything is read. We reply to what we can commission, usually within two weeks.',
    '',
    'There is no need to send it again in the meantime. If you want to add anything, reply to this message and it will reach the same place.',
    '',
    'With warm regards,',
    'The editors',
    '5Talents Magazine',
    'https://www.5talentsmag.com',
  ].join('\n')

  const html = [
    `<p>Dear ${esc(data.name)},</p>`,
    `<p>Thank you for pitching &ldquo;${esc(data.pitchTitle)}&rdquo; to 5Talents Magazine. It has reached our desk and a person will read it.</p>`,
    '<p>Everything is read. We reply to what we can commission, usually within two weeks.</p>',
    '<p>There is no need to send it again in the meantime. If you want to add anything, reply to this message and it will reach the same place.</p>',
    '<p>With warm regards,<br>The editors<br>5Talents Magazine<br><a href="https://www.5talentsmag.com">5talentsmag.com</a></p>',
  ].join('\n')

  return send({
    from: FROM,
    to: [data.email],
    reply_to: EDITORIAL,
    subject: 'We have your pitch - 5Talents Magazine',
    text,
    html,
  })
}

/** Both sends, never throwing. Call after the Sanity write has succeeded. */
export async function mailSubmission(data: SubmissionMail): Promise<void> {
  await Promise.allSettled([notifyEditorial(data), acknowledge(data)])
}
