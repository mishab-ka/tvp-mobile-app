# TVP Driver Mobile App

React Expo mobile app for TVP drivers: Login, Register, and Home (profile) screens using Supabase.

## Setup

### 1. Environment

Copy `.env.example` to `.env` and set your Supabase URL and anon key (or use the existing `.env` if already configured).

### 2. Supabase

- **Table**: Uses existing `tvp_drivers` table. Add the profile photo column if not present:

  ```sql
  ALTER TABLE public.tvp_drivers
  ADD COLUMN IF NOT EXISTS profile_photo_url text NULL;
  ```

- **Storage**: Create a bucket named `driver-documents` in Supabase Dashboard (Storage). Configure RLS so authenticated users can upload (e.g. allow `insert` and `select` for `auth.role() = 'authenticated'` on that bucket).

- **Auth**: Email/password auth is used. To allow login immediately after sign-up (no email confirmation), in Supabase go to **Authentication → Providers → Email** and turn **Confirm email** off.

### 3. Run the app

```bash
npm install
npm start
```

Then open in Expo Go (Android/iOS) or run `npm run android` / `npm run ios` for a simulator.

## Screens

- **Login**: Email, password, Forgot password, Sign up.
- **Register**: Name, email, phone, alternative phone (optional), password, confirm password.
- **Home**: Profile details from `tvp_drivers` and logout.

Auth is linked by **email**: after login, the driver row is loaded where `tvp_drivers.email` matches the signed-in user’s email.
