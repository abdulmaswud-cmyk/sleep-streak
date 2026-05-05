## Supabase setup for Sleep Streaks

This project now supports:

- Email/password authentication
- User profile creation and updates
- Persisted sleep goals/preferences
- Persisted daily check-ins
- Row-level security (RLS) to isolate each user's data

---

### 1) Create tables and policies in Supabase

1. Open your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Create a **New query**.
4. Paste the full contents of `supabase-schema.sql`.
5. Click **Run**.

This creates:

- `public.user_profiles`
- `public.sleep_checkins`
- trigger for `updated_at`
- RLS policies tied to `auth.uid()`

---

### 2) Environment values

The project now uses `.env.local` keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`supabaseClient.js` reads these at runtime from:

- `window.__ENV__.NEXT_PUBLIC_SUPABASE_URL`
- `window.__ENV__.NEXT_PUBLIC_SUPABASE_ANON_KEY`

To avoid hardcoded credentials in the client, ensure your runtime injects these values into `window.__ENV__` before `supabaseClient.js` executes.

---

### 3) How data flow works now

- **Auth**
  - Sign up / sign in from Intro screen
  - Session persisted by Supabase client

- **Profile CRUD**
  - Create/update profile via onboarding and settings
  - Read profile after sign-in to hydrate UI
  - Fields include display name, goals, theme, reminder, nudges, alarms

- **Check-ins CRUD**
  - Upsert check-ins by day when bedtime/wake buttons are used
  - Read check-ins on load for tracker/history/stats
  - Delete today's check-ins via "Clear today's check-ins" button

---

### 4) Files added/updated

- `supabase-schema.sql` (DB schema + RLS policies)
- `supabaseClient.js` (Supabase client initialization)
- `script.js` (auth + profile/check-in CRUD integration)
- `index.html` (auth/DB status UI, Supabase script wiring)
- `styles.css` (auth/database state styles)
- `.env.local` (provided project credentials)

