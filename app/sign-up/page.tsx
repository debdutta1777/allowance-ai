import { AuthForm } from "../../components/service/auth-form";
import { publicSignupEnabled } from "../../lib/supabase/server";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <AuthForm
      action="sign-up"
      configured={publicSignupEnabled()}
      unavailableMessage="New account registration is not open yet while email delivery is being verified. Explore every calculator in the fictional demo without signing up. Existing users can still sign in."
    />
  );
}
