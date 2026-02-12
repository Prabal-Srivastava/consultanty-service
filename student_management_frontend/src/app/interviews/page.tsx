'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { interviewAPI, authAPI, courseAPI } from '@/lib/api';
import { FiCalendar, FiClock, FiUser, FiBook, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { Button, Card, Modal } from '@/components';
import toast from 'react-hot-toast';

interface Tutor {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
}

interface Slot {
  id: number;
  interviewer: Tutor;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Course {
  id: number;
  title: string;
  subject: string;
}

interface Booking {
  id: number;
  slot: Slot;
  course: Course;
  booking_date: string;
  is_confirmed: boolean;
}

export default function InterviewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings'>('book');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (user && user.user_type === 'student') {
      fetchTutors();
      fetchEnrolledCourses();
      if (activeTab === 'my-bookings') {
        fetchBookings();
      } else {
        fetchSlots();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router, activeTab]);

  useEffect(() => {
    if (activeTab === 'book' && user) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedTutor]);

  const fetchTutors = async () => {
    try {
      const res = await authAPI.getTutors();
      setTutors(res.data);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const res = await courseAPI.getMyEnrollments();
      // Extract courses from enrollments
      const courses = res.data.map((enrollment: any) => enrollment.course);
      setEnrolledCourses(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);
      const params: any = { date: selectedDate };
      if (selectedTutor) params.interviewer = selectedTutor;
      
      const res = await interviewAPI.getAvailableSlots(params);
      setSlots(res.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await interviewAPI.getMyBookings();
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot || !selectedCourse) {
      toast.error('Please select a course');
      return;
    }

    try {
      setBookingLoading(true);
      await interviewAPI.bookSlot({
        slot_id: selectedSlot.id,
        course_id: selectedCourse
      });
      
      toast.success('Interview booked successfully!');
      setIsBookingModalOpen(false);
      setSelectedSlot(null);
      setSelectedCourse('');
      fetchSlots(); // Refresh slots
    } catch (error: any) {
      console.error('Error booking slot:', error);
      toast.error(error.response?.data?.error || 'Failed to book interview');
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModal = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
    // Default to first course if available
    if (enrolledCourses.length > 0) {
      setSelectedCourse(enrolledCourses[0].id.toString());
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-md ${activeTab === 'book' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Book Interview
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-2 rounded-md ${activeTab === 'my-bookings' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            My Schedule
          </button>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border min-w-[200px]"
              >
                <option value="">All Tutors</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.first_name} {tutor.last_name}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={fetchSlots}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <FiRefreshCw className={`mr-2 ${loadingSlots ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Slots Grid */}
          {loadingSlots ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading available slots...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No slots available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try selecting a different date or tutor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <FiUser />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {slot.interviewer.first_name} {slot.interviewer.last_name}
                        </p>
                        <p className="text-xs text-gray-500">Tutor</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiCalendar className="mr-2" />
                      {slot.date}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiClock className="mr-2" />
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>

                  <Button
                    onClick={() => openBookingModal(slot)}
                    className="w-full"
                  >
                    Book Slot
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <FiBook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled interviews</h3>
              <p className="mt-1 text-sm text-gray-500">
                Book an interview to get started.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <li key={booking.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              <FiCheck />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {booking.course.title}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <FiUser className="mr-1.5 h-4 w-4" />
                              With {booking.slot.interviewer.first_name} {booking.slot.interviewer.last_name}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.slot.date}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.slot.start_time} - {booking.slot.end_time}
                          </p>
                          <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.is_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.is_confirmed ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Confirm Booking"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are booking an interview slot with <span className="font-semibold">{selectedSlot?.interviewer.first_name} {selectedSlot?.interviewer.last_name}</span> on <span className="font-semibold">{selectedSlot?.date}</span> at <span className="font-semibold">{selectedSlot?.start_time}</span>.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            {enrolledCourses.length > 0 ? (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              >
                {enrolledCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-red-600">
                You are not enrolled in any courses. Please enroll in a course first.
              </p>
            )}
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <Button
              onClick={handleBookSlot}
              disabled={bookingLoading || enrolledCourses.length === 0}
              className="w-full sm:col-start-2"
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
