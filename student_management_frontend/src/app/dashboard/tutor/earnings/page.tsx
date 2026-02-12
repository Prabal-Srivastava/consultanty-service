'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { earningsAPI } from '@/lib/api';
import { FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { Button, Modal } from '@/components';
import toast from 'react-hot-toast';

export default function EarningsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'tutor')) {
      router.push('/');
    }
    
    if (user && user.user_type === 'tutor') {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [statsRes, payoutsRes] = await Promise.all([
        earningsAPI.getStats(),
        earningsAPI.getPayouts()
      ]);
      setStats(statsRes.data);
      setPayouts(payoutsRes.data);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (stats && parseFloat(payoutAmount) > stats.available_balance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      setPayoutLoading(true);
      await earningsAPI.requestPayout({ amount: parseFloat(payoutAmount) });
      toast.success('Payout requested successfully');
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast.error(error.response?.data?.error || 'Failed to request payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <Button onClick={() => setIsPayoutModalOpen(true)}>
          Request Payout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <FiDollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.total_earned || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.available_balance || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
              <FiClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.pending_withdrawal || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
        </div>
        
        {payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payout requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout: any) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{payout.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payout.status === 'processed' ? 'bg-green-100 text-green-800' :
                        payout.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.transaction_id || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="Request Payout"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Available: ₹{stats?.available_balance || 0})
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="0.00"
                max={stats?.available_balance}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum payout amount: ₹500
            </p>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <Button
              onClick={handleRequestPayout}
              disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) <= 0}
              className="w-full sm:col-start-2"
            >
              {payoutLoading ? 'Requesting...' : 'Submit Request'}
            </Button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => setIsPayoutModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
