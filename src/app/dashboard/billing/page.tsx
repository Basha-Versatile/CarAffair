'use client';

import { useState } from 'react';
import ViewToggle from '@/components/ui/ViewToggle';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, FileText, CreditCard, Banknote, QrCode,
  CheckCircle2, ArrowRight, Send, CheckCircle, Clock, Star, MessageSquare,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addBill, markBillPaid } from '@/features/billing/billingSlice';
import { simulateSendReviewNotification } from '@/services/notificationService';
import SendPaymentLinkModal from '@/components/billing/SendPaymentLinkModal';
import NotificationTimeline from '@/components/job-cards/NotificationTimeline';
import { useModal } from '@/hooks/useModal';
import { generateId, formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import type { JobCard, Bill } from '@/types';

const TAX_RATE = 18;

export default function BillingPage() {
  const dispatch = useAppDispatch();
  const { bills } = useAppSelector((state) => state.billing);
  const { jobCards } = useAppSelector((state) => state.jobCards);
  const invoiceModal = useModal();
  const paymentModal = useModal();
  const generateModal = useModal();
  const paymentLinkModal = useModal();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [sendingBill, setSendingBill] = useState<Bill | null>(null);
  const [paymentStep, setPaymentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'qr' | null>(null);
  const [reviewLink, setReviewLink] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const completedJobs = jobCards.filter(
    (j) => j.status === 'completed' && !bills.some((b) => b.jobCardId === j.id)
  );

  const totalPages = Math.ceil(bills.length / pageSize);
  const paginatedBills = bills.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleGenerateBill = (job: JobCard) => {
    const approvedSvcSet = job.approvedServiceIds ? new Set(job.approvedServiceIds) : null;
    const approvedPartSet = job.approvedPartIds ? new Set(job.approvedPartIds) : null;
    const billServices = approvedSvcSet ? job.services.filter((s) => approvedSvcSet.has(s.id)) : job.services;
    const billParts = approvedPartSet ? job.parts.filter((p) => approvedPartSet.has(p.id)) : job.parts;
    const servicesCost = billServices.reduce((s, srv) => s + srv.cost, 0);
    const partsCost = billParts.reduce((s, p) => s + p.totalCost, 0);
    const subtotal = servicesCost + partsCost;
    const taxAmount = Math.round(subtotal * (TAX_RATE / 100));
    const total = subtotal + taxAmount;

    const newBill: Bill = {
      id: `bill-${generateId()}`,
      jobCardId: job.id,
      customerId: job.customerId,
      customerName: job.customerName,
      vehicleName: job.vehicleName,
      licensePlate: job.licensePlate,
      services: billServices,
      parts: billParts,
      servicesCost,
      partsCost,
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      total,
      status: 'unpaid',
      createdAt: new Date().toISOString(),
    };
    dispatch(addBill(newBill));
    toast.success('Bill Generated', `Invoice created for ${job.customerName}`);
    generateModal.close();
  };

  const handleViewInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    invoiceModal.open();
  };

  const handleStartPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentStep(0);
    setSelectedMethod(null);
    paymentModal.open();
  };

  const handleSendPaymentLink = (bill: Bill) => {
    setSendingBill(bill);
    paymentLinkModal.open();
  };

  const handleConfirmPayment = () => {
    if (selectedBill && selectedMethod) {
      dispatch(markBillPaid({ id: selectedBill.id, paymentMethod: selectedMethod }));
      toast.success('Payment Successful', `Payment received via ${selectedMethod}`);
      setPaymentStep(2);
      // Auto-send review link after payment
      setTimeout(() => {
        const token = simulateSendReviewNotification(dispatch, selectedBill);
        setReviewLink(`${window.location.origin}/review/${token}`);
        toast.info('Review Link Sent', `Feedback request sent to ${selectedBill.customerName}`);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Manage invoices and payments</p>
        </motion.div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={generateModal.open} icon={<FileText className="h-4 w-4" />}>Generate Bill</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10"><Receipt className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Total Billed</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(bills.reduce((s, b) => s + b.total, 0))}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10"><CreditCard className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Paid</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(bills.filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0))}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10"><Receipt className="h-5 w-5 text-amber-400" /></div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)]">Unpaid</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + b.total, 0))}</p>
            </div>
          </div>
        </Card>
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {paginatedBills.map((bill, idx) => (
            <motion.div key={bill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass rounded-2xl p-5 hover:bg-[var(--bg-glass-hover)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{bill.vehicleName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{bill.customerName} &middot; {bill.licensePlate}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{formatDateTime(bill.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right space-y-1.5">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(bill.total)}</p>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Badge variant={bill.status === 'paid' ? 'success' : 'warning'}>{bill.status === 'paid' ? 'Paid' : 'Unpaid'}</Badge>
                      {bill.paymentLinkStatus === 'sent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold text-blue-500 bg-blue-500/10 border-blue-500/20">
                          <Clock className="w-3 h-3" />Link Sent
                        </span>
                      )}
                      {bill.reviewStatus === 'submitted' && bill.reviewRating && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold text-yellow-500 bg-yellow-500/10 border-yellow-500/20">
                          <Star className="w-3 h-3 fill-yellow-500" />{bill.reviewRating}/5
                        </span>
                      )}
                      {bill.reviewStatus === 'sent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold text-purple-500 bg-purple-500/10 border-purple-500/20">
                          <MessageSquare className="w-3 h-3" />Review Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(bill)} title="View Invoice" icon={<FileText className="h-4 w-4" />} />
                    {bill.status === 'unpaid' && !bill.paymentLinkStatus && (
                      <Button variant="ghost" size="sm" onClick={() => handleSendPaymentLink(bill)} title="Send Payment Link" icon={<Send className="h-4 w-4 text-blue-500" />} />
                    )}
                    {bill.status === 'unpaid' && <Button size="sm" onClick={() => handleStartPayment(bill)} icon={<CreditCard className="h-4 w-4" />}>Pay</Button>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBills.map((bill, idx) => (
            <motion.div key={bill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={bill.status === 'paid' ? 'success' : 'warning'}>{bill.status === 'paid' ? 'Paid' : 'Unpaid'}</Badge>
                    {bill.paymentLinkStatus === 'sent' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-semibold text-blue-500 bg-blue-500/10 border-blue-500/20">
                        <Clock className="w-2.5 h-2.5" />Link Sent
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">{formatDate(bill.createdAt)}</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)]">{bill.vehicleName}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{bill.customerName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{bill.licensePlate}</p>
                <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Services</span><span className="text-[var(--text-primary)]">{formatCurrency(bill.servicesCost)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Parts</span><span className="text-[var(--text-primary)]">{formatCurrency(bill.partsCost)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-tertiary)]">Tax</span><span className="text-[var(--text-primary)]">{formatCurrency(bill.taxAmount)}</span></div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-color)]">
                  <p className="text-lg font-bold gradient-text">{formatCurrency(bill.total)}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(bill)} title="View Invoice" icon={<FileText className="h-3.5 w-3.5" />} />
                    {bill.status === 'unpaid' && !bill.paymentLinkStatus && (
                      <Button variant="ghost" size="sm" onClick={() => handleSendPaymentLink(bill)} title="Send Payment Link" icon={<Send className="h-3.5 w-3.5 text-blue-500" />} />
                    )}
                    {bill.status === 'unpaid' && <Button size="sm" onClick={() => handleStartPayment(bill)} icon={<CreditCard className="h-3.5 w-3.5" />}>Pay</Button>}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {bills.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Receipt className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-tertiary)]">No bills generated yet</p>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Generate Bill Modal */}
      <Modal isOpen={generateModal.isOpen} onClose={generateModal.close} title="Generate Bill from Job">
        <div className="space-y-3">
          {completedJobs.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No completed jobs available for billing</p>
          ) : (
            completedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-glass-hover)] transition-all">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{job.vehicleName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{job.customerName}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Est. {formatCurrency(job.estimatedCost)}</p>
                </div>
                <Button size="sm" onClick={() => handleGenerateBill(job)}>Generate</Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={invoiceModal.isOpen} onClose={invoiceModal.close} title="Invoice" size="lg">
        {selectedBill && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold gradient-text">INVOICE</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">#{selectedBill.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-primary)]">Caraffair</p>
                <p className="text-xs text-[var(--text-tertiary)]">Premium Garage Services</p>
                <p className="text-xs text-[var(--text-tertiary)]">{formatDate(selectedBill.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Bill To</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedBill.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Vehicle</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedBill.vehicleName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{selectedBill.licensePlate}</p>
              </div>
            </div>

            {selectedBill.services.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Services</h3>
                <div className="space-y-1">
                  {selectedBill.services.map((s) => (
                    <div key={s.id} className="flex justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm">
                      <div>
                        <span className="text-[var(--text-primary)]">{s.name}</span>
                        <span className="text-[var(--text-tertiary)] ml-2 text-xs">{s.laborHours}h</span>
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{formatCurrency(s.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.parts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Parts</h3>
                <div className="space-y-1">
                  {selectedBill.parts.map((p) => (
                    <div key={p.id} className="flex justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] text-sm">
                      <div>
                        <span className="text-[var(--text-primary)]">{p.name}</span>
                        <span className="text-[var(--text-tertiary)] ml-2 text-xs">x{p.quantity} @ {formatCurrency(p.unitCost)}</span>
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">{formatCurrency(p.totalCost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 rounded-xl glass border border-[var(--border-glass)] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Services</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedBill.servicesCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Parts</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedBill.partsCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">GST ({selectedBill.taxRate}%)</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(selectedBill.taxAmount)}</span>
              </div>
              <div className="border-t border-[var(--border-color)] pt-3 flex justify-between">
                <span className="text-lg font-bold text-[var(--text-primary)]">Total</span>
                <span className="text-2xl font-bold gradient-text">{formatCurrency(selectedBill.total)}</span>
              </div>
            </div>

            {selectedBill.status === 'paid' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Paid via {selectedBill.paymentMethod}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{selectedBill.paidAt ? formatDateTime(selectedBill.paidAt) : ''}</p>
                </div>
              </div>
            )}

            {/* Payment Link & Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Payment Link & Notifications</p>
                {selectedBill.status === 'unpaid' && !selectedBill.paymentLinkStatus && (
                  <Button size="sm" onClick={() => { invoiceModal.close(); handleSendPaymentLink(selectedBill); }} icon={<Send className="h-3.5 w-3.5" />}>Send Payment Link</Button>
                )}
              </div>
              {selectedBill.paymentLinkStatus && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold mb-3 ${
                  selectedBill.paymentLinkStatus === 'paid' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                  selectedBill.paymentLinkStatus === 'sent' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                  'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  {selectedBill.paymentLinkStatus === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {selectedBill.paymentLinkStatus === 'paid' ? 'Paid via Link' : selectedBill.paymentLinkStatus === 'sent' ? 'Link Sent' : 'Pending'}
                </div>
              )}
              <NotificationTimeline jobCardId={selectedBill.jobCardId} />
            </div>

            {/* Customer Review */}
            {selectedBill.reviewStatus && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">Customer Review</p>
                {selectedBill.reviewStatus === 'submitted' && selectedBill.reviewRating ? (
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= selectedBill.reviewRating! ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--text-tertiary)]/20'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedBill.reviewRating}/5</span>
                    </div>
                    {selectedBill.reviewComment && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{selectedBill.reviewComment}&rdquo;</p>
                      </div>
                    )}
                    {selectedBill.reviewSubmittedAt && (
                      <p className="text-[10px] text-[var(--text-tertiary)]">Submitted {formatDateTime(selectedBill.reviewSubmittedAt)}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <p className="text-xs text-purple-400 font-medium">Review link sent — awaiting feedback</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Flow Modal */}
      <Modal isOpen={paymentModal.isOpen} onClose={paymentModal.close} title={paymentStep === 2 ? '' : 'Payment'} showClose={paymentStep !== 2}>
        {selectedBill && (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {paymentStep === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Amount to pay</p>
                    <p className="text-3xl font-bold gradient-text mt-1">{formatCurrency(selectedBill.total)}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Select payment method</p>
                    {([
                      { method: 'cash' as const, icon: Banknote, label: 'Cash', desc: 'Pay with cash' },
                      { method: 'card' as const, icon: CreditCard, label: 'Card', desc: 'Credit or debit card' },
                      { method: 'qr' as const, icon: QrCode, label: 'QR Code', desc: 'Scan and pay via UPI' },
                    ]).map(({ method, icon: Icon, label, desc }) => (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                          selectedMethod === method
                            ? 'bg-red-500/15 border border-red-500/30'
                            : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)]'
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg ${selectedMethod === method ? 'bg-red-500/20' : 'bg-[var(--bg-glass)]'}`}>
                          <Icon className={`h-5 w-5 ${selectedMethod === method ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" disabled={!selectedMethod} onClick={() => setPaymentStep(1)} icon={<ArrowRight className="h-4 w-4" />}>
                    Continue
                  </Button>
                </motion.div>
              )}

              {paymentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-secondary)]">Confirm payment</p>
                    <p className="text-3xl font-bold gradient-text mt-1">{formatCurrency(selectedBill.total)}</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-2 capitalize">via {selectedMethod}</p>
                  </div>

                  {selectedMethod === 'qr' && (
                    <div className="flex justify-center">
                      <div className="w-48 h-48 rounded-2xl bg-white p-4 flex items-center justify-center">
                        <div className="w-full h-full bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                          <QrCode className="h-20 w-20 text-gray-800" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Customer</span>
                      <span className="text-[var(--text-primary)]">{selectedBill.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Vehicle</span>
                      <span className="text-[var(--text-primary)]">{selectedBill.vehicleName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Invoice</span>
                      <span className="text-[var(--text-primary)]">#{selectedBill.id}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setPaymentStep(0)}>Back</Button>
                    <Button className="flex-1" onClick={handleConfirmPayment}>Confirm Payment</Button>
                  </div>
                </motion.div>
              )}

              {paymentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                    className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Payment Successful!</h3>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">Transaction completed successfully</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                    <p className="text-2xl font-bold gradient-text">{formatCurrency(selectedBill.total)}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 capitalize">Paid via {selectedMethod}</p>
                  </div>
                  {reviewLink && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Review/Feedback link sent to customer:</p>
                      <p className="text-sm text-blue-500 font-mono break-all">{reviewLink}</p>
                    </div>
                  )}
                  <Button className="w-full" onClick={() => { paymentModal.close(); setReviewLink(''); }}>Done</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Modal>

      {/* Send Payment Link Modal */}
      {sendingBill && (
        <SendPaymentLinkModal
          isOpen={paymentLinkModal.isOpen}
          onClose={() => { paymentLinkModal.close(); setSendingBill(null); }}
          bill={sendingBill}
        />
      )}
    </div>
  );
}
