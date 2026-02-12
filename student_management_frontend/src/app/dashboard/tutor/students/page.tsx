'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { authAPI, chatAPI } from '@/lib/api';
import { FiUsers, FiMessageSquare, FiSearch, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: {
    bio: string;
    avatar: string;
  };
}

export default function TutorStudents() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'tutor')) {
      router.push('/');
    } else if (user) {
      fetchStudents();
    }
  }, [user, loading, router]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await authAPI.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleMessageStudent = async (studentId: number) => {
    try {
      const response = await chatAPI.createRoom({
        name: `Chat with Student`,
        room_type: 'one_on_one',
        participant_ids: [studentId]
      });
      router.push(`/chat?room=${response.data.id}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast.error('Failed to start chat');
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/tutor" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
              <p className="text-gray-600 mt-1">View and interact with students enrolled in your courses</p>
            </div>
          </div>
        </div>

        <Card className="mb-8">
          <div className="p-4 relative">
            <FiSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search students by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
                    <p className="text-sm text-gray-500">@{student.username}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiUsers className="mr-2" />
                    <span>Enrolled in 2 courses</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiCalendar className="mr-2" />
                    <span>Last active: 2 days ago</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="primary" 
                    className="flex-1"
                    onClick={() => handleMessageStudent(student.id)}
                  >
                    <FiMessageSquare className="mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    View Progress
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <FiUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No students found</p>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
