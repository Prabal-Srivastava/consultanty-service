'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentAPI } from '@/lib/api';
import { Button, Card } from '@/components';
import { FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const courseId = searchParams.get('course_id');
  const sessionId = searchParams.get('session_id');
  const installmentPlan = searchParams.get('installment_plan') === 'true';

  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string | null>(null);
  const [status, setStatus] = useState<'initial' | 'generated' | 'verifying' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (courseId || sessionId) {
      generateQR();
    }
  }, [courseId, sessionId]);

  const generateQR = async () => {
    try {
      setLoading(true);
      setStatus('initial');
      setErrorMessage('');
      
      const payload: any = {};
      if (courseId) payload.course_id = courseId;
      if (sessionId) payload.session_id = sessionId;
      if (installmentPlan) payload.installment_plan = true;

      const response = await paymentAPI.generateUPI(payload);
      
      setQrCode(response.data.qr_code);
      setPaymentId(response.data.payment_id);
      setAmount(response.data.amount);
      setUpiId(response.data.upi_id);
      setStatus('generated');
    } catch (error: any) {
      console.error('Error generating QR:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to generate payment QR code');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentId) return;

    try {
      setIsVerifying(true);
      setStatus('verifying');
      const response = await paymentAPI.verifyUPI({ payment_id: paymentId });
      
      if (response.data.status === 'verified') {
        setStatus('success');
        setTimeout(() => {
          if (courseId) router.push('/courses/my-enrollments');
          else if (sessionId) router.push('/consultancy');
          else router.push('/dashboard/student');
        }, 3000);
      } else {
        setStatus('error');
        setErrorMessage('Payment verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!courseId && !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Payment Request</h2>
          <p className="mt-2 text-gray-600">No course or session specified.</p>
          <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Complete Payment</h2>
        
        {loading && status === 'initial' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FiLoader className="animate-spin h-10 w-10 text-primary-600 mb-4" />
            <p>Generating secure payment QR code...</p>
          </div>
        ) : status === 'error' ? (
          <div className="bg-red-50 p-4 rounded-lg">
            <FiAlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
            <Button onClick={generateQR} className="mt-4" variant="outline">Try Again</Button>
          </div>
        ) : status === 'success' ? (
          <div className="bg-green-50 p-6 rounded-lg">
            <FiCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800">Payment Successful!</h3>
            <p className="text-green-600 mt-2">Redirecting you...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary-600">₹{amount}</p>
              {installmentPlan && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Installment Plan (50%)</span>}
            </div>

            {qrCode && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                <img src={`data:image/png;base64,${qrCode}`} alt="Payment QR Code" className="w-64 h-64 object-contain" />
                <p className="mt-2 text-sm text-gray-500">Scan with any UPI App</p>
                <p className="text-xs text-gray-400 mt-1">{upiId}</p>
              </div>
            )}

            <Button 
              onClick={verifyPayment} 
              className="w-full" 
              isLoading={isVerifying}
            >
              I Have Paid
            </Button>
            
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
