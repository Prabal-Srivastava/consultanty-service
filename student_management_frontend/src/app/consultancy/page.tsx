'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { consultancyAPI, authAPI } from '@/lib/api';
import { FiCalendar, FiClock, FiUser, FiFileText, FiVideo } from 'react-icons/fi';
import { Button, Modal, Card } from '@/components';
import toast from 'react-hot-toast';

export default function ConsultancyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'consultants' | 'sessions'>('consultants');
  const [tutors, setTutors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Booking Modal State
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    problem_statement: '',
    date: '',
    start_time: '',
    end_time: ''
  });

  const fetchData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'consultants') {
        const res = await authAPI.getTutors();
        setTutors(res.data);
      } else {
        const res = await consultancyAPI.getSessions();
        setSessions(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router, activeTab]);

  const handleBookClick = (tutor: any) => {
    setSelectedTutor(tutor);
    setIsBookingModalOpen(true);
    // Reset form
    setBookingData({
      problem_statement: '',
      date: '',
      start_time: '',
      end_time: ''
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.date || !bookingData.start_time || !bookingData.end_time || !bookingData.problem_statement) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await consultancyAPI.createSession({
        consultant_id: selectedTutor.id,
        ...bookingData
      });
      toast.success('Session booked successfully!');
      setIsBookingModalOpen(false);
      setActiveTab('sessions'); // Switch to sessions tab to show the new booking
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error || 'Failed to book session');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Consultancy Services</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === 'consultants'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('consultants')}
        >
          Find a Consultant
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === 'sessions'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sessions')}
        >
          My Sessions
        </button>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {activeTab === 'consultants' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white rounded-lg shadow p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl mr-4">
                      {tutor.first_name?.[0] || tutor.username?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tutor.first_name} {tutor.last_name}</h3>
                      <p className="text-gray-500 text-sm">@{tutor.username}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm mb-4">
                      Expert in software development and career guidance.
                    </p>
                    <Button 
                      fullWidth 
                      onClick={() => handleBookClick(tutor)}
                    >
                      Book Session
                    </Button>
                  </div>
                </div>
              ))}
              {tutors.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No consultants found.
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li key={session.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FiVideo className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            {user?.user_type === 'student' 
                              ? `Session with ${session.consultant_name || 'Consultant'}`
                              : `Session with ${session.student_name || 'Student'}`
                            }
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FiCalendar className="mr-1.5 h-4 w-4" />
                            {session.date}
                            <FiClock className="ml-4 mr-1.5 h-4 w-4" />
                            {session.start_time} - {session.end_time}
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {session.problem_statement}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                          session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        {session.status === 'pending' && (
                           <button className="mt-2 text-primary-600 text-sm hover:underline">
                             Pay Now
                           </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
                {sessions.length === 0 && (
                  <li className="p-12 text-center text-gray-500">
                    No sessions found.
                  </li>
                )}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Book Session with ${selectedTutor?.first_name || 'Consultant'}`}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Problem Statement</label>
            <textarea
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              value={bookingData.problem_statement}
              onChange={(e) => setBookingData({...bookingData, problem_statement: e.target.value})}
              placeholder="Describe what you need help with..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                value={bookingData.start_time}
                onChange={(e) => setBookingData({...bookingData, start_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              value={bookingData.end_time}
              onChange={(e) => setBookingData({...bookingData, end_time: e.target.value})}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
