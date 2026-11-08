declare module 'razorpay' {
  interface RazorpayConfig {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateOptions {
    amount: number; // in smallest currency sub-unit (e.g. paise for INR)
    currency: string;
    receipt?: string;
    notes?: Record<string, string | number>;
    partial_payment?: boolean;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt?: string;
    status: 'created' | 'attempted' | 'paid';
    attempts: number;
    notes: Record<string, string | number>;
    created_at: number;
  }

  interface PaymentsFetchOptions {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  }

  interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    order_id: string;
    method: string;
    email: string;
    contact: string;
    created_at: number;
  }

  export default class Razorpay {
    constructor(config: RazorpayConfig);
    orders: {
      create(options: OrderCreateOptions, callback?: (err: Error | null, order: RazorpayOrder) => void): Promise<RazorpayOrder>;
      fetch(orderId: string, callback?: (err: Error | null, order: RazorpayOrder) => void): Promise<RazorpayOrder>;
    };
    payments: {
      fetch(paymentId: string, callback?: (err: Error | null, payment: RazorpayPayment) => void): Promise<RazorpayPayment>;
      all(options?: PaymentsFetchOptions, callback?: (err: Error | null, payments: { items: RazorpayPayment[] }) => void): Promise<{ items: RazorpayPayment[] }>;
    };
  }
}
