import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LogInPage() {
  return (
    <AuthCard heading="Welcome back">
      <AuthForm mode="login" />
    </AuthCard>
  );
}
