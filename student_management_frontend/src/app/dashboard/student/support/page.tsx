'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { FiUsers, FiMail, FiSend, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { Button, Input } from '@/components';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TutorSupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      await axios.post(`${baseUrl}/consultancy/contact/`, {
        name: `${user?.first_name} ${user?.last_name}` || user?.username,
        email: user?.email,
        subject: `[Tutor Support] ${subject}`,
        message: message
      });
      setSent(true);
      toast.success('Your message has been sent to the tutors!');
    } catch (error) {
      console.error('Error sending support request:', error);
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
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h2>
          <p className="text-gray-600 mb-8">
            Your academic query has been forwarded to our expert tutors. 
            You will receive a response at <strong>{user?.email}</strong> within 24 hours.
          </p>
          <Link href="/help-center">
            <Button className="w-full">Back to Help Center</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/help-center" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <FiArrowLeft className="mr-2" />
          Back to Help Center
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <FiUsers className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tutor Support</h1>
                <p className="text-gray-600">Get help with your courses and academic projects.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <Input 
                  placeholder="What do you need help with?" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Describe your academic query in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start space-x-4">
                <FiMail className="w-6 h-6 text-blue-600 mt-1" />
                <p className="text-blue-800 text-sm">
                  Your query will be assigned to a specialized tutor who will contact you via email 
                  or schedule a one-on-one session if necessary.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full py-4 text-lg flex items-center justify-center space-x-2"
                disabled={sending}
              >
                {sending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send Query to Tutors</span>
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
