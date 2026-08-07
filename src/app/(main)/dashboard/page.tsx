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
        Signed in as {user?.email}. Playlists, history, and favourites arrive in
        the next slice.
      </p>
    </section>
  );
}
