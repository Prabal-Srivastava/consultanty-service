'use client';

import { useState, useEffect } from 'react';
import { courseAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FiBook, FiUser, FiClock, FiStar, FiArrowRight, FiSearch, FiFilter, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';

interface Course {
  id: number;
  title: string;
  description: string;
  tutor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  subject: {
    id: number;
    name: string;
  };
  price: number;
  duration: string;
  level: string;
  is_active: boolean;
  created_at: string;
  enrolled_count: number;
}

export default function CoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [enrollmentStatus, setEnrollmentStatus] = useState<{[key: number]: {loading: boolean, success: boolean, error: string | null}}>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchCourses();
    }
  }, [user, loading, router]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await courseAPI.getCourses();
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    // Filter courses based on search term and subject
    let result = courses;
    
    if (searchTerm) {
      result = result.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSubject !== 'all') {
      result = result.filter(course => 
        course.subject.name.toLowerCase() === selectedSubject.toLowerCase()
      );
    }
    
    setFilteredCourses(result);
  }, [searchTerm, selectedSubject, courses]);

  const handleEnroll = async (courseId: number) => {
    setEnrollmentStatus(prev => ({
      ...prev,
      [courseId]: { loading: true, success: false, error: null }
    }));

    try {
      await courseAPI.enrollInCourse(courseId);
      setEnrollmentStatus(prev => ({
        ...prev,
        [courseId]: { loading: false, success: true, error: null }
      }));
      
      // Refresh the courses to update enrollment counts
      fetchCourses();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to enroll in course';
      setEnrollmentStatus(prev => ({
        ...prev,
        [courseId]: { loading: false, success: false, error: errorMessage }
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Courses</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of courses designed to enhance your skills and knowledge. 
            Enroll today to start your learning journey!
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Business">Business</option>
                <option value="Language">Language</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="primary" 
                size="md" 
                className="w-full"
                onClick={fetchCourses}
              >
                <FiFilter className="mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto border border-gray-100">
              <FiBook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || selectedSubject !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'There are currently no courses available.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const status = enrollmentStatus[course.id] || { loading: false, success: false, error: null };
              
              return (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">by {course.tutor.first_name} {course.tutor.last_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <div className="flex items-center mr-4">
                        <FiUser className="mr-1" />
                        <span>{course.enrolled_count} students</span>
                      </div>
                      <div className="flex items-center mr-4">
                        <FiClock className="mr-1" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <FiStar className="mr-1 text-yellow-400" />
                        <span>4.5</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">₹{course.price}</span>
                        <span className="text-sm text-gray-500 ml-1">per course</span>
                      </div>
                      
                      <Button
                        variant={status.success ? 'success' : 'primary'}
                        size="sm"
                        disabled={status.loading}
                        onClick={() => handleEnroll(course.id)}
                        className="flex items-center"
                      >
                        {status.loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enrolling...
                          </>
                        ) : status.success ? (
                          <>
                            <FiCheckCircle className="mr-1" /> Enrolled
                          </>
                        ) : (
                          <>
                            Enroll <FiArrowRight className="ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {status.error && (
                      <div className="mt-3 text-sm text-red-600 flex items-center">
                        <FiXCircle className="mr-1" />
                        {status.error}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}