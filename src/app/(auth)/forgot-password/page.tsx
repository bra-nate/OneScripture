import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      heading="Reset your password"
      subtext="Enter your account email and we'll send you a secure reset link."
    >
      <PasswordResetRequestForm />
    </AuthCard>
  );
}
