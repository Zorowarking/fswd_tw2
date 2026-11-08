// Domain & Application Types for CampusServe

export type UserRole =
  | 'STUDENT'
  | 'SERVICE_PROVIDER'
  | 'ADMIN';

export type ServiceBookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ServicePaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface CampusServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  badge?: string;
  popular?: boolean;
}

export interface CampusServiceSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  durationMinutes?: number;
  categoryName: string;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface BookingSummary {
  id: string;
  bookingNumber: string;
  serviceName: string;
  scheduledAt: string;
  status: ServiceBookingStatus;
  location: string;
  amount: number;
  paymentStatus: ServicePaymentStatus;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface SystemHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  database: {
    provider: 'Neon PostgreSQL';
    status: 'configured' | 'pending';
  };
  auth: {
    provider: 'Clerk';
    status: 'configured' | 'mock_mode';
  };
  payments: {
    provider: 'Razorpay Test Mode';
    status: 'configured' | 'mock_mode';
  };
  timestamp: string;
}
