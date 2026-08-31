import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  return (
    <AuthCard
      heading="Create your account"
      subtext="Save playlists · Track downloads · Bookmark favourites"
    >
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
