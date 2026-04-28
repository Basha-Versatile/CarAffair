'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Car, User, Clock, CheckCircle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { Skeleton, SkeletonStatGrid, SkeletonList } from '@/components/ui/Skeleton';

export default function ReviewsPage() {
  const { bills, isLoading } = useAppSelector((state) => state.billing);

  const reviewedBills = useMemo(() =>
    bills.filter((b) => b.reviewStatus === 'submitted' && b.reviewRating),
    [bills]
  );

  const pendingReviews = useMemo(() =>
    bills.filter((b) => b.reviewStatus === 'sent'),
    [bills]
  );

  const avgRating = reviewedBills.length > 0
    ? (reviewedBills.reduce((sum, b) => sum + (b.reviewRating || 0), 0) / reviewedBills.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviewedBills.filter((b) => b.reviewRating === r).length,
  }));

  if (isLoading && bills.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonStatGrid count={3} />
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reviews & Feedback</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {reviewedBills.length} review{reviewedBills.length !== 1 ? 's' : ''} received
          {pendingReviews.length > 0 && ` · ${pendingReviews.length} pending`}
        </p>
      </motion.div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average rating card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <div className="text-center py-4">
              <p className="text-4xl font-black gradient-text mb-2">{avgRating}</p>
              <div className="flex items-center justify-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-5 h-5 ${star <= Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-tertiary)]/20'}`} />
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">Average Rating</p>
            </div>
          </Card>
        </motion.div>

        {/* Total reviews card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="text-center py-4">
              <p className="text-4xl font-black text-[var(--text-primary)] mb-2">{reviewedBills.length}</p>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="text-sm text-emerald-500 font-medium">Completed</p>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Reviews</p>
            </div>
          </Card>
        </motion.div>

        {/* Rating breakdown card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="py-2 space-y-1.5">
              {ratingCounts.map(({ rating, count }) => {
                const pct = reviewedBills.length > 0 ? (count / reviewedBills.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-tertiary)] w-4 text-right">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Pending reviews */}
      {pendingReviews.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Awaiting Feedback</h2>
          <div className="space-y-2">
            {pendingReviews.map((bill, idx) => (
              <motion.div key={bill.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{bill.customerName}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{bill.vehicleName} · {formatCurrency(bill.total)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="purple">Pending</Badge>
                  {bill.reviewSentAt && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Sent {formatDate(bill.reviewSentAt)}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted reviews */}
      {reviewedBills.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Customer Reviews</h2>
          <div className="space-y-4">
            {reviewedBills.map((bill, idx) => (
              <motion.div key={bill.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{bill.customerName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Car className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <p className="text-xs text-[var(--text-tertiary)]">{bill.vehicleName} · {bill.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= (bill.reviewRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-tertiary)]/20'}`} />
                      ))}
                    </div>
                    {bill.reviewSubmittedAt && (
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{formatDate(bill.reviewSubmittedAt)}</p>
                    )}
                  </div>
                </div>

                {bill.reviewComment && (
                  <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">&ldquo;{bill.reviewComment}&rdquo;</p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)]">
                  <span>Invoice #{bill.id}</span>
                  <span>{formatCurrency(bill.total)}</span>
                  <span className="capitalize">Paid via {bill.paymentMethod}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : pendingReviews.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Star className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No reviews yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Reviews will appear here after customers submit feedback</p>
        </div>
      )}
    </div>
  );
}
