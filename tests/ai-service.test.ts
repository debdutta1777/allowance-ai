import { test } from "node:test";
import assert from "node:assert/strict";
import { handleAI, redactDescription } from "../lib/ai-service.ts";
import { samplePlan } from "../src/sample.ts";

const explain = {
  consent: true,
  action: "explain",
  plan: samplePlan,
  purchase: { date: "2026-11-04", amountPaise: 200000 },
  delayDays: 3,
};
function request(body: unknown, origin = "https://allowance.test") {
  return new Request("https://allowance.test/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}
function provider(output: unknown): typeof fetch {
  return async () =>
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(output) }] },
        },
      ],
    });
}
test("missing key is disclosed and never calls a provider", async () => {
  assert.deepEqual(
    await (
      await handleAI(new Request("https://allowance.test/api/ai"), {})
    ).json(),
    { available: false, provider: "Gemini", sessionKeyAllowed: false },
  );
  const response = await handleAI(request(explain), {});
  assert.equal(response.status, 503);
  assert.match(
    ((await response.json()) as { error: string }).error,
    /unavailable/,
  );
});
test("AI requires explicit consent and same-origin requests", async () => {
  assert.equal(
    (
      await handleAI(request({ ...explain, consent: false }), {
        key: "test-only",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAI(request(explain, "https://other.test"), {
        key: "test-only",
      })
    ).status,
    403,
  );
});
test("input limits and invalid plans fail before provider invocation", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    throw new Error();
  };
  assert.equal(
    (
      await handleAI(
        request({
          ...explain,
          plan: { ...samplePlan, openingBalancePaise: 1.2 },
        }),
        { key: "test-only", fetcher },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAI(
        request({ consent: true, action: "categorize", rows: [] }),
        { key: "test-only", fetcher },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAI(request({ pad: "x".repeat(66000) }), {
        key: "test-only",
        fetcher,
      })
    ).status,
    400,
  );
  assert.equal(called, false);
});
test("valid mocked explanation returns only server-computed evidence", async () => {
  const response = await handleAI(
    request({ ...explain, facts: [{ id: "purchase-min", value: 99999999 }] }),
    {
      key: "test-only",
      fetcher: provider({
        overview: "Essentials need a buffer.",
        suggestion: "Consider postponing the purchase.",
        evidenceIds: ["purchase-min"],
      }),
    },
  );
  assert.equal(response.status, 200);
  const result = (await response.json()) as {
    evidence: { value: number }[];
    source: string;
  };
  assert.equal(result.evidence[0].value, -95000);
  assert.equal(result.source, "live-ai");
});
test("numeric prose, unknown evidence, refusal and incomplete output fail validation", async () => {
  for (const output of [
    {
      overview: "You have ₹99999.",
      suggestion: "Buy it.",
      evidenceIds: ["purchase-min"],
    },
    {
      overview: "Keep a buffer.",
      suggestion: "Wait.",
      evidenceIds: ["invented"],
    },
    { overview: "Keep a buffer.", suggestion: "Wait.", evidenceIds: [] },
  ]) {
    assert.equal(
      (
        await handleAI(request(explain), {
          key: "test-only",
          fetcher: provider(output),
        })
      ).status,
      502,
    );
  }
  const fetcher: typeof fetch = async () =>
    Response.json({
      candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [] } }],
    });
  assert.equal(
    (await handleAI(request(explain), { key: "test-only", fetcher })).status,
    502,
  );
});
test("category response rejects unknown IDs, duplicate IDs and direction conflicts", async () => {
  const body = {
    consent: true,
    action: "categorize",
    rows: [{ id: "row-a", description: "Own transfer", direction: "transfer" }],
  };
  const valid = await handleAI(request(body), {
    key: "test-only",
    fetcher: provider({
      suggestions: [{ id: "row-a", category: "Transfers", confidence: "high" }],
    }),
  });
  assert.equal(valid.status, 200);
  for (const item of [
    { id: "unknown", category: "Food", confidence: "high" },
    { id: "row-a", category: "Food", confidence: "high" },
    { id: "row-a", category: "Made up", confidence: "high" },
  ])
    assert.equal(
      (
        await handleAI(request(body), {
          key: "test-only",
          fetcher: provider({ suggestions: [item] }),
        })
      ).status,
      502,
    );
  const double = {
    ...body,
    rows: [
      ...body.rows,
      { id: "row-b", description: "Metro", direction: "debit" },
    ],
  };
  assert.equal(
    (
      await handleAI(request(double), {
        key: "test-only",
        fetcher: provider({
          suggestions: [
            { id: "row-a", category: "Transfers", confidence: "high" },
            { id: "row-a", category: "Transfers", confidence: "high" },
          ],
        }),
      })
    ).status,
    502,
  );
});
test("provider errors, rate limits and network failures do not expose secrets", async () => {
  for (const status of [401, 429, 500]) {
    const fetcher: typeof fetch = async () =>
      new Response("upstream sensitive error", { status });
    const response = await handleAI(request(explain), {
      key: "test-only",
      fetcher,
    });
    const text = await response.text();
    assert.equal(response.status, status === 429 ? 429 : 502);
    assert.ok(!text.includes("sensitive"));
    assert.ok(!text.includes("test-only"));
  }
  const fetcher: typeof fetch = async () => {
    throw new Error("network");
  };
  assert.equal(
    (await handleAI(request(explain), { key: "test-only", fetcher })).status,
    502,
  );
});
test("descriptions mask long identifiers and UPI-like addresses", () => {
  assert.equal(
    redactDescription("Paid 1234567890 to person@bank"),
    "Paid [number] to [identifier]",
  );
});
test("session keys are rejected unless the route authorizes the owner", async () => {
  const response = await handleAI(
    request({ ...explain, sessionKey: "demo-key-for-unit-test-only" }),
    {},
  );
  assert.equal(response.status, 403);
  assert.ok(!(await response.text()).includes("demo-key"));
});
test("authorized session key is sent only in the Gemini header and never echoed", async () => {
  let called = false;
  const fetcher: typeof fetch = async (url, init) => {
    called = true;
    assert.equal(
      new Headers(init?.headers).get("x-goog-api-key"),
      "demo-key-for-unit-test-only",
    );
    assert.match(
      String(url),
      /^https:\/\/generativelanguage\.googleapis\.com\//,
    );
    assert.ok(!String(url).includes("demo-key"));
    assert.ok(!String(init?.body).includes("demo-key"));
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.generationConfig.responseSchema.type, "OBJECT");
    return provider({
      overview: "Keep essentials covered.",
      suggestion: "Consider waiting for income.",
      evidenceIds: ["purchase-min"],
    })(url, init);
  };
  const response = await handleAI(
    request({ ...explain, sessionKey: "demo-key-for-unit-test-only" }),
    { allowSessionKey: true, fetcher },
  );
  assert.equal(response.status, 200);
  assert.equal(called, true);
  assert.ok(!(await response.text()).includes("demo-key"));
});
test("malformed session keys and arbitrary model URLs cannot reach a provider", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    throw new Error();
  };
  assert.equal(
    (
      await handleAI(request({ ...explain, sessionKey: "short" }), {
        allowSessionKey: true,
        fetcher,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await handleAI(request(explain), {
        key: "test-only",
        model: "https://other.test",
        fetcher,
      })
    ).status,
    502,
  );
  assert.equal(called, false);
});

