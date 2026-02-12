'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiMail, FiUsers, FiClock, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components';

const HelpCenterPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  const visitorOptions = [
    {
      title: 'Contact Support',
      desc: 'Send us a message and we\'ll get back to you within 24 hours.',
      icon: <FiMail className="w-6 h-6" />,
      action: () => router.push('/contact'),
      label: 'Contact Us'
    },
    {
      title: 'Browse FAQs',
      desc: 'Quick answers to common questions about our services.',
      icon: <FiMessageSquare className="w-6 h-6" />,
      action: () => router.push('/faq'),
      label: 'View FAQs'
    }
  ];

  const studentOptions = [
    {
      title: 'Tutor Support',
      desc: 'Direct communication with your assigned tutors for academic help.',
      icon: <FiUsers className="w-6 h-6" />,
      action: () => router.push('/dashboard/student/support'),
      label: 'Email Tutor'
    },
    {
      title: 'Admin Assistance',
      desc: 'Help with billing, account issues, or general platform support.',
      icon: <FiExternalLink className="w-6 h-6" />,
      action: () => router.push('/dashboard/student/admin-support'),
      label: 'Contact Admin'
    },
    {
      title: 'Chat with Support',
      desc: 'Live chat support available during business hours.',
      icon: <FiMessageSquare className="w-6 h-6" />,
      action: () => router.push('/chat'),
      label: 'Open Chat'
    }
  ];

  const options = user ? studentOptions : visitorOptions;

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 mb-4"
          >
            How can we help you today?
          </motion.h1>
          <p className="text-lg text-gray-600">
            {user 
              ? `Welcome back, ${user.username}! Choose how you'd like to receive support.` 
              : 'Our team is here to assist you with any questions or concerns.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {options.map((option, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {option.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{option.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {option.desc}
              </p>
              <Button 
                onClick={option.action}
                className="w-full flex items-center justify-center space-x-2"
              >
                <span>{option.label}</span>
                <FiArrowRight />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Support Info */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <FiClock />
            </div>
            <span className="text-sm font-bold text-gray-900">24/7 Support</span>
            <span className="text-xs text-gray-500">For active students</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
              <FiMail />
            </div>
            <span className="text-sm font-bold text-gray-900">Email Response</span>
            <span className="text-xs text-gray-500">Within 24 hours</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
              <FiUsers />
            </div>
            <span className="text-sm font-bold text-gray-900">Community</span>
            <span className="text-xs text-gray-500">Peer-to-peer help</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
