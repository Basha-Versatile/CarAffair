'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Mail, Send, Truck, Eye, CheckCircle, XCircle } from 'lucide-react';
import type { Notification } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { formatDateTime } from '@/utils/format';

interface NotificationTimelineProps {
  jobCardId: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Send; color: string; bg: string }> = {
  sent: { label: 'Sent', icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  delivered: { label: 'Delivered', icon: Truck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  opened: { label: 'Opened', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function NotificationTimeline({ jobCardId }: NotificationTimelineProps) {
  const notifications = useAppSelector((state) =>
    state.notifications.notifications.filter((n) => n.jobCardId === jobCardId)
  );

  if (notifications.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-[var(--text-tertiary)] text-sm">No quotes sent yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification, idx) => {
        const config = statusConfig[notification.status];
        const StatusIcon = config.icon;
        const ChannelIcon = notification.channel === 'whatsapp' ? MessageCircle : Mail;
        const channelLabel = notification.channel === 'whatsapp' ? 'WhatsApp' : 'Email';
        const channelColor = notification.channel === 'whatsapp' ? 'text-emerald-400' : 'text-blue-400';

        // Build timeline events for this notification
        const events: { label: string; time: string; status: string }[] = [
          { label: 'Sent', time: notification.sentAt, status: 'sent' },
        ];
        if (notification.deliveredAt) events.push({ label: 'Delivered', time: notification.deliveredAt, status: 'delivered' });
        if (notification.openedAt) events.push({ label: 'Opened', time: notification.openedAt, status: 'opened' });
        if (notification.respondedAt) {
          events.push({
            label: notification.status === 'accepted' ? 'Accepted' : 'Rejected',
            time: notification.respondedAt,
            status: notification.status,
          });
        }

        return (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChannelIcon className={`w-4 h-4 ${channelColor}`} />
                <span className="text-sm font-medium text-[var(--text-primary)]">{channelLabel}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bg}`}>
                <StatusIcon className={`w-3 h-3 ${config.color}`} />
                <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
              </div>
            </div>

            {/* Mini timeline */}
            <div className="flex items-center gap-1">
              {events.map((event, eIdx) => {
                const eConfig = statusConfig[event.status];
                return (
                  <div key={`${event.status}-${eIdx}`} className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${eConfig.color.replace('text-', 'bg-')}`} />
                      <p className="text-[9px] text-[var(--text-tertiary)] mt-1 whitespace-nowrap">{event.label}</p>
                      <p className="text-[8px] text-[var(--text-tertiary)]">{formatDateTime(event.time).split(',')[0]}</p>
                    </div>
                    {eIdx < events.length - 1 && (
                      <div className="w-6 h-px bg-[var(--border-color)] mb-5" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
