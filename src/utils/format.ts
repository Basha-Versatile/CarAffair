export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateQuoteToken(): string {
  return `qt-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
}

export function generatePaymentToken(): string {
  return `pay-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
}

export function generateReviewToken(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
}
