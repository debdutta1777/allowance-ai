import { sameOrigin, privateJSON } from "../../../lib/http-security";
import { verifiedAccount } from "../../../lib/supabase/server";
import { handleAI } from "../../../lib/ai-service";
import { resolveAIConfig } from "../../../lib/ai-config";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function GET(request: Request) {
  const account = await verifiedAccount();
  if (!account)
    return privateJSON({
      available: false,
      provider: "Gemini",
      sessionKeyAllowed: false,
    });
  return handleAI(request, resolveAIConfig(request, process.env));
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return privateJSON({ error: "Use this application on its own site." }, 403);
  const account = await verifiedAccount();
  if (!account)
    return privateJSON(
      { error: "Sign in to request a Gemini interpretation." },
      401,
    );
  const admitRequest = async () => {
    const { data, error } = await account.client.rpc("allowance_admit_ai");
    if (error || typeof data !== "boolean")
      throw new Error("AI admission unavailable");
    return data;
  };
  return handleAI(request, {
    ...resolveAIConfig(request, process.env),
    admitRequest,
  });
}
