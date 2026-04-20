'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Mail, Eye, CheckCircle } from 'lucide-react';
import type { Bill, NotificationChannel } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { simulateSendPaymentNotification, formatPaymentWhatsAppMessage, formatPaymentEmailMessage } from '@/services/notificationService';
import { formatCurrency } from '@/utils/format';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface SendPaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill;
}

export default function SendPaymentLinkModal({ isOpen, onClose, bill }: SendPaymentLinkModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [channels, setChannels] = useState<NotificationChannel[]>(['whatsapp', 'email']);
  const [previewChannel, setPreviewChannel] = useState<NotificationChannel>('whatsapp');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');

  const customer = useAppSelector((state) =>
    state.customers.customers.find((c) => c.id === bill.customerId)
  );

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/preview`;
  const previewMessage = previewChannel === 'whatsapp'
    ? formatPaymentWhatsAppMessage(bill, previewUrl)
    : formatPaymentEmailMessage(bill, previewUrl);

  const handleSend = async () => {
    if (channels.length === 0) {
      toast.warning('Select Channel', 'Please select at least one notification channel.');
      return;
    }

    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1500));

    const token = simulateSendPaymentNotification(dispatch, bill, channels);
    const link = `${window.location.origin}/payment/${token}`;
    setPaymentLink(link);
    setIsSending(false);
    setSent(true);

    const channelNames = channels.map((c) => c === 'whatsapp' ? 'WhatsApp' : 'Email').join(' & ');
    toast.success('Payment Link Sent!', `Invoice sent via ${channelNames} to ${bill.customerName}`);
  };

  const handleClose = () => {
    setSent(false);
    setIsSending(false);
    setPaymentLink('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={sent ? 'Payment Link Sent' : 'Send Payment Link'} size="lg">
      {sent ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-5">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </motion.div>

          <div>
            <p className="text-[var(--text-primary)] font-semibold text-lg">Payment link sent to {bill.customerName}</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              {customer?.phone && `WhatsApp: ${customer.phone}`}
              {customer?.phone && customer?.email && ' | '}
              {customer?.email && `Email: ${customer.email}`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium">Customer payment link:</p>
            <p className="text-sm text-[var(--text-primary)] font-mono break-all">{paymentLink}</p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs text-emerald-500 font-medium">Amount: {formatCurrency(bill.total)} (incl. GST)</p>
          </div>

          <Button onClick={handleClose} className="w-full">Done</Button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Bill Summary */}
          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{bill.vehicleName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{bill.licensePlate} &middot; {bill.customerName}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Invoice #{bill.id}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(bill.total)}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">incl. {bill.taxRate}% GST</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
              <span>{bill.services.length} service(s)</span>
              <span>{bill.parts.length} part(s)</span>
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
              Send Payment Link
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
