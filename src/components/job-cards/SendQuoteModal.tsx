'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Mail, Eye, CheckCircle, Receipt, FileText } from 'lucide-react';
import type { JobCard, NotificationChannel, QuoteType } from '@/types';
import { GST_RATE } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { simulateSendNotification, formatWhatsAppMessage, formatEmailMessage } from '@/services/notificationService';
import { formatCurrency } from '@/utils/format';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface SendQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCard;
}

export default function SendQuoteModal({ isOpen, onClose, jobCard }: SendQuoteModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [channels, setChannels] = useState<NotificationChannel[]>(['whatsapp', 'email']);
  const [previewChannel, setPreviewChannel] = useState<NotificationChannel>('whatsapp');
  const [quoteType, setQuoteType] = useState<QuoteType>('with_gst');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [quoteLink, setQuoteLink] = useState('');

  const subtotal = jobCard.estimatedCost;
  const taxAmount = useMemo(
    () => (quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0),
    [quoteType, subtotal]
  );
  const total = subtotal + taxAmount;

  const customer = useAppSelector((state) =>
    state.customers.customers.find((c) => c.id === jobCard.customerId)
  );

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/preview`;
  const previewMessage = previewChannel === 'whatsapp'
    ? formatWhatsAppMessage(jobCard, previewUrl, quoteType)
    : formatEmailMessage(jobCard, previewUrl, quoteType);

  const handleSend = async () => {
    if (channels.length === 0) {
      toast.warning('Select Channel', 'Please select at least one notification channel.');
      return;
    }

    setIsSending(true);
    let token: string;
    try {
      token = await simulateSendNotification(dispatch, jobCard, channels, quoteType);
    } catch (err) {
      setIsSending(false);
      toast.error('Send Failed', err instanceof Error ? err.message : 'Could not save quote');
      return;
    }
    const link = `${window.location.origin}/quote/${token}`;
    setQuoteLink(link);
    setIsSending(false);
    setSent(true);

    const channelNames = channels.map((c) => c === 'whatsapp' ? 'WhatsApp' : 'Email').join(' & ');
    const typeLabel = quoteType === 'with_gst' ? 'with GST' : 'proforma';
    toast.success('Quote Sent!', `${typeLabel} estimate sent via ${channelNames} to ${jobCard.customerName}`);
  };

  const handleClose = () => {
    setSent(false);
    setIsSending(false);
    setQuoteLink('');
    setQuoteType('with_gst');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={sent ? 'Quote Sent Successfully' : 'Send Quote to Customer'} size="lg">
      {sent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6 space-y-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </motion.div>

          <div>
            <p className="text-[var(--text-primary)] font-semibold text-lg">Quote sent to {jobCard.customerName}</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              {customer?.phone && `WhatsApp: ${customer.phone}`}
              {customer?.phone && customer?.email && ' | '}
              {customer?.email && `Email: ${customer.email}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Customer approval link:</p>
            <p className="text-sm text-[var(--text-primary)] font-mono break-all">{quoteLink}</p>
          </div>

          <Button onClick={handleClose} className="w-full">Done</Button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Quote Summary */}
          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{jobCard.vehicleName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{jobCard.licensePlate} &middot; {jobCard.customerName}</p>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(jobCard.estimatedCost)}</p>
            </div>
            <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
              <span>{jobCard.services.length} service(s)</span>
              <span>{jobCard.parts.length} part(s)</span>
            </div>
          </div>

          {/* Quote Type */}
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">Quote Type</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuoteType('with_gst')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  quoteType === 'with_gst'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] opacity-60 hover:opacity-100'
                }`}
              >
                <Receipt className={`w-5 h-5 mt-0.5 flex-shrink-0 ${quoteType === 'with_gst' ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">With GST</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Tax invoice incl. {GST_RATE}% GST</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setQuoteType('proforma')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  quoteType === 'proforma'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] opacity-60 hover:opacity-100'
                }`}
              >
                <FileText className={`w-5 h-5 mt-0.5 flex-shrink-0 ${quoteType === 'proforma' ? 'text-amber-500' : 'text-[var(--text-tertiary)]'}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Proforma</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Estimate without GST</p>
                </div>
              </button>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] space-y-1 text-xs">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>GST ({GST_RATE}%)</span>
                <span>{quoteType === 'with_gst' ? formatCurrency(taxAmount) : '—'}</span>
              </div>
              <div className="flex justify-between pt-1.5 mt-1 border-t border-[var(--border-color)] text-[var(--text-primary)] font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">Send via</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleChannel('whatsapp')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  channels.includes('whatsapp')
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] opacity-50'
                }`}
              >
                <MessageCircle className={`w-5 h-5 ${channels.includes('whatsapp') ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">WhatsApp</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{customer?.phone || 'No phone'}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleChannel('email')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  channels.includes('email')
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] opacity-50'
                }`}
              >
                <Mail className={`w-5 h-5 ${channels.includes('email') ? 'text-blue-500' : 'text-[var(--text-tertiary)]'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{customer?.email || 'No email'}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Message Preview
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewChannel('whatsapp')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                    previewChannel === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-500' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('email')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                    previewChannel === 'email' ? 'bg-blue-500/10 text-blue-500' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  Email
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] max-h-48 overflow-y-auto">
              <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">{previewMessage}</pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSend}
              isLoading={isSending}
              icon={!isSending ? <Send className="w-4 h-4" /> : undefined}
              className="flex-1"
            >
              Send Quote
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
