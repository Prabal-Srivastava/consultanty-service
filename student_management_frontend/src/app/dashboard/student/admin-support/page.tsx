'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { FiSettings, FiMail, FiSend, FiCheckCircle, FiArrowLeft, FiCreditCard, FiUser } from 'react-icons/fi';
import { Button, Input } from '@/components';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('billing');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await apiClient.post('/consultancy/contact/', {
        name: `${user?.first_name} ${user?.last_name}` || user?.username,
        email: user?.email,
        subject: `[Admin Support - ${category.toUpperCase()}] ${subject}`,
        message: message
      });
      setSent(true);
      toast.success('Your request has been sent to the administration!');
    } catch (error) {
      console.error('Error sending admin support request:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center"
        >
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Received!</h2>
          <p className="text-gray-600 mb-8">
            Our administration team has received your query. 
            We aim to resolve all administrative issues within 48 hours.
          </p>
          <Link href="/help-center">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Back to Help Center</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/help-center" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8 transition-colors">
          <FiArrowLeft className="mr-2" />
          Back to Help Center
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                <FiSettings className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Assistance</h1>
                <p className="text-gray-600">Help with billing, account issues, or general support.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCategory('billing')}
                  className={`p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                    category === 'billing' ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <FiCreditCard className={category === 'billing' ? 'text-purple-600' : 'text-gray-400'} />
                  <span className={`font-bold ${category === 'billing' ? 'text-purple-900' : 'text-gray-600'}`}>Billing & Payments</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('account')}
                  className={`p-4 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                    category === 'account' ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <FiUser className={category === 'account' ? 'text-purple-600' : 'text-gray-400'} />
                  <span className={`font-bold ${category === 'account' ? 'text-purple-900' : 'text-gray-600'}`}>Account & Access</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <Input 
                  placeholder="Summarize your issue" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-start space-x-4">
                <FiMail className="w-6 h-6 text-purple-600 mt-1" />
                <p className="text-purple-800 text-sm">
                  This request will be sent directly to our administrative team. 
                  For urgent payment issues, please include your transaction ID.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full py-4 text-lg flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700"
                disabled={sending}
              >
                {sending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <FiSend />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
