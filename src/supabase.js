const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

export async function dbGet(key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tracker_data?key=eq.${key}&select=value`,
    { headers }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0]?.value ?? null
}

export async function dbSet(key, value) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tracker_data`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${res.status}: ${err}`)
  }
  return true
}
