import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { Status } from "@/components/ui";

const OAUTH_ERROR_MESSAGE =
  "We couldn't complete that provider sign-in. Please try again.";

export default async function LogInPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    reset?: string | string[];
  }>;
}) {
  const { error, reset } = await searchParams;
  const initialError = error === "oauth_callback" ? OAUTH_ERROR_MESSAGE : undefined;

  return (
    <AuthCard heading="Welcome back">
      <div className="flex flex-col gap-4">
        {reset === "success" && (
          <Status label="Password updated" tone="success">
            Sign in with your new password.
          </Status>
        )}
        <AuthForm mode="login" initialError={initialError} />
      </div>
    </AuthCard>
  );
}
