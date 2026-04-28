import type { AppDispatch } from '@/store/store';
import type { JobCard, Bill, NotificationChannel, QuoteType } from '@/types';
import { GST_RATE } from '@/types';
import { sendQuote } from '@/features/jobCards/jobCardSlice';
import { sendPaymentLink, sendReviewLink, sendReviewLinkByPaymentToken } from '@/features/billing/billingSlice';
import { addNotification, updateNotificationStatus } from '@/features/notifications/notificationSlice';
import { formatCurrency, generateId, generateQuoteToken, generatePaymentToken, generateReviewToken } from '@/utils/format';

export function formatWhatsAppMessage(jobCard: JobCard, quoteUrl: string, quoteType: QuoteType = 'with_gst'): string {
  const servicesList = jobCard.services.map((s) => `  - ${s.name}: ${formatCurrency(s.cost)}`).join('\n');
  const partsList = jobCard.parts.map((p) => `  - ${p.name} (x${p.quantity}): ${formatCurrency(p.totalCost)}`).join('\n');
  const issuesList = jobCard.issues.map((i) => `  - ${i}`).join('\n');
  const subtotal = jobCard.estimatedCost;
  const taxAmount = quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0;
  const total = subtotal + taxAmount;
  const heading = quoteType === 'with_gst' ? 'Service Estimate' : 'Proforma Estimate (without GST)';

  return [
    `Hello ${jobCard.customerName},`,
    ``,
    `Your vehicle *${jobCard.vehicleName}* (${jobCard.licensePlate}) has been inspected at *Car Affair*.`,
    ``,
    `*${heading}*`,
    ``,
    `*Reported Issues:*`,
    `${issuesList}`,
    ``,
    jobCard.photos && jobCard.photos.length > 0 ? `*${jobCard.photos.length} inspection photo(s)* attached in your quote link (each time & location stamped).` : '',
    ``,
    jobCard.services.length > 0 ? `*Services:*\n${servicesList}` : '',
    jobCard.parts.length > 0 ? `*Parts:*\n${partsList}` : '',
    ``,
    `*Subtotal:* ${formatCurrency(subtotal)}`,
    quoteType === 'with_gst' ? `*GST (${GST_RATE}%):* ${formatCurrency(taxAmount)}` : '_GST not applicable (proforma)_',
    `*Total: ${formatCurrency(total)}*`,
    ``,
    `View & approve your quote:`,
    quoteUrl,
    ``,
    `Thank you for choosing Car Affair!`,
  ].filter(Boolean).join('\n');
}

export function formatEmailMessage(jobCard: JobCard, quoteUrl: string, quoteType: QuoteType = 'with_gst'): string {
  const servicesList = jobCard.services.map((s) => `  - ${s.name}: ${formatCurrency(s.cost)}`).join('\n');
  const partsList = jobCard.parts.map((p) => `  - ${p.name} (x${p.quantity}): ${formatCurrency(p.totalCost)}`).join('\n');
  const issuesList = jobCard.issues.map((i) => `  - ${i}`).join('\n');
  const subtotal = jobCard.estimatedCost;
  const taxAmount = quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0;
  const total = subtotal + taxAmount;
  const heading = quoteType === 'with_gst' ? 'Service Estimate' : 'Proforma Estimate (without GST)';

  return [
    `Dear ${jobCard.customerName},`,
    ``,
    `We have completed the inspection of your vehicle ${jobCard.vehicleName} (${jobCard.licensePlate}) at Car Affair.`,
    ``,
    heading,
    ``,
    `Reported Issues:`,
    `${issuesList}`,
    ``,
    jobCard.photos && jobCard.photos.length > 0 ? `${jobCard.photos.length} inspection photo(s) attached in your quote link (each time & location stamped).` : '',
    ``,
    jobCard.services.length > 0 ? `Services:\n${servicesList}` : '',
    jobCard.parts.length > 0 ? `Parts Required:\n${partsList}` : '',
    ``,
    `Subtotal: ${formatCurrency(subtotal)}`,
    quoteType === 'with_gst' ? `GST (${GST_RATE}%): ${formatCurrency(taxAmount)}` : 'GST not applicable (proforma estimate)',
    `Total: ${formatCurrency(total)}`,
    ``,
    `Please review and approve your quote by visiting the link below:`,
    quoteUrl,
    ``,
    `If you have any questions, feel free to contact us.`,
    ``,
    `Best regards,`,
    `Car Affair Team`,
  ].filter(Boolean).join('\n');
}

