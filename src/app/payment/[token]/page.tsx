'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, CreditCard, QrCode, Banknote, Wrench, Package, Shield } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { markBillPaidByToken } from '@/features/billing/billingSlice';
import { updateNotificationsByToken, addAlert } from '@/features/notifications/notificationSlice';
import { simulateSendReviewNotification } from '@/services/notificationService';
import { formatCurrency, formatDate, generateId } from '@/utils/format';

type PaymentMethod = 'cash' | 'card' | 'qr';

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<'invoice' | 'method' | 'confirm' | 'success'>('invoice');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [reviewLink, setReviewLink] = useState('');

  const bill = useAppSelector((state) => state.billing.bills.find((b) => b.paymentToken === token));

  if (!bill) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Payment Link Not Found</h1>
          <p className="text-[var(--text-tertiary)]">This payment link is invalid or has expired. Please contact Car Affair for assistance.</p>
        </motion.div>
      </div>
    );
  }

  const alreadyPaid = bill.status === 'paid';

  const handlePay = () => {
    if (!selectedMethod) return;
    dispatch(markBillPaidByToken({ token, paymentMethod: selectedMethod }));
    dispatch(updateNotificationsByToken({ quoteToken: token, status: 'opened', timestamp: new Date().toISOString() }));
    dispatch(addAlert({
      id: `alert-${generateId()}`,
      type: 'payment_received',
      title: 'Payment Received',
      message: `${bill.customerName} paid ${formatCurrency(bill.total)} for ${bill.vehicleName} via ${selectedMethod === 'qr' ? 'UPI' : selectedMethod}`,
      customerName: bill.customerName,
      vehicleName: bill.vehicleName,
      read: false,
      createdAt: new Date().toISOString(),
    }));
    setStep('success');
    setTimeout(() => {
      if (bill) {
        const revToken = simulateSendReviewNotification(dispatch, bill, { byPaymentToken: true });
        setReviewLink(`${window.location.origin}/review/${revToken}`);
      }
    }, 2000);
  };

  const paymentMethods: { id: PaymentMethod; label: string; desc: string; icon: typeof CreditCard }[] = [
    { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', icon: CreditCard },
    { id: 'qr', label: 'UPI / QR Code', desc: 'GPay, PhonePe, Paytm', icon: QrCode },
    { id: 'cash', label: 'Pay at Garage', desc: 'Cash payment on pickup', icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 65%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <Image src="/logo.png" alt="Car Affair" width={512} height={100} className="w-32 h-auto logo-adaptive" priority />
          <div className="ml-auto text-right">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest font-medium">Invoice</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">#{bill.id}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {alreadyPaid && step !== 'success' ? (
            <motion.div key="paid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Payment Complete</h2>
              <p className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                This invoice has already been paid{bill.paymentMethod ? ` via ${bill.paymentMethod}` : ''}. Thank you, {bill.customerName}!
              </p>
              {bill.paidAt && <p className="text-[var(--text-tertiary)] text-sm mt-3">Paid on {formatDate(bill.paidAt)}</p>}
            </motion.div>
          ) : step === 'success' ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-[var(--text-primary)] mb-3">Payment Successful!</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[var(--text-tertiary)] max-w-sm mx-auto">
                Thank you, {bill.customerName}. Your payment of {formatCurrency(bill.total)} has been received.
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 text-sm font-medium">Payment Secured</span>
              </motion.div>
              {reviewLink && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8">
                  <p className="text-[var(--text-tertiary)] text-sm mb-3">We&apos;d love your feedback!</p>
                  <a href={reviewLink} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-600/20">
                    Leave a Review
                  </a>
                </motion.div>
              )}
            </motion.div>
          ) : step === 'method' ? (
            <motion.div key="method" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Choose Payment Method</h2>
                <p className="text-[var(--text-tertiary)]">Amount: <span className="text-[var(--text-primary)] font-semibold">{formatCurrency(bill.total)}</span></p>
              </div>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.button key={method.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedMethod === method.id ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-glass-hover)]'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === method.id ? 'bg-red-500/15' : 'bg-[var(--bg-glass)]'}`}>
                      <method.icon className={`w-6 h-6 ${selectedMethod === method.id ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{method.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{method.desc}</p>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-red-500 bg-red-500' : 'border-[var(--border-color)]'}`}>
                      {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </motion.button>
                ))}
              </div>
              {selectedMethod === 'qr' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex justify-center py-4">
                  <div className="w-48 h-48 rounded-2xl bg-white flex items-center justify-center"><QrCode className="w-32 h-32 text-neutral-800" /></div>
                </motion.div>
              )}
              <div className="flex gap-4 pt-4">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setStep('invoice'); setSelectedMethod(null); }}
                  className="flex-1 py-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer">Back</motion.button>
                <motion.button whileHover={{ scale: selectedMethod ? 1.01 : 1 }} whileTap={{ scale: selectedMethod ? 0.98 : 1 }} onClick={() => selectedMethod && setStep('confirm')} disabled={!selectedMethod}
                  className={`flex-1 py-4 rounded-xl font-semibold text-sm transition-all ${selectedMethod ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20 cursor-pointer hover:from-red-500 hover:to-red-600' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'}`}>Continue</motion.button>
              </div>
            </motion.div>
          ) : step === 'confirm' ? (
            <motion.div key="confirm" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Confirm Payment</h2>
                <p className="text-[var(--text-tertiary)] text-sm">Please review and confirm your payment</p>
              </div>
              <div className="p-6 rounded-2xl glass space-y-4">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Amount</span><span className="text-[var(--text-primary)] font-bold text-lg">{formatCurrency(bill.total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Method</span><span className="text-[var(--text-secondary)] capitalize">{selectedMethod === 'qr' ? 'UPI' : selectedMethod}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Vehicle</span><span className="text-[var(--text-secondary)]">{bill.vehicleName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Invoice</span><span className="text-[var(--text-secondary)]">#{bill.id}</span></div>
              </div>
              <div className="flex gap-4 pt-2">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep('method')}
                  className="flex-1 py-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer">Back</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handlePay}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 cursor-pointer hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" /> Pay {formatCurrency(bill.total)}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* Invoice view */
            <motion.div key="invoice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="p-6 rounded-2xl glass">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-1">Vehicle</p>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{bill.vehicleName}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{bill.licensePlate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-1">Billed To</p>
                    <p className="text-[var(--text-secondary)] text-sm font-medium">{bill.customerName}</p>
                    <p className="text-[var(--text-tertiary)] text-xs mt-1">{formatDate(bill.createdAt)}</p>
                  </div>
                </div>
              </div>

              {bill.services.length > 0 && (
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center gap-2 mb-4"><Wrench className="w-4 h-4 text-red-500" /><p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Services</p></div>
                  <div className="space-y-3">
                    {bill.services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div><p className="text-sm text-[var(--text-primary)] font-medium">{s.name}</p><p className="text-xs text-[var(--text-tertiary)]">{s.laborHours}h labor</p></div>
                        <p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(s.cost)}</p>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">Services Subtotal</p><p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(bill.servicesCost)}</p>
                    </div>
                  </div>
                </div>
              )}

              {bill.parts.length > 0 && (
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-red-500" /><p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Parts</p></div>
                  <div className="space-y-3">
                    {bill.parts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div><p className="text-sm text-[var(--text-primary)] font-medium">{p.name}</p><p className="text-xs text-[var(--text-tertiary)]">#{p.partNumber} &middot; Qty: {p.quantity}</p></div>
                        <p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(p.totalCost)}</p>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between">
                      <p className="text-xs text-[var(--text-tertiary)] font-medium">Parts Subtotal</p><p className="text-sm text-[var(--text-secondary)] font-semibold">{formatCurrency(bill.partsCost)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">Subtotal</span><span className="text-[var(--text-secondary)]">{formatCurrency(bill.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-tertiary)]">GST ({bill.taxRate}%)</span><span className="text-[var(--text-secondary)]">{formatCurrency(bill.taxAmount)}</span></div>
                </div>
                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                  <p className="text-[var(--text-secondary)] font-medium">Total Amount Due</p>
                  <p className="text-3xl font-black gradient-text">{formatCurrency(bill.total)}</p>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setStep('method')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-base shadow-lg shadow-red-600/20 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" /> Pay Now — {formatCurrency(bill.total)}
              </motion.button>

              <div className="pt-4 border-t border-[var(--border-color)] text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
                  <p className="text-[11px] text-[var(--text-tertiary)]">Secure payment powered by Car Affair</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
