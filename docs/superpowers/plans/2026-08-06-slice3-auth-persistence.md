# Slice 3 — Auth + Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working email/password auth (Supabase, confirmation on) with cookie sessions, protected routes, designed Sign Up / Log In screens, and the full Phase 1 database schema + RLS.

**Architecture:** `@supabase/ssr` cookie sessions across the Next 16 App Router — browser client, server client, and a middleware session-refresh helper. Auth runs in server actions. Pure helpers (validation, protected-path check) are unit-tested; the auth flow and RLS are verified live against the user's Supabase project.

**Tech Stack:** `@supabase/ssr` 0.12.x, `@supabase/supabase-js` 2.x, Next.js 16, Radix UI, Vitest.

## Global Constraints

- Supabase only via `src/lib/supabase/*`. Server client in server components + actions; browser client in client components.
- Env (`.env.local`, gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `SUPABASE_SERVICE_ROLE_KEY` (secret key).
- TypeScript strict, `.ts`/`.tsx` only. No inline styles. Tailwind tokens only (no arbitrary values). Radix for interactive primitives.
- Protected routes: `/dashboard`, `/playlist/*`, `/history`, `/favourites`, `/settings`.
- Design: dark, gold accents, Playfair wordmark, DM Sans UI, gold focus borders (PROMPTS.md S07/S08).
- Schema + RLS exactly per DATA.md. Frequent commits, one per task.

---

### Task 1: Install Supabase + write clients

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Modify: `package.json` (deps)

**Interfaces:**
- Produces:
  - `client.ts`: `export function createClient()` → browser `SupabaseClient` via `createBrowserClient(url, anonKey)`.
  - `server.ts`: `export async function createClient()` → server `SupabaseClient` via `createServerClient(url, anonKey, { cookies })` bound to `next/headers` `cookies()`.

- [ ] **Step 1: Install**

```bash
npm i @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Write `client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Write `server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component — safe to ignore; middleware refreshes.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean).
```bash
git add -A && git commit -m "feat: Supabase browser + server clients (@supabase/ssr)"
```

---

### Task 2: Protected-path helper (TDD)

**Files:**
- Create: `src/lib/auth/protected.ts`
- Test: `src/lib/auth/protected.test.ts`

**Interfaces:**
- Produces: `PROTECTED_PREFIXES: string[]` and `isProtectedPath(pathname: string): boolean` — true when pathname equals or is nested under any protected prefix.

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from "vitest";
import { isProtectedPath } from "@/lib/auth/protected";

test("guards dashboard", () => expect(isProtectedPath("/dashboard")).toBe(true));
test("guards nested playlist", () => expect(isProtectedPath("/playlist/abc")).toBe(true));
test("guards history/favourites/settings", () => {
  expect(isProtectedPath("/history")).toBe(true);
  expect(isProtectedPath("/favourites")).toBe(true);
  expect(isProtectedPath("/settings")).toBe(true);
});
test("allows public routes", () => {
  expect(isProtectedPath("/")).toBe(false);
  expect(isProtectedPath("/login")).toBe(false);
  expect(isProtectedPath("/browse")).toBe(false);
});
test("does not treat /dashboardxyz as protected", () =>
  expect(isProtectedPath("/dashboardxyz")).toBe(false));
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- protected`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/playlist",
  "/history",
  "/favourites",
  "/settings",
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- protected`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: protected-path helper (TDD)"
```

---

### Task 3: Auth validation helpers (TDD)

**Files:**
- Create: `src/lib/auth/validation.ts`
- Test: `src/lib/auth/validation.test.ts`

**Interfaces:**
- Produces:
  - `validateEmail(email: string): string | null` — returns an error message or `null` if valid.
  - `validatePassword(password: string): string | null` — error message or `null`; requires length ≥ 6.

- [ ] **Step 1: Write failing tests**

```ts
import { expect, test } from "vitest";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

test("valid email passes", () => expect(validateEmail("a@b.com")).toBeNull());
test("empty email fails", () => expect(validateEmail("")).toBeTypeOf("string"));
test("malformed email fails", () => expect(validateEmail("nope")).toBeTypeOf("string"));
test("valid password passes", () => expect(validatePassword("secret1")).toBeNull());
test("short password fails", () => expect(validatePassword("abc")).toBeTypeOf("string"));
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- validation`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return null;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- validation`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: auth validation helpers (TDD)"
```

---

### Task 4: Middleware session refresh + route guard

**Files:**
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/proxy.ts` — **Next 16 convention.** `middleware.ts` is deprecated in favor of `proxy.ts` (exporting a `proxy` function), and in a `--src-dir` project it MUST live at `src/proxy.ts` (sibling of `app/`), not the repo root. Placing it at the root or naming it `middleware.ts` silently no-ops. Middleware/proxy changes require a dev-server restart (not HMR).

**Interfaces:**
- Consumes: `isProtectedPath` (Task 2).
- Produces: `updateSession(request: NextRequest): Promise<NextResponse>` — refreshes the session cookie and, when no user + protected path, returns a redirect to `/login`.

- [ ] **Step 1: Write `src/lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/auth/protected";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 2: Write `src/proxy.ts`** (Next 16 convention; see Files note)

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)"],
};
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: compiles (middleware registered). No runtime assertions here — behavior is verified live in Task 9.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: middleware session refresh + protected-route guard"
```

---

### Task 5: Auth server actions

**Files:**
- Create: `src/app/(auth)/actions.ts`

**Interfaces:**
- Consumes: server `createClient` (Task 1), `validateEmail`/`validatePassword` (Task 3).
- Produces (all `"use server"`):
  - `signUp(formData: FormData): Promise<{ error?: string; checkEmail?: boolean }>`
  - `signIn(formData: FormData): Promise<{ error?: string }>` (redirects to `/dashboard` on success)
  - `signOut(): Promise<void>` (redirects to `/`)

- [ ] **Step 1: Write actions**

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // Email confirmation is ON — no session yet.
  return { checkEmail: true };
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit` (expect clean).
```bash
git add -A && git commit -m "feat: auth server actions (signUp/signIn/signOut)"
```