export async function simulateSendNotification(
  dispatch: AppDispatch,
  jobCard: JobCard,
  channels: NotificationChannel[],
  quoteType: QuoteType = 'with_gst'
): Promise<string> {
  const token = jobCard.quoteToken || generateQuoteToken();
  const quoteUrl = `${window.location.origin}/quote/${token}`;

  // Persist quote token + type to MongoDB before returning the link to the user.
  if (!jobCard.quoteToken) {
    await dispatch(sendQuote({ id: jobCard.id, quoteToken: token, quoteType }));
  }

  // Send notification for each channel
  channels.forEach((channel) => {
    const notificationId = `notif-${generateId()}`;
    const message = channel === 'whatsapp'
      ? formatWhatsAppMessage(jobCard, quoteUrl, quoteType)
      : formatEmailMessage(jobCard, quoteUrl, quoteType);

    dispatch(addNotification({
      id: notificationId,
      jobCardId: jobCard.id,
      customerId: jobCard.customerId,
      customerName: jobCard.customerName,
      channel,
      status: 'sent',
      quoteToken: token,
      message,
      sentAt: new Date().toISOString(),
    }));

    // Simulate delivery after 2s
    setTimeout(() => {
      dispatch(updateNotificationStatus({
        id: notificationId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      }));
    }, 2000);

    // Simulate opened after 5s
    setTimeout(() => {
      dispatch(updateNotificationStatus({
        id: notificationId,
        status: 'opened',
        timestamp: new Date().toISOString(),
      }));
    }, 5000);
  });

  return token;
}

// --- Job Status Update Notifications ---

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function simulateSendStatusNotification(
  dispatch: AppDispatch,
  jobCard: JobCard,
  newStatus: string
): void {
  const channels: NotificationChannel[] = ['whatsapp', 'email'];

  channels.forEach((channel) => {
    const notificationId = `notif-${generateId()}`;

    const statusMsg = newStatus === 'approved' ? 'Your job has been approved and our team will start working on it soon.'
      : newStatus === 'in_progress' ? 'Work has started on your vehicle. We will keep you updated.'
      : newStatus === 'completed' ? 'Great news! The service is complete. Your vehicle is ready for pickup.'
      : `Your job status has been updated to ${statusLabels[newStatus] || newStatus}.`;

    const message = channel === 'whatsapp'
      ? `Hello ${jobCard.customerName},\n\nUpdate on your vehicle *${jobCard.vehicleName}* (${jobCard.licensePlate}) at *Car Affair*:\n\n*Status: ${statusLabels[newStatus] || newStatus}*\n\n${statusMsg}\n\nThank you for choosing Car Affair!`
      : `Dear ${jobCard.customerName},\n\nWe'd like to update you on the status of your vehicle ${jobCard.vehicleName} (${jobCard.licensePlate}) at Car Affair.\n\nCurrent Status: ${statusLabels[newStatus] || newStatus}\n\n${statusMsg}\n\nBest regards,\nCar Affair Team`;

    dispatch(addNotification({
      id: notificationId,
      jobCardId: jobCard.id,
      customerId: jobCard.customerId,
      customerName: jobCard.customerName,
      channel,
      status: 'sent',
      quoteToken: `status-${jobCard.id}-${newStatus}`,
      message,
      sentAt: new Date().toISOString(),
    }));

    setTimeout(() => {
      dispatch(updateNotificationStatus({ id: notificationId, status: 'delivered', timestamp: new Date().toISOString() }));
    }, 2000);
  });
}

