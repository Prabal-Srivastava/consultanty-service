'use client';

import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiVideo, FiMessageCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import { Button, Modal } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { authAPI, consultancyAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Tutor {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

export default function MentorshipPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isModalOpen && tutors.length === 0) {
      const fetchTutors = async () => {
        try {
          const res = await authAPI.getTutors();
          setTutors(res.data);
        } catch (error) {
          console.error('Error fetching tutors:', error);
        }
      };
      fetchTutors();
    }
  }, [isModalOpen, tutors.length]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutor || !problemStatement || !date || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await consultancyAPI.createSession({
        consultant: selectedTutor,
        problem_statement: problemStatement,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      toast.success('Mentorship session requested successfully!');
      setIsModalOpen(false);
      setProblemStatement('');
      setSelectedTutor('');
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error('Failed to book session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 mb-4"
          >
            One-on-One Mentorship
          </motion.h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get direct guidance from industry experts to accelerate your career transformation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Expert Guidance",
              desc: "Direct access to mentors from IBM, Google, and other top tech companies.",
              icon: <FiUsers className="w-8 h-8" />,
              color: "blue"
            },
            {
              title: "Flexible Scheduling",
              desc: "Book sessions that fit your schedule, including weekends and evenings.",
              icon: <FiCalendar className="w-8 h-8" />,
              color: "green"
            },
            {
              title: "Mock Interviews",
              desc: "Real-world interview practice with detailed feedback and improvement plans.",
              icon: <FiVideo className="w-8 h-8" />,
              color: "purple"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className={`w-14 h-14 ${feature.color === 'blue' ? 'bg-blue-100 text-blue-600' : feature.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'} rounded-xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 p-12 bg-blue-600 text-white flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-6">Ready to start?</h2>
              <p className="text-blue-100 mb-8 text-lg">
                Your journey to professional excellence starts with a single session. 
                Connect with Arpit Srivastava or other senior mentors today.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FiMessageCircle className="w-5 h-5 text-blue-200" />
                  <span>Resume Reviews & Career Strategy</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMessageCircle className="w-5 h-5 text-blue-200" />
                  <span>Technical & Behavioral Interview Prep</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiMessageCircle className="w-5 h-5 text-blue-200" />
                  <span>Project & Portfolio Guidance</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h3>
              <p className="text-gray-600 mb-8">
                As a registered student, you have access to exclusive mentorship slots. 
                Check the availability and book your next career-defining conversation.
              </p>
              {user ? (
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 text-lg flex items-center justify-center space-x-2"
                >
                  <span>Book Now</span>
                  <FiArrowRight />
                </Button>
              ) : (
                <Button 
                  onClick={() => { window.location.href = '/login' }}
                  className="w-full py-4 text-lg flex items-center justify-center space-x-2"
                >
                  <span>Login to Book</span>
                  <FiArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Book Mentorship Session"
        >
          <form onSubmit={handleBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Mentor</label>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                required
              >
                <option value="">Choose a mentor...</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.first_name} {tutor.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What would you like to discuss?</label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 h-32"
                placeholder="Briefly describe your goals or questions..."
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-4 text-lg font-bold"
            >
              {submitting ? 'Requesting...' : 'Confirm Request'}
            </Button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