---

### Task 6: Auth UI — shared components + Sign Up / Log In screens

**Files:**
- Create: `src/components/auth/AuthCard.tsx`
- Create: `src/components/auth/AuthForm.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `signUp`, `signIn` (Task 5).
- Produces:
  - `AuthCard({ heading, subtext, children })` — centered dark card, Playfair "OneScripture" wordmark, heading, muted subtext, slot.
  - `AuthForm({ mode })` — `mode: "signup" | "login"` client component: email + password inputs (gold focus), submit button, inline error, disabled Google button ("Google sign-in coming soon"), footer cross-link. On `signup` success with `checkEmail`, swaps to a "check your inbox" message.

- [ ] **Step 1: Write `AuthCard.tsx`**

```tsx
import Link from "next/link";

export function AuthCard({
  heading,
  subtext,
  children,
}: {
  heading: string;
  subtext?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <Link href="/" className="mb-6 block text-center font-display text-2xl text-accent">
          OneScripture
        </Link>
        <h1 className="font-sans text-lg font-medium text-text-primary">{heading}</h1>
        {subtext && <p className="mt-1 font-sans text-sm text-text-muted">{subtext}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `AuthForm.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn, signUp } from "@/app/(auth)/actions";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, start] = useTransition();

  if (checkEmail) {
    return (
      <p className="font-sans text-sm text-text-primary">
        Check your inbox to confirm your email, then{" "}
        <Link href="/login" className="text-accent hover:text-accent-light">log in</Link>.
      </p>
    );
  }

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const action = mode === "signup" ? signUp : signIn;
      const result = await action(formData);
      if (result?.error) setError(result.error);
      else if (result && "checkEmail" in result && result.checkEmail) setCheckEmail(true);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-text-primary outline-none focus:border-accent"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-text-primary outline-none focus:border-accent"
      />
      {error && <p className="font-sans text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 font-sans text-sm font-medium text-background transition-colors hover:bg-accent-light disabled:opacity-60"
      >
        {mode === "signup" ? "Create Account" : "Sign In"}
      </button>
      <button
        type="button"
        disabled
        title="Google sign-in coming soon"
        className="cursor-not-allowed rounded-md border border-border px-4 py-2 font-sans text-sm text-text-muted"
      >
        Continue with Google (coming soon)
      </button>
      <p className="text-center font-sans text-sm text-text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" className="text-accent hover:text-accent-light">Sign in →</Link></>
        ) : (
          <>Don&apos;t have an account? <Link href="/signup" className="text-accent hover:text-accent-light">Sign up →</Link></>
        )}
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Write the two pages**

`src/app/(auth)/signup/page.tsx`:
```tsx
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  return (
    <AuthCard heading="Create your account" subtext="Save playlists · Track downloads · Bookmark favourites">
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
```

`src/app/(auth)/login/page.tsx`:
```tsx
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LogInPage() {
  return (
    <AuthCard heading="Welcome back">
      <AuthForm mode="login" />
    </AuthCard>
  );
}
```

- [ ] **Step 4: Build + visual check**

Run: `npm run build` (clean), then `npm run dev` and open `/signup` and `/login`. Expected: centered dark cards, gold wordmark, gold focus on inputs, disabled Google button, cross-links.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Sign Up (S07) + Log In (S08) screens"
```

---

### Task 7: Auth-aware nav + placeholder dashboard

**Files:**
- Modify: `src/components/layout/Nav.tsx`
- Create: `src/app/(main)/dashboard/page.tsx`

**Interfaces:**
- Consumes: server `createClient` (Task 1), `signOut` (Task 5).
- Produces: `Nav` becomes an async server component reading the current user — shows Browse + (Dashboard, Settings, Sign Out) when logged in, or Browse + (Sign In, Sign Up) when not. `dashboard/page.tsx` is a protected placeholder greeting the user by email.

- [ ] **Step 1: Rewrite `Nav.tsx` as async server component**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display text-xl text-text-primary">OneScripture</Link>
      <nav className="flex items-center gap-6 font-sans text-sm uppercase tracking-wide text-text-muted">
        <Link href="/browse" className="transition-colors hover:text-accent">Browse</Link>
        {user ? (
          <>
            <Link href="/dashboard" className="transition-colors hover:text-accent">Dashboard</Link>
            <Link href="/settings" className="transition-colors hover:text-accent">Settings</Link>
            <form action={signOut}>
              <button type="submit" className="uppercase tracking-wide transition-colors hover:text-accent">Sign Out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="transition-colors hover:text-accent">Sign In</Link>
            <Link href="/signup" className="text-accent transition-colors hover:text-accent-light">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Write placeholder dashboard**

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="px-6 py-16">
      <h1 className="font-display text-3xl text-accent">Dashboard</h1>
      <p className="mt-2 font-sans text-text-muted">
        Signed in as {user?.email}. Playlists, history, and favourites arrive in the next slice.
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: auth-aware nav + placeholder dashboard"
```

---

### Task 8: Database migration (schema + RLS + profile trigger)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: the five DATA.md tables, RLS policies, and an `on_auth_user_created` trigger inserting a `profiles` row.

- [ ] **Step 1: Write `supabase/migrations/0001_init.sql`**

```sql
-- profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  default_translation text default 'KJV',
  default_language text default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  "order" integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  downloaded_at timestamptz not null default now()
);

create table if not exists public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null,
  verse_start integer,
  verse_end integer,
  translation_id text not null,
  display_ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, chapter, verse_start, verse_end, translation_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.downloads enable row level security;
alter table public.favourites enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "playlists_all_own" on public.playlists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "playlist_items_all_own" on public.playlist_items for all
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()));

create policy "downloads_select_own" on public.downloads for select using (auth.uid() = user_id);
create policy "downloads_insert_own" on public.downloads for insert with check (auth.uid() = user_id);

create policy "favourites_all_own" on public.favourites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply the migration**

The user runs `supabase/migrations/0001_init.sql` in the Supabase dashboard → SQL Editor (paste + Run). DDL can't be applied programmatically without the DB password / a personal access token. Confirm "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: DB schema + RLS + profile trigger (0001_init)"
```

---

### Task 9: Live verification

**Files:** none (verification only).

- [ ] **Step 1: Verify tables + RLS via a scripted check**

Write a temporary `scripts/verify-supabase.ts` (delete after) that:
  1. Uses the **service key** to create a confirmed test user (`supabase.auth.admin.createUser({ email, password, email_confirm: true })`).
  2. Signs that user in with the **anon key** to get a session; inserts a `favourites` row → expect success.
  3. Creates a **second** user + session; attempts to select the first user's `favourites` → expect **0 rows** (RLS blocks it).
  4. Cleans up both users via the admin API.
Run: `tsx --env-file-if-exists=.env.local scripts/verify-supabase.ts`
Expected: "insert ok", "cross-user read blocked (0 rows)", "cleanup ok". Then delete the script.

- [ ] **Step 2: Verify the auth flow in the browser**

Run `npm run dev`:
  - `/signup` → submit a real email + password → see the "check your inbox" state.
  - Confirm via the emailed link (or, for faster testing, toggle "Confirm email" off in Supabase and re-signup).
  - `/login` → sign in → redirected to `/dashboard`, greeted by email.
  - Nav now shows Dashboard / Settings / Sign Out.
  - Visit `/dashboard` in a fresh incognito window (logged out) → redirected to `/login`.
  - Click Sign Out → back to `/`, nav shows Sign In / Sign Up; `/dashboard` redirects again.

- [ ] **Step 3: Full slice verification**

Run: `npm test` (all green), `npm run lint` (clean), `npm run build` (clean).

- [ ] **Step 4: Commit any final touch-ups**

```bash
git add -A && git commit -m "test: Slice 3 live verification (auth + RLS confirmed)"
```

---

## Self-Review

**Spec coverage:** clients ✓ (T1), protected-path + validation helpers ✓ (T2,T3), middleware guard ✓ (T4), server actions ✓ (T5), S07/S08 UI + check-inbox + disabled Google ✓ (T6), auth-aware nav + placeholder dashboard ✓ (T7), schema/RLS/trigger per DATA.md ✓ (T8), live auth + RLS verification ✓ (T9).

**Placeholder scan:** no TBD/TODO; every code step has real content. Task 8 Step 2 and Task 9 Step 2 involve user/manual actions but are fully specified.

**Type consistency:** `createClient` (browser vs server) used in the correct contexts; `signUp`/`signIn`/`signOut` signatures match between actions (T5) and consumers (T6 form, T7 nav); `isProtectedPath` produced in T2 and consumed in T4; return shape `{ error?, checkEmail? }` handled in the form.

**Note:** `default_translation` in DATA.md profiles defaults to `"KJV"` — the migration matches that (distinct from `APP_CONFIG.DEFAULT_TRANSLATION='ENGESV'`, which is the app's runtime default, not the DB column default). Intentional; left as DATA.md specifies.
