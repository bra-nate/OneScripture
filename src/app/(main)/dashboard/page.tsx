import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PlaceholderPage
      description={
        <>
        Signed in as {user?.email}. Playlists, history, and favourites arrive in
        the next slice.
        </>
      }
      title="Dashboard"
    />
  );
}
