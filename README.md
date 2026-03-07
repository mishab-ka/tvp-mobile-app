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

- **Auth**: Email/password auth is used. Ensure Supabase Auth is enabled and, if you use email confirmation, drivers can still complete registration (the app inserts into `tvp_drivers` after sign-up).

### 3. Run the app

```bash
npm install
npm start
```

Then open in Expo Go (Android/iOS) or run `npm run android` / `npm run ios` for a simulator.

## Screens

- **Login**: Email, password, Forgot password, Sign up.
- **Register**: Name, email, phone, alternative phone (optional), profile photo, Aadhar (front/back), driving licence (front/back), Uber profile photo(s), password, confirm password.
- **Home**: Profile details from `tvp_drivers` and logout.

Auth is linked by **email**: after login, the driver row is loaded where `tvp_drivers.email` matches the signed-in user’s email.
