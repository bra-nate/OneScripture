import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

const OAUTH_ERROR_MESSAGE =
  "We couldn't complete that provider sign-in. Please try again.";

export default async function LogInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const initialError = error === "oauth_callback" ? OAUTH_ERROR_MESSAGE : undefined;

  return (
    <AuthCard heading="Welcome back">
      <AuthForm mode="login" initialError={initialError} />
    </AuthCard>
  );
}
