export const STORAGE_BUCKETS = {
  // For note attachments (should be private in future)
  ATTACHMENTS:
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || 'DigiFile_Public',
  // For organization assets like logos and consent templates (currently public)
  ASSETS: process.env.NEXT_PUBLIC_SUPABASE_ASSETS_BUCKET || 'DigiFile_Public',
} as const;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;

export function getBucket(name: StorageBucketKey): string {
  return STORAGE_BUCKETS[name];
}
