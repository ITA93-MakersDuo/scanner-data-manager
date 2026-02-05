import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const bucketName = process.env.SUPABASE_BUCKET || 'scans';

export const supabase = createClient(supabaseUrl, supabaseKey);
export const BUCKET_NAME = bucketName;

export async function uploadFile(filePath: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, { contentType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return filePath;
}

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) console.error(`Delete failed: ${error.message}`);
}