test("invalid requests do not consume the provider allowance; exhausted allowance blocks the provider", async () => {
  let admissions = 0,
    providerCalls = 0;
  const options = {
    key: "test-only",
    admitRequest: () => {
      admissions++;
      return false;
    },
    fetcher: async () => {
      providerCalls++;
      throw new Error("Must not reach provider");
    },
  };
  assert.equal(
    (await handleAI(request({ ...explain, consent: false }), options)).status,
    400,
  );
  assert.equal(
    (await handleAI(request({ ...explain, plan: null }), options)).status,
    400,
  );
  assert.equal(admissions, 0);
  const response = await handleAI(request(explain), options);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(admissions, 1);
  assert.equal(providerCalls, 0);
});

test("asynchronous shared admission is awaited and failures never reach Gemini", async () => {
  let providerCalls = 0;
  const fetcher: typeof fetch = async () => {
    providerCalls++;
    throw new Error("Provider must stay blocked");
  };
  const denied = await handleAI(request(explain), {
    key: "test-only",
    fetcher,
    admitRequest: async () => false,
  });
  assert.equal(denied.status, 429);
  const unavailable = await handleAI(request(explain), {
    key: "test-only",
    fetcher,
    admitRequest: async () => {
      throw new Error("Database unavailable");
    },
  });
  assert.equal(unavailable.status, 502);
  assert.equal(providerCalls, 0);
});
