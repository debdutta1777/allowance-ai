import { AuthForm } from "../../components/service/auth-form";
import { authConfigured } from "../../lib/supabase/server";
export const dynamic = "force-dynamic";
export default function Page() {
  return <AuthForm action="sign-in" configured={authConfigured()} />;
}
