'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import type { Bill } from '@/types';
import { api } from '@/lib/apiClient';

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ bill: Bill }>(`/api/reviews/${token}`)
      .then((res) => {
        if (!cancelled) setBill(res.bill);
      })
      .catch(() => {
        if (!cancelled) setBill(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <p className="text-sm text-[var(--text-tertiary)] animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Review Link Not Found</h1>
          <p className="text-[var(--text-tertiary)]">This review link is invalid or has expired.</p>
        </motion.div>
      </div>
    );
  }

  const alreadySubmitted = bill.reviewStatus === 'submitted';

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const handleSubmit = async () => {
    if (rating === 0) return;
    try {
      const res = await api.post<{ bill: Bill }>(`/api/reviews/${token}`, { rating, comment });
      setBill(res.bill);
      setSubmitted(true);
    } catch {
      // leave on the form
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 65%)' }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border-color)]">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <Image src="/logo.png" alt="Car Affair" width={512} height={100} className="w-32 h-auto logo-adaptive" priority />
          <div className="ml-auto text-right">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium">Feedback</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {(submitted || alreadySubmitted) ? (
            <motion.div key="thanks" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="text-center py-16">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                Thank You!
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                Your feedback means a lot to us, {bill.customerName}. We&apos;re glad we could serve you!
              </motion.p>
              {(bill.reviewRating || rating > 0) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-1 mt-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-6 h-6 ${star <= (bill.reviewRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-tertiary)]/30'}`} />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Heading */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">How was your experience?</h1>
                <p className="text-[var(--text-tertiary)]">
                  Your vehicle <span className="text-[var(--text-secondary)] font-medium">{bill.vehicleName}</span> was serviced at Car Affair
                </p>
              </div>

              {/* Star Rating */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="cursor-pointer p-1"
                    >
                      <Star
                        className={`w-10 h-10 transition-all duration-200 ${
                          star <= (hoveredStar || rating)
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-tertiary)]'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
                {(hoveredStar || rating) > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-yellow-400/80 font-medium"
                  >
                    {ratingLabels[hoveredStar || rating]}
                  </motion.p>
                )}
              </div>

              {/* Comment */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                    Tell us more (optional)
                  </label>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like? What can we improve?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-red-500/40 resize-none transition-colors"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: rating > 0 ? 1.01 : 1 }}
                whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`w-full py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                  rating > 0
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/30 cursor-pointer hover:from-red-500 hover:to-red-600'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                }`}
              >
                Submit Review
              </motion.button>

              <div className="text-center">
                <p className="text-[11px] text-[var(--text-tertiary)]">Your feedback helps us improve our services</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
