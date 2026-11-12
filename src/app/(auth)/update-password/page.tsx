import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";

export default function UpdatePasswordPage() {
  return (
    <AuthCard
      heading="Choose a new password"
      subtext="Use at least 6 characters."
    >
      <PasswordUpdateForm />
    </AuthCard>
  );
}
