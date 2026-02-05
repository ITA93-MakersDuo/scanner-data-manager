const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '').trim().replace(/\s+/g, '');
const bucketName = (process.env.SUPABASE_BUCKET || 'scans').trim();

export const BUCKET_NAME = bucketName;

export async function uploadFile(filePath: string, fileBuffer: Buffer, contentType: string): Promise<string> {
  const url = `${supabaseUrl}/storage/v1/object/${bucketName}/${filePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  return filePath;
}

export function getPublicUrl(filePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
}

export async function deleteFile(filePath: string): Promise<void> {
  const url = `${supabaseUrl}/storage/v1/object/${bucketName}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [filePath] }),
  });

  if (!response.ok) {
    console.error(`Delete failed: ${await response.text()}`);
  }
}
