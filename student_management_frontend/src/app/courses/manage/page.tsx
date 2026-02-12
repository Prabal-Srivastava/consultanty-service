'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { courseAPI, authAPI } from '@/lib/api';
import { FiBook, FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch, FiArrowLeft, FiClock, FiDollarSign } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration_weeks: number;
  subject_details: {
    name: string;
  };
  is_active: boolean;
  enrollment_count: number;
}

export default function ManageCourses() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'tutor')) {
      router.push('/');
    } else if (user) {
      fetchMyCourses();
    }
  }, [user, loading, router]);

  const fetchMyCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await courseAPI.getMyCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await courseAPI.deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject_details?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingCourses) {
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-gray-600 mt-1">Create, update, and manage your teaching curriculum</p>
            </div>
          </div>
          <Link href="/courses/create">
            <Button variant="primary">
              <FiPlus className="mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>

        <Card className="mb-8">
          <div className="p-4 relative">
            <FiSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded uppercase tracking-wider">
                      {course.subject_details?.name || 'General'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-2">{course.title}</h3>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    course.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {course.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                
                <p className="text-gray-600 line-clamp-2 mb-6">{course.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <FiBook className="mx-auto text-primary-500 mb-1" />
                    <p className="text-xs text-gray-500 uppercase">Students</p>
                    <p className="font-bold text-gray-900">{course.enrollment_count || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <FiClock className="mx-auto text-primary-500 mb-1" />
                    <p className="text-xs text-gray-500 uppercase">Duration</p>
                    <p className="font-bold text-gray-900">{course.duration_weeks} Weeks</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <FiDollarSign className="mx-auto text-primary-500 mb-1" />
                    <p className="text-xs text-gray-500 uppercase">Price</p>
                    <p className="font-bold text-gray-900">${course.price}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <FiEye className="mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1">
                    <FiEdit2 className="mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:bg-red-50 border-red-100"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <FiBook className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">You haven&apos;t created any courses yet</p>
            <Link href="/courses/create" className="text-primary-600 font-bold hover:underline mt-2 inline-block">
              Create your first course now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
