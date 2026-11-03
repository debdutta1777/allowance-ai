import { z } from "zod";
import { comparePurchase, forecast } from "../src/forecast.ts";
import { validateDraft, CATEGORIES } from "../src/imports.ts";
import { samplePlan } from "../src/sample.ts";

const amount = z.number().int().nonnegative().max(100_000_000_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const entry = z
  .object({
    id: z.string().min(1).max(80),
    date,
    label: z.string().trim().min(1).max(120),
    kind: z.enum(["income", "expense"]),
    amountPaise: amount,
  })
  .strict();
const plan = z
  .object({
    startDate: date,
    endDate: date,
    openingBalancePaise: z
      .number()
      .int()
      .min(-100_000_000_000)
      .max(100_000_000_000),
    dailyEssentialsPaise: amount,
    entries: z.array(entry).max(100),
  })
  .strict();
const transaction = z
  .object({
    id: z.string().min(1).max(80),
    date,
    description: z.string().trim().min(1).max(120),
    amountPaise: amount.positive(),
    direction: z.enum(["debit", "credit", "transfer"]),
    reference: z.string().max(80),
    category: z.enum(CATEGORIES),
  })
  .strict();
export const workspaceSchema = z
  .object({
    schemaVersion: z.literal(1),
    plan,
    purchase: z.object({ date, amountPaise: amount }).strict(),
    delayDays: z.number().int().min(0).max(30),
    transactions: z.array(transaction).max(1000),
    budgets: z
      .record(
        z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/),
        z.partialRecord(
          z.enum([
            "Food",
            "Transport",
            "Housing",
            "Education",
            "Health",
            "Shopping",
            "Subscriptions",
            "Other",
          ]),
          amount,
        ),
      )
      .refine((v) => Object.keys(v).length <= 120),
    holdings: z
      .array(
        z
          .object({
            id: z.string().min(1).max(80),
            name: z.string().trim().min(1).max(120),
            kind: z.enum(["Equity", "Fixed income", "Cash", "Other"]),
            valuePaise: amount.positive(),
          })
          .strict(),
      )
      .max(100),
    preferences: z
      .object({ displayName: z.string().max(80), currency: z.literal("INR") })
      .strict(),
  })
  .strict();
export type Workspace = z.infer<typeof workspaceSchema>;
export function validateWorkspace(input: unknown): Workspace {
  const data = workspaceSchema.parse(input);
  forecast(data.plan);
  comparePurchase(data.plan, data.purchase);
  const ids = new Set<string>();
  for (const item of data.transactions) {
    if (ids.has(item.id)) throw new Error("Duplicate transaction ID.");
    ids.add(item.id);
    const normalized = validateDraft({
      ...item,
      included: true,
      duplicate: false,
      issue: "",
      amount: (item.amountPaise / 100).toFixed(2),
    });
    if (
      normalized.category !== item.category ||
      (item.direction === "credit" &&
        !["Income", "Refunds"].includes(item.category)) ||
      (item.direction === "debit" &&
        ["Income", "Refunds", "Transfers"].includes(item.category))
    )
      throw new Error("Transaction category conflicts with its direction.");
  }
  if (new Set(data.holdings.map((h) => h.id)).size !== data.holdings.length)
    throw new Error("Duplicate holding ID.");
  return data;
}
export function emptyWorkspace(
  today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  ),
): Workspace {
  const end = new Date(Date.parse(today + "T00:00:00Z") + 29 * 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    schemaVersion: 1,
    plan: {
      startDate: today,
      endDate: end,
      openingBalancePaise: 0,
      dailyEssentialsPaise: 0,
      entries: [],
    },
    purchase: { date: today, amountPaise: 0 },
    delayDays: 3,
    transactions: [],
    budgets: {},
    holdings: [],
    preferences: { displayName: "", currency: "INR" },
  };
}
export function demoWorkspace(): Workspace {
  return {
    ...emptyWorkspace(),
    plan: structuredClone(samplePlan),
    purchase: { date: "2026-11-04", amountPaise: 200000 },
  };
}
