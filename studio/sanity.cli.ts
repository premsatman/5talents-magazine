import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'wdzgdrz5',
    dataset: 'production',
  },
  // Auto-updates: a standalone Studio receives Sanity bugfixes and features
  // without a dependency bump or a redeploy. An embedded Studio cannot.
  autoUpdates: true,

  /**
   * TypeGen. Reads every GROQ query in the Next.js app and generates precise
   * result types from the deployed schema, so a query and its consumer can
   * never drift apart silently.
   *
   * Runs automatically during `sanity dev` and `sanity build`. To regenerate by
   * hand: `npm run typegen` in this folder.
   */
  typegen: {
    enabled: true,
    path: '../web/src/**/*.{ts,tsx}',
    schema: './schema.json',
    generates: '../web/src/sanity/types.generated.ts',
    overloadClientMethods: true,
  },
})