export function simulateSendJobCreatedNotification(
  dispatch: AppDispatch,
  jobCard: JobCard
): void {
  const channels: NotificationChannel[] = ['whatsapp', 'email'];

  channels.forEach((channel) => {
    const notificationId = `notif-${generateId()}`;
    const assigneesList = jobCard.assignees
      .filter((a) => a.name.trim())
      .map((a) => `${a.role}: ${a.name}`)
      .join(', ');
    const issuesList = jobCard.issues.map((i) => `  - ${i}`).join('\n');
    const message = channel === 'whatsapp'
      ? `Hello ${jobCard.customerName},\n\nYour vehicle *${jobCard.vehicleName}* (${jobCard.licensePlate}) has been registered at *Car Affair* for service.\n\n*Reported Issues:*\n${issuesList}${assigneesList ? `\n\n*Assigned To:* ${assigneesList}` : ''}\n\nWe'll keep you updated on the progress. Thank you for choosing Car Affair!`
      : `Dear ${jobCard.customerName},\n\nYour vehicle ${jobCard.vehicleName} (${jobCard.licensePlate}) has been registered for service at Car Affair.\n\nReported Issues:\n${issuesList}${assigneesList ? `\n\nAssigned To: ${assigneesList}` : ''}\n\nWe will notify you as the service progresses.\n\nBest regards,\nCar Affair Team`;

    dispatch(addNotification({
      id: notificationId,
      jobCardId: jobCard.id,
      customerId: jobCard.customerId,
      customerName: jobCard.customerName,
      channel,
      status: 'sent',
      quoteToken: `created-${jobCard.id}`,
      message,
      sentAt: new Date().toISOString(),
    }));

    setTimeout(() => {
      dispatch(updateNotificationStatus({ id: notificationId, status: 'delivered', timestamp: new Date().toISOString() }));
    }, 2000);
  });
}

// --- Review/Feedback Notifications ---

export function formatReviewWhatsAppMessage(bill: Bill, reviewUrl: string): string {
  return [
    `Hello ${bill.customerName},`,
    ``,
    `Thank you for your payment for *${bill.vehicleName}* (${bill.licensePlate}).`,
    ``,
    `We'd love to hear about your experience at *Car Affair*! Your feedback helps us serve you better.`,
    ``,
    `Share your review:`,
    reviewUrl,
    ``,
    `Thank you for choosing Car Affair!`,
  ].join('\n');
}

export function formatReviewEmailMessage(bill: Bill, reviewUrl: string): string {
  return [
    `Dear ${bill.customerName},`,
    ``,
    `Thank you for your recent payment for the service of ${bill.vehicleName} (${bill.licensePlate}).`,
    ``,
    `We hope you had a great experience at Car Affair. Your feedback is invaluable to us.`,
    ``,
    `Please take a moment to share your review:`,
    reviewUrl,
    ``,
    `Best regards,`,
    `Car Affair Team`,
  ].join('\n');
}

export async function simulateSendReviewNotification(
  dispatch: AppDispatch,
  bill: Bill,
  options?: { byPaymentToken?: boolean }
): Promise<string> {
  const token = generateReviewToken();
  const reviewUrl = `${window.location.origin}/review/${token}`;

  if (options?.byPaymentToken && bill.paymentToken) {
    await dispatch(sendReviewLinkByPaymentToken({ paymentToken: bill.paymentToken, reviewToken: token }));
  } else {
    await dispatch(sendReviewLink({ id: bill.id, reviewToken: token }));
  }

  const channels: NotificationChannel[] = ['whatsapp', 'email'];

  channels.forEach((channel) => {
    const notificationId = `notif-${generateId()}`;
    const message = channel === 'whatsapp'
      ? formatReviewWhatsAppMessage(bill, reviewUrl)
      : formatReviewEmailMessage(bill, reviewUrl);

    dispatch(addNotification({
      id: notificationId,
      jobCardId: bill.jobCardId,
      customerId: bill.customerId,
      customerName: bill.customerName,
      channel,
      status: 'sent',
      quoteToken: token,
      message,
      sentAt: new Date().toISOString(),
    }));

    setTimeout(() => {
      dispatch(updateNotificationStatus({
        id: notificationId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      }));
    }, 2000);
  });

  return token;
}

