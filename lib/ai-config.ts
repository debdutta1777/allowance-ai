type Environment = {
  [key: string]: string | undefined;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  ALLOW_SESSION_KEYS?: string;
  VERCEL?: string;
};

/** Runtime only. Never import this module into the browser bundle. */
export function resolveAIConfig(request: Request, environment: Environment) {
  return {
    key: environment.GEMINI_API_KEY?.trim() || undefined,
    model: environment.GEMINI_MODEL?.trim() || undefined,
    // Sites injects this identity; a public Vercel request must not be allowed
    // to impersonate it using a client-supplied header.
    allowSessionKey:
      environment.VERCEL !== '1' &&
      environment.ALLOW_SESSION_KEYS === 'true' &&
      Boolean(request.headers.get('oai-authenticated-user-id')),
  };
}
