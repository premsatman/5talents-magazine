/**
 * Minimal types for the `web-push` package, which ships none of its own.
 *
 * Only what src/lib/push.ts calls. Deliberately not @types/web-push: adding
 * that package would duplicate these declarations and tsc would complain about
 * both. If the sender ever needs more of the API, widen this file rather than
 * installing the types package.
 */
declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  export class WebPushError extends Error {
    statusCode: number
    headers: Record<string, string>
    body: string
    endpoint: string
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | null,
    options?: { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high'; topic?: string },
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>

  const _default: {
    setVapidDetails: typeof setVapidDetails
    sendNotification: typeof sendNotification
    WebPushError: typeof WebPushError
  }
  export default _default
}