// --- Payment Link Notifications ---

export function formatPaymentWhatsAppMessage(bill: Bill, paymentUrl: string): string {
  const servicesList = bill.services.map((s) => `  - ${s.name}: ${formatCurrency(s.cost)}`).join('\n');
  const partsList = bill.parts.map((p) => `  - ${p.name} (x${p.quantity}): ${formatCurrency(p.totalCost)}`).join('\n');

  return [
    `Hello ${bill.customerName},`,
    ``,
    `Your invoice for *${bill.vehicleName}* (${bill.licensePlate}) is ready.`,
    ``,
    bill.services.length > 0 ? `*Services:*\n${servicesList}` : '',
    bill.parts.length > 0 ? `*Parts:*\n${partsList}` : '',
    ``,
    `*Subtotal:* ${formatCurrency(bill.subtotal)}`,
    `*GST (${bill.taxRate}%):* ${formatCurrency(bill.taxAmount)}`,
    `*Total Amount Due: ${formatCurrency(bill.total)}*`,
    ``,
    `Pay securely online:`,
    paymentUrl,
    ``,
    `Thank you for choosing Car Affair!`,
  ].filter(Boolean).join('\n');
}

export function formatPaymentEmailMessage(bill: Bill, paymentUrl: string): string {
  const servicesList = bill.services.map((s) => `  - ${s.name}: ${formatCurrency(s.cost)}`).join('\n');
  const partsList = bill.parts.map((p) => `  - ${p.name} (x${p.quantity}): ${formatCurrency(p.totalCost)}`).join('\n');

  return [
    `Dear ${bill.customerName},`,
    ``,
    `Your invoice for the service of ${bill.vehicleName} (${bill.licensePlate}) has been generated.`,
    ``,
    `Invoice: #${bill.id}`,
    ``,
    bill.services.length > 0 ? `Services:\n${servicesList}` : '',
    bill.parts.length > 0 ? `Parts:\n${partsList}` : '',
    ``,
    `Subtotal: ${formatCurrency(bill.subtotal)}`,
    `GST (${bill.taxRate}%): ${formatCurrency(bill.taxAmount)}`,
    `Total Amount Due: ${formatCurrency(bill.total)}`,
    ``,
    `Please complete your payment using the link below:`,
    paymentUrl,
    ``,
    `If you have any questions, feel free to contact us.`,
    ``,
    `Best regards,`,
    `Car Affair Team`,
  ].filter(Boolean).join('\n');
}

export async function simulateSendPaymentNotification(
  dispatch: AppDispatch,
  bill: Bill,
  channels: NotificationChannel[]
): Promise<string> {
  const token = bill.paymentToken || generatePaymentToken();
  const paymentUrl = `${window.location.origin}/payment/${token}`;

  if (!bill.paymentToken) {
    await dispatch(sendPaymentLink({ id: bill.id, paymentToken: token }));
  }

  channels.forEach((channel) => {
    const notificationId = `notif-${generateId()}`;
    const message = channel === 'whatsapp'
      ? formatPaymentWhatsAppMessage(bill, paymentUrl)
      : formatPaymentEmailMessage(bill, paymentUrl);

    dispatch(addNotification({
      id: notificationId,
      jobCardId: bill.jobCardId,
      customerId: bill.customerId,
      customerName: bill.customerName,
      channel,
      status: 'sent',
      quoteToken: token,
      message,
      sentAt: new Date().toISOString(),
    }));

    setTimeout(() => {
      dispatch(updateNotificationStatus({
        id: notificationId,
        status: 'delivered',
        timestamp: new Date().toISOString(),
      }));
    }, 2000);

    setTimeout(() => {
      dispatch(updateNotificationStatus({
        id: notificationId,
        status: 'opened',
        timestamp: new Date().toISOString(),
      }));
    }, 5000);
  });

  return token;
}
