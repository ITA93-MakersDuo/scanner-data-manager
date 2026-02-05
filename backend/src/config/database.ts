const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '').trim().replace(/\s+/g, '');

const REST_URL = `${supabaseUrl}/rest/v1`;

function getHeaders(prefer?: string): Record<string, string> {
  return {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { 'Prefer': prefer } : {}),
  };
}

export async function restGet(table: string, query: string = ''): Promise<any[]> {
  const url = `${REST_URL}/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${table} failed: ${text}`);
  }
  return await res.json() as any[];
}

export async function restInsert(table: string, body: any): Promise<any> {
  const url = `${REST_URL}/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders('return=representation'),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`INSERT ${table} failed: ${text}`);
  }
  const result = await res.json();
  if (Array.isArray(body)) return result;
  return Array.isArray(result) ? result[0] : result;
}

export async function restUpdate(table: string, query: string, body: any): Promise<any> {
  const url = `${REST_URL}/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders('return=representation'),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UPDATE ${table} failed: ${text}`);
  }
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

export async function restDelete(table: string, query: string): Promise<void> {
  const url = `${REST_URL}/${table}?${query}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${table} failed: ${text}`);
  }
}

export async function restCount(table: string, query: string = ''): Promise<number> {
  const url = `${REST_URL}/${table}?select=id&limit=0${query ? '&' + query : ''}`;
  const res = await fetch(url, {
    headers: getHeaders('count=exact'),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`COUNT ${table} failed: ${text}`);
  }
  const contentRange = res.headers.get('content-range');
  if (contentRange) {
    const total = contentRange.split('/')[1];
    return parseInt(total, 10) || 0;
  }
  return 0;
}
