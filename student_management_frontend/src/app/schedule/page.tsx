'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { interviewAPI } from '@/lib/api';
import { FiCalendar, FiClock, FiPlus, FiTrash2, FiArrowLeft, FiCheck, FiInfo } from 'react-icons/fi';
import { Button, Card, Modal, Input } from '@/components';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Slot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function TutorSchedule() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    duration: 60
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'tutor')) {
      router.push('/');
    } else if (user) {
      fetchSlots();
    }
  }, [user, loading, router]);

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await interviewAPI.getTutorSlots();
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await interviewAPI.createSlots(newSlot);
      toast.success('Interview slots created successfully');
      setIsCreateModalOpen(false);
      fetchSlots();
    } catch (error) {
      console.error('Error creating slots:', error);
      toast.error('Failed to create slots');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading || loadingSlots) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const groupedSlots = slots.reduce((acc: any, slot) => {
    const date = slot.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/tutor" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Schedule</h1>
              <p className="text-gray-600 mt-1">Manage your availability for mock interviews</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <FiPlus className="mr-2" />
            Create Slots
          </Button>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No interview slots created yet</p>
            <p className="text-gray-400">Click the button above to set your availability</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiCalendar className="mr-2 text-primary-500" />
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedSlots[date].map((slot: Slot) => (
                    <Card key={slot.id} className={`${
                      slot.status === 'booked' ? 'border-primary-200 bg-primary-50' : 'border-gray-200'
                    }`}>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center text-gray-900 font-semibold">
                            <FiClock className="mr-2 text-primary-500" />
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </div>
                          {slot.status === 'booked' ? (
                            <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Booked
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                              Available
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {slot.status === 'booked' ? (
                            <div className="flex items-center text-primary-700">
                              <FiCheck className="mr-1" />
                              Student assigned
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <FiInfo className="mr-1" />
                              Waiting for booking
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Interview Slots"
      >
        <form onSubmit={handleCreateSlots} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <Input
              type="date"
              value={newSlot.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <Input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <Input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
            <select
              value={newSlot.duration}
              onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
            </select>
          </div>
          <div className="pt-4 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" type="submit" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Slots'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
