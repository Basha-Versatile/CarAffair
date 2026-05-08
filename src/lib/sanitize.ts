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

const INTERNAL_ASSIGNEE_FIELDS = [
  'assignedAdvisorId',
  'assignedMechanicId',
  'assignedTechnicianId',
  'assignedAdvisorName',
  'assignedMechanicName',
  'assignedTechnicianName',
  'assignees',
];

// Customer view: strips all prices AND internal-only fields. Keeps publicNotes; drops notes.
export function stripCustomerJobView<T extends JobLike>(job: T): T {
  const out = stripPrices(job) as Record<string, unknown>;
  for (const f of INTERNAL_ASSIGNEE_FIELDS) delete out[f];
  delete out.notes; // internal admin notes are not customer-facing
  return out as T;
}

export function stripCustomerJobViewList<T extends JobLike>(jobs: T[]): T[] {
  return jobs.map(stripCustomerJobView);
}

const BILL_PRICE_FIELDS = [
  'servicesCost',
  'partsCost',
  'subtotal',
  'taxRate',
  'taxAmount',
  'total',
  'paymentMethod',
  'paymentToken',
  'paymentLinkStatus',
  'paymentLinkSentAt',
];

export function stripCustomerBillView(bill: Record<string, unknown>): Record<string, unknown> {
  const out = stripPrices(bill as JobLike) as Record<string, unknown>;
  for (const f of BILL_PRICE_FIELDS) delete out[f];
  return out;
}
