'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds countdown
  const [canResend, setCanResend] = useState(false);

  // Check if there's a token in the URL
  const token = searchParams.get('token');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (!canResend && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [canResend, timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email/`, {
        token: token || otp
      });

      toast.success(response.data.message || 'Email verified successfully!');
      
      // Redirect to login after successful verification
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.error || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setTimer(60);
    setCanResend(false);

    try {
      const email = localStorage.getItem('verificationEmail');
      if (!email) {
        throw new Error('Email not found. Please register again.');
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification/`, {
        email
      });

      toast.success(response.data.message || 'Verification email has been sent!');
    } catch (error: any) {
      console.error('Resend error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to resend verification email.';
      toast.error(errorMessage);
      setCanResend(true); // Allow user to try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto bg-indigo-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
        <p className="text-gray-600 mt-2">
          Please enter the verification code sent to your email
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {!token && (
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
              maxLength={6}
            />
          </div>
        )}

        {token && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              Verification token detected from URL. Click verify to complete the process.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition ${
            loading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Didn&apos;t receive the code?{' '}
          <button
            onClick={handleResendOTP}
            disabled={!canResend || loading}
            className={`font-medium ${
              canResend && !loading
                ? 'text-indigo-600 hover:text-indigo-500'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {canResend ? 'Resend Code' : `Resend in ${timer}s`}
          </button>
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}