// Strips price-bearing fields from a job-card object before returning it to
// workforce roles (service_advisor, mechanic, primary_technician). Admins and
// staff get the full document.

const PRICE_FIELDS_TOP = [
  'estimatedCost',
  'actualCost',
  'quoteSubtotal',
  'quoteTaxAmount',
  'quoteTotal',
];

const PRICE_FIELDS_SERVICE = ['cost'];
const PRICE_FIELDS_PART = ['unitCost', 'totalCost'];

type JobLike = Record<string, unknown> & {
  services?: Record<string, unknown>[];
  parts?: Record<string, unknown>[];
};

export function stripPrices<T extends JobLike>(job: T): T {
  const out = { ...(job as Record<string, unknown>) };
  for (const f of PRICE_FIELDS_TOP) delete out[f];
  if (Array.isArray(out.services)) {
    out.services = (out.services as Record<string, unknown>[]).map((s) => {
      const c = { ...s };
      for (const f of PRICE_FIELDS_SERVICE) delete c[f];
      return c;
    });
  }
  if (Array.isArray(out.parts)) {
    out.parts = (out.parts as Record<string, unknown>[]).map((p) => {
      const c = { ...p };
      for (const f of PRICE_FIELDS_PART) delete c[f];
      return c;
    });
  }
  return out as T;
}

export function stripPricesList<T extends JobLike>(jobs: T[]): T[] {
  return jobs.map(stripPrices);
}

export const WORKFORCE_ROLES = ['service_advisor', 'mechanic', 'primary_technician'] as const;
export type WorkforceRole = (typeof WORKFORCE_ROLES)[number];

export function isWorkforce(role: string | undefined): role is WorkforceRole {
  return role === 'service_advisor' || role === 'mechanic' || role === 'primary_technician';
}
