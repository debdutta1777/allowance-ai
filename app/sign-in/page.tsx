import { AuthForm } from "../../components/service/auth-form";
import { authConfigured } from "../../lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const query = await searchParams;
  return (
    <AuthForm
      action="sign-in"
      configured={authConfigured()}
      notice={
        query.message === "confirmation-failed"
          ? "That email link could not be verified. It may have expired or opened in a different browser. Request a new confirmation email below, or sign in if your email is already confirmed."
          : ""
      }
    />
  );
}
