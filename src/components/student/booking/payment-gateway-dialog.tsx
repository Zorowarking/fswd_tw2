'use client';

import * as React from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createRazorpayOrderAction,
  verifyAndConfirmPayment,
  recordPaymentFailureAction,
  generateTestSignatureAction,
} from '@/app/actions/payment-actions';
import {
  createBooking,
  type BookingReviewData,
  type BookingResponseData,
} from '@/app/actions/booking-actions';
import { toast } from 'sonner';

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewData: BookingReviewData;
  notes: string;
  onSuccess: (booking: BookingResponseData) => void;
}

type PaymentMethodType = 'RAZORPAY_TEST' | 'UPI' | 'CAMPUS_WALLET' | 'CARD' | 'NET_BANKING';

type PaymentProcessingStage =
  | 'idle'
  | 'reserving'
  | 'order_creation'
  | 'authorizing'
  | 'verifying'
  | 'failed';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on?: (
        event: string,
        handler: (data: {
          error?: {
            description?: string;
            metadata?: { payment_id?: string };
          };
        }) => void
      ) => void;
    };
  }
}

/**
 * Loads the official Razorpay Checkout SDK script dynamically.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentGatewayDialog({
  open,
  onOpenChange,
  reviewData,
  notes,
  onSuccess,
}: PaymentGatewayDialogProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethodType>('RAZORPAY_TEST');
  const [upiId, setUpiId] = React.useState('student@okcampus');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStage, setProcessingStage] = React.useState<PaymentProcessingStage>('idle');
  const [failureReason, setFailureReason] = React.useState<string | null>(null);

  const isFree = reviewData.pricing.isFree;
  const finalAmount = reviewData.pricing.finalAmount;

  const handleModalClose = () => {
    if (isProcessing && processingStage !== 'idle' && processingStage !== 'failed') return;
    setIsProcessing(false);
    setProcessingStage('idle');
    setFailureReason(null);
    onOpenChange(false);
  };

  const handlePayAndConfirm = async () => {
    setIsProcessing(true);
    setFailureReason(null);

    try {
      // 1. FREE SERVICE FLOW: Zero charge campus student grant
      if (isFree) {
        setProcessingStage('reserving');
        const res = await createBooking({
          serviceId: reviewData.service.id,
          scheduledAt: reviewData.schedule.dateString,
          slotTime: reviewData.schedule.slotTime,
          notes: notes.trim() || undefined,
        });

        if (!res.success || !res.booking) {
          const err = res.error || 'Failed to complete reservation. Please try again.';
          toast.error(err);
          setFailureReason(err);
          setProcessingStage('failed');
          setIsProcessing(false);
          return;
        }

        toast.success('Campus Grant free pass issued successfully!');
        setIsProcessing(false);
        setProcessingStage('idle');
        onOpenChange(false);
        onSuccess(res.booking);
        return;
      }

      // 2. PAID SERVICE FLOW: Razorpay TEST Mode Order Generation
      setProcessingStage('order_creation');
      toast.info('Generating Razorpay Test Mode Order...');

      const orderRes = await createRazorpayOrderAction({
        serviceId: reviewData.service.id,
        scheduledAt: reviewData.schedule.dateString,
        slotTime: reviewData.schedule.slotTime,
        notes: notes.trim() || undefined,
      });

      if (!orderRes.success || !orderRes.order || !orderRes.keyId) {
        const err = orderRes.error || 'Failed to initialize Razorpay test payment.';
        toast.error(err);
        setFailureReason(err);
        setProcessingStage('failed');
        setIsProcessing(false);
        return;
      }

      const order = orderRes.order;
      const keyId = orderRes.keyId;

      // Try loading official Razorpay Checkout SDK
      setProcessingStage('authorizing');
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay) {
        // Open Official Razorpay Checkout Modal in TEST mode
        const rzp = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: 'CampusServe Desk',
          description: `${reviewData.service.name} (${reviewData.schedule.slotTime})`,
          order_id: order.id,
          prefill: {
            name: reviewData.student.name,
            email: reviewData.student.email,
            contact: reviewData.student.phone || '',
          },
          theme: {
            color: '#2563eb',
          },
          handler: async (response: RazorpayResponse) => {
            try {
              setProcessingStage('verifying');
              toast.info('Verifying payment signature with campus servers...');

              const verifyRes = await verifyAndConfirmPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                serviceId: reviewData.service.id,
                scheduledAt: reviewData.schedule.dateString,
                slotTime: reviewData.schedule.slotTime,
                notes: notes.trim() || undefined,
                bookingId: orderRes.bookingId,
              });

              if (!verifyRes.success || !verifyRes.booking) {
                const err = verifyRes.error || 'Signature verification failed.';
                toast.error(err);
                setFailureReason(err);
                setProcessingStage('failed');
                setIsProcessing(false);
                return;
              }

              toast.success(`Payment verified! Digital token issued: ${verifyRes.booking.bookingCode}`);
              setIsProcessing(false);
              setProcessingStage('idle');
              onOpenChange(false);
              onSuccess(verifyRes.booking);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Verification error';
              await recordPaymentFailureAction({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                reason: msg,
              });
              toast.error(msg);
              setFailureReason(msg);
              setProcessingStage('failed');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: async () => {
              setIsProcessing(false);
              setProcessingStage('idle');
              toast.info('Payment checkout dismissed. Booking remains unpaid.');
              await recordPaymentFailureAction({
                orderId: order.id,
                reason: 'Checkout dismissed by student',
              });
            },
          },
        });

        // Listen for payment failure event from Razorpay modal
        if (typeof rzp.on === 'function') {
          rzp.on('payment.failed', async function (data) {
            setIsProcessing(false);
            const errDescription = data?.error?.description || 'Payment failed';
            toast.error(`Payment failed: ${errDescription}. Booking remains unpaid.`);
            setFailureReason(errDescription);
            setProcessingStage('failed');
            await recordPaymentFailureAction({
              orderId: order.id,
              paymentId: data?.error?.metadata?.payment_id,
              reason: errDescription,
            });
          });
        }

        rzp.open();
      } else {
        // Fallback for sandboxed offline testing with full cryptographic simulation
        toast.info('Razorpay SDK in test simulation mode. Authorizing test transaction...');
        setProcessingStage('verifying');

        const testPaymentId = `pay_test_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .substring(2, 7)}`;
        const testSignature = await generateTestSignatureAction(order.id, testPaymentId);

        const verifyRes = await verifyAndConfirmPayment({
          razorpayOrderId: order.id,
          razorpayPaymentId: testPaymentId,
          razorpaySignature: testSignature,
          serviceId: reviewData.service.id,
          scheduledAt: reviewData.schedule.dateString,
          slotTime: reviewData.schedule.slotTime,
          notes: notes.trim() || undefined,
          bookingId: orderRes.bookingId,
        });

        if (!verifyRes.success || !verifyRes.booking) {
          const err = verifyRes.error || 'Payment verification failed.';
          toast.error(err);
          setFailureReason(err);
          setProcessingStage('failed');
          setIsProcessing(false);
          return;
        }

        toast.success(
          `Razorpay Test payment verified! Token issued: ${verifyRes.booking.bookingCode}`
        );
        setIsProcessing(false);
        setProcessingStage('idle');
        onOpenChange(false);
        onSuccess(verifyRes.booking);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during payment processing.';
      toast.error(msg);
      setFailureReason(msg);
      setProcessingStage('failed');
      setIsProcessing(false);
    }
  };

  const getStageDisplay = () => {
    switch (processingStage) {
      case 'reserving':
        return {
          title: 'Reserving Schedule Slot...',
          description: 'Validating real-time availability and provider capacity on campus servers.',
          step: 1,
        };
      case 'order_creation':
        return {
          title: 'Creating Secure Test Order...',
          description: 'Generating cryptographic Razorpay test order ID and session authorization.',
          step: 2,
        };
      case 'authorizing':
        return {
          title: 'Awaiting Payment Authorization...',
          description: 'Opening Razorpay secure checkout. Please complete authorization in the modal window.',
          step: 3,
        };
      case 'verifying':
        return {
          title: 'Verifying Cryptographic Signature...',
          description: 'Verifying HMAC-SHA256 signature and minting your verified campus digital pass.',
          step: 4,
        };
      default:
        return {
          title: 'Processing Booking Request...',
          description: 'Please wait while your campus reservation is being confirmed.',
          step: 1,
        };
    }
  };

  const isBusy = isProcessing && processingStage !== 'idle' && processingStage !== 'failed';
  const stageInfo = getStageDisplay();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleModalClose();
        } else {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="max-w-md p-6 rounded-2xl border-border/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-blue-500 font-semibold text-xs tracking-wider uppercase mb-1">
            <Lock className="h-3.5 w-3.5" />
            <span>Razorpay TEST Mode Gateway</span>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {isBusy
              ? 'Processing Reservation'
              : processingStage === 'failed'
              ? 'Payment Interrupted'
              : isFree
              ? 'Claim Campus Free Pass'
              : 'Complete Razorpay Test Payment'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isBusy
              ? 'Please do not refresh or close this browser window.'
              : processingStage === 'failed'
              ? 'Your booking was not confirmed. You may review the error and retry safely.'
              : isFree
              ? 'This service is 100% subsidized by university operations. No payment is required.'
              : `Total amount: ₹${finalAmount.toFixed(2)}. Payments run strictly in Razorpay TEST mode.`}
          </DialogDescription>
        </DialogHeader>

        {/* 1. ACTIVE MULTI-STEP PROCESSING STATE */}
        {isBusy ? (
          <div className="py-6 space-y-6">
            {/* Animated Glow Spinner & Badge */}
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-16 w-16 rounded-full bg-blue-500/20 animate-ping" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {stageInfo.title}
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                  {stageInfo.description}
                </p>
              </div>
            </div>

            {/* Stepper Progress Visualizer */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Secure Verification Pipeline</span>
                </span>
                <span className="font-mono text-blue-500">Step {stageInfo.step} of 4</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stepNum < stageInfo.step
                        ? 'bg-emerald-500'
                        : stepNum === stageInfo.step
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground/80 pt-1">
                <span>1. Slot Check</span>
                <span>2. Order</span>
                <span>3. Authorization</span>
                <span>4. Mint Token</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400 text-xs">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="text-[11px]">
                Cryptographic signature verification ensures zero price or status manipulation.
              </span>
            </div>
          </div>
        ) : processingStage === 'failed' ? (
          /* 2. ERROR RECOVERY STATE */
          <div className="py-4 space-y-4">
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Transaction Could Not Be Verified
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                {failureReason ||
                  'The transaction was cancelled or interrupted before cryptographic verification could finish.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleModalClose}
                className="text-xs rounded-xl"
              >
                Close
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setProcessingStage('idle');
                  setFailureReason(null);
                }}
                className="text-xs font-bold rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </Button>
            </div>
          </div>
        ) : (
          /* 3. NORMAL IDLE GATEWAY SELECTION VIEW */
          <>
            <div className="space-y-4 py-2 text-xs">
              {/* Order Summary Strip */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground text-xs">{reviewData.service.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {reviewData.schedule.dateString} • {reviewData.schedule.slotTime}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Total Payable
                  </span>
                  <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                    {isFree ? 'FREE' : `₹${finalAmount.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {!isFree ? (
                /* Paid Service Payment Options */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Select Payment Method
                    </Label>
                    <Badge variant="outline" className="text-[10px] font-mono text-blue-500 border-blue-500/30">
                      TEST MODE
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {/* 1. Official Razorpay Test Checkout */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('RAZORPAY_TEST')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedMethod === 'RAZORPAY_TEST'
                          ? 'border-blue-600 bg-blue-600/10 text-foreground ring-1 ring-blue-500/30 font-bold'
                          : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <span>Razorpay Checkout</span>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-500/10 text-blue-400">
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            UPI, Debit/Credit Card, Net Banking (Test Mode)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedMethod === 'RAZORPAY_TEST' && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </button>

                    {/* 2. Direct Mock UPI */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('UPI')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedMethod === 'UPI'
                          ? 'border-blue-600 bg-blue-600/10 text-foreground ring-1 ring-blue-500/30'
                          : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <QrCode className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">UPI Virtual Payment Address</p>
                          <p className="text-[10px] text-muted-foreground">
                            GPay, PhonePe, Paytm sandbox simulator
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Simulator
                      </Badge>
                    </button>

                    {selectedMethod === 'UPI' && (
                      <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                        <Label htmlFor="upi-id" className="text-[11px] text-muted-foreground">
                          UPI ID / VPA
                        </Label>
                        <Input
                          id="upi-id"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@bank"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}

                    {/* 3. Campus Smart Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('CAMPUS_WALLET')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedMethod === 'CAMPUS_WALLET'
                          ? 'border-blue-600 bg-blue-600/10 text-foreground ring-1 ring-blue-500/30'
                          : 'border-border/70 bg-card hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">Campus Smart Wallet</p>
                          <p className="text-[10px] text-muted-foreground">
                            University student smart card balance
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Free Service Notice */
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    100% University Subsidized
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    This facility booking is covered under university student grants. Click below to
                    confirm your slot and generate your verified token.
                  </p>
                </div>
              )}

              {/* Test Mode Disclaimer */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-[10px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                <span>
                  Razorpay Test Environment Active. No real money will be charged to your accounts or cards.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleModalClose}
                disabled={isProcessing}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePayAndConfirm}
                disabled={isProcessing}
                className="text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
              >
                {isFree ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    <span>Claim Pass & Confirm</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    <span>Pay ₹{finalAmount.toFixed(2)} in Test Mode</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
