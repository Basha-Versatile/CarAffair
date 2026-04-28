export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  vehicles: Vehicle[];
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  mileage: number;
  engineNumber?: string;
  chassisNumber?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  laborHours: number;
}

export interface PartItem {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Assignment {
  name: string;
  role: string;
}

export interface VehiclePhoto {
  id: string;
  dataUrl: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
}

export type JobCardStatus = 'pending' | 'approved' | 'in_progress' | 'completed';
export type QuoteStatus = 'pending' | 'sent' | 'accepted' | 'rejected';
export type QuoteType = 'with_gst' | 'proforma';
export const GST_RATE = 18;
export type NotificationChannel = 'whatsapp' | 'email';
export type NotificationStatus = 'sent' | 'delivered' | 'opened' | 'accepted' | 'rejected';

export interface JobCard {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  issues: string[];
  status: JobCardStatus;
  services: ServiceItem[];
  parts: PartItem[];
  estimatedCost: number;
  actualCost: number;
  assignees: Assignment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  quoteToken?: string;
  quoteStatus?: QuoteStatus;
  quoteSentAt?: string;
  quoteRespondedAt?: string;
  approvedServiceIds?: string[];
  approvedPartIds?: string[];
  quoteType?: QuoteType;
  quoteSubtotal?: number;
  quoteTaxAmount?: number;
  quoteTotal?: number;
  photos?: VehiclePhoto[];
}

export interface Notification {
  id: string;
  jobCardId: string;
  customerId: string;
  customerName: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  quoteToken: string;
  message: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  respondedAt?: string;
}

export interface QuoteResponse {
  token: string;
  jobCardId: string;
  action: 'accepted' | 'rejected';
  respondedAt: string;
  customerNote?: string;
}

export type AlertType =
  | 'quote_accepted'
  | 'quote_rejected'
  | 'payment_received'
  | 'review_submitted'
  | 'job_created'
  | 'status_updated'
  | 'booking_created';

export interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'disabled';
  bookingId?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  vehicleId?: string;
  registrationNumber: string;
  vehicleSummary?: string;
  notes?: string;
  status: 'confirmed' | 'cancelled';
  createdAt?: string;
}

export interface SystemAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  customerName: string;
  vehicleName?: string;
  read: boolean;
  createdAt: string;
}

export type PaymentLinkStatus = 'pending' | 'sent' | 'viewed' | 'paid';
export type ReviewStatus = 'pending' | 'sent' | 'submitted';

export interface Bill {
  id: string;
  jobCardId: string;
  customerId: string;
  customerName: string;
  vehicleName: string;
  licensePlate: string;
  services: ServiceItem[];
  parts: PartItem[];
  servicesCost: number;
  partsCost: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'unpaid' | 'paid' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'qr';
  createdAt: string;
  paidAt?: string;
  paymentToken?: string;
  paymentLinkStatus?: PaymentLinkStatus;
  paymentLinkSentAt?: string;
  reviewToken?: string;
  reviewStatus?: ReviewStatus;
  reviewSentAt?: string;
  reviewRating?: number;
  reviewComment?: string;
  reviewSubmittedAt?: string;
}

export interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  recentJobs: JobCard[];
}

export interface InventoryItem {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  quantity: number;
  unitCost: number;
  reorderLevel: number;
  supplier: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}
