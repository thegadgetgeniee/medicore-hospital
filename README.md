# MediCore — Hospital Operations System (Online)

A complete, multi-user hospital management system with **real login credentials**, online database, OPD and Pharmacy modules. Deploys live on Vercel in about 15 minutes.

---

## 🧩 What's Included

**Authentication:** Real email/password login, signup, forgot-password — powered by Supabase Auth. Every staff member gets their own account and role (Admin, Doctor, Pharmacist, Receptionist, Nurse).

**OPD Module:** Appointments with auto-token numbers, patient registry with auto-generated UHID, digital prescriptions, full visit history per patient, OPD billing with GST, services & charges, health packages.

**Pharmacy Module:** Drug inventory with stock tracking, low-stock alerts, GST-compliant billing (CGST + SGST breakdown), prescriptions sent directly from OPD doctor visits into the pharmacy queue.

**Management:** Doctors and staff directories.

All data lives in a real PostgreSQL database (Supabase) — accessible from any device, any browser, anywhere online.

---

## 🚀 Step 1: Create your Supabase project (5 min)

1. Go to **[supabase.com](https://supabase.com)** → Sign up (free) → **New Project**
2. Pick a name (e.g. `medicore-hospital`), set a database password (save it somewhere), choose the region closest to you
3. Wait ~2 minutes for the project to spin up
4. In the left sidebar, go to **SQL Editor** → **New Query**
5. Open `supabase/schema.sql` from this project, copy **the entire file**, paste it into the SQL editor, click **Run**
6. You should see "Success. No rows returned" — your database, tables, security rules, and seed data (doctors, services, medicines) are now ready

7. Go to **Settings → API** in the sidebar. Copy two values:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

---

## 🚀 Step 2: Configure environment variables

1. In this project folder, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and paste your Supabase values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key...
   ```

---

## 🚀 Step 3: Run locally to test (optional but recommended)

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` → it redirects to `/auth/login`. Click **Create account**, register yourself (e.g. as Admin), then log in. You'll land on the Dashboard with the seeded doctors, services, and medicines already there.

---

## 🚀 Step 4: Deploy to Vercel (5 min)

### Option A — via GitHub (recommended)
1. Push this project to a new GitHub repository
2. Go to **[vercel.com/new](https://vercel.com/new)** → Import your repository
3. In **Environment Variables**, add the same two keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

### Option B — via Vercel CLI
```bash
npm install -g vercel
vercel
# follow prompts, then add env vars when asked, or run:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

Once deployed, Vercel gives you a live URL like `https://medicore-hospital.vercel.app` — open it from any device and log in.

---

## 👤 Creating staff accounts

Anyone can self-register from the login page's **Create account** link, choosing their role (Admin / Doctor / Pharmacist / Receptionist / Nurse). For a real hospital rollout, you'd typically:

1. Have each staff member sign up with their hospital email
2. As Admin, go to **Supabase Dashboard → Authentication → Users** to view/manage all accounts, or to **Table Editor → profiles** to change someone's role directly
3. (Optional) Disable public sign-ups later via **Supabase → Authentication → Settings** and invite users by email instead, if you want tighter control over who can join

---

## 🔐 Security notes

- Row Level Security (RLS) is enabled on every table — only logged-in (authenticated) users can read or write data
- Passwords are hashed and managed entirely by Supabase Auth — this app never sees or stores raw passwords
- The `anon` key is safe to expose in frontend code by design; it only allows the actions your RLS policies permit
- For production use with sensitive patient data, consider enabling Supabase's **email confirmation** requirement (Authentication → Settings) and adding row-level policies scoped to specific roles (e.g. only Admins can delete doctors) — the current setup gives all authenticated staff full access for simplicity

---

## 🗂️ Project Structure

```
medicore-online/
├── supabase/schema.sql          ← run this once in Supabase SQL editor
├── src/
│   ├── middleware.ts            ← protects all routes, redirects to login
│   ├── lib/supabase/            ← client + server Supabase connectors
│   ├── components/layout/       ← Sidebar, Topbar, shared layout
│   ├── components/ui/Toast.tsx  ← notification system
│   └── app/
│       ├── auth/login/          ← login, signup, forgot password
│       ├── dashboard/           ← live stats overview
│       ├── appointments/        ← booking, token queue, status
│       ├── patients/            ← registry, visit/Rx, history
│       ├── opd-billing/         ← GST billing with services/packages
│       ├── doctors/ staff/      ← management
│       ├── services/ packages/  ← charges & bundles
│       └── pharmacy/
│           ├── (dashboard)      ← pending Rx queue, low stock
│           ├── inventory/       ← drug stock, HSN, expiry
│           └── sales/           ← GST billing (CGST+SGST), history
```

---

## 🆘 Troubleshooting

**"Invalid API key" on login** → double check you copied the `anon public` key (not the `service_role` key) into `.env.local` / Vercel env vars.

**Redirect loop to /auth/login** → make sure the SQL schema ran successfully and the `profiles` table trigger (`handle_new_user`) was created — it auto-creates a profile row when someone signs up.

**Changes to env vars not showing on Vercel** → after adding/editing environment variables in Vercel, you must **redeploy** for them to take effect.

**Want to reset all data** → in Supabase, go to **SQL Editor** and run `TRUNCATE patients, appointments, visits, opd_bills, pharmacy_bills, pharmacy_orders CASCADE;` then re-run the seed `INSERT` statements from the bottom of `schema.sql` if you want fresh demo data.
