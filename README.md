# Kendrick Tracker — 2669 Kendrick Circle

Listing prep tracker for 2669 Kendrick Circle, San Jose CA 95121.

## URLs

- **Client view (read-only):** `https://your-app.vercel.app`
- **Edit mode (you only):** `https://your-app.vercel.app?edit`

## Setup

### 1. Supabase — run this SQL first
Go to Supabase → SQL Editor and run `supabase-setup.sql`

### 2. Install & run locally
```bash
npm install
npm run dev
```

### 3. Push to GitHub
```bash
git init
git remote add origin git@github.com:bryanthuang/kendrick-tracker.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel
1. Go to vercel.com → New Project → Import from GitHub → select `kendrick-tracker`
2. Add these environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` = `https://rshjejoxgvpjbwcznfht.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (your anon key)
3. Deploy — done!

## How it works

- All data is stored in Supabase (shared, real-time)
- No login required
- Add `?edit` to the URL to enter edit mode (bookmark this for yourself)
- Share the plain URL with Castor & Alicia for read-only view
