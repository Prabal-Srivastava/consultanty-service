'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { courseAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { FiBook, FiUser, FiClock, FiStar, FiArrowLeft, FiCheck, FiPlay, FiFileText, FiVideo } from 'react-icons/fi';
import { Button, Card } from '@/components';

interface Course {
  id: number;
  title: string;
  description: string;
  tutor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
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
  materials: Array<{
    id: number;
    title: string;
    type: 'video' | 'document' | 'assignment';
    url: string;
  }>;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const fetchCourse = async () => {
    try {
      setLoadingCourse(true);
      const courseId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
      const response = await courseAPI.getCourse(courseId);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && id) {
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router, id]);

  const handleEnroll = async () => {
    if (!course) return;

    setEnrollmentLoading(true);
    setEnrollmentError(null);

    try {
      await courseAPI.enrollInCourse(course.id);
      setEnrollmentSuccess(true);
      // Refresh course data to update enrollment count
      setTimeout(fetchCourse, 1000); // Delay to allow backend to update
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to enroll in course';
      setEnrollmentError(errorMessage);
    } finally {
      setEnrollmentLoading(false);
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

  if (loadingCourse) {
    return (
      <div className="min-h-screen py-8 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen py-8 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto border border-gray-100">
              <FiBook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Course not found</h3>
              <p className="mt-2 text-gray-500">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Button 
                variant="primary" 
                size="md" 
                className="mt-4"
                onClick={() => router.push('/courses')}
              >
                <FiArrowLeft className="mr-2" />
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => router.back()}
          className="mb-6 flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Back to Courses
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Course Content */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                    <div className="flex items-center text-gray-500 mb-4">
                      <span>Taught by {course.tutor.first_name} {course.tutor.last_name}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {course.level}
                  </span>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-6">
                  <div className="flex items-center mr-6">
                    <FiUser className="mr-1" />
                    <span>{course.enrolled_count} students</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <FiClock className="mr-1" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <FiStar className="mr-1 text-yellow-400" />
                    <span>4.5 (128 reviews)</span>
                  </div>
                </div>

                <div className="prose max-w-none mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About this course</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Content</h2>
                  <div className="space-y-3">
                    {course.materials && course.materials.length > 0 ? (
                      course.materials.map((material, index) => (
                        <div 
                          key={material.id} 
                          className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            {material.type === 'video' && <FiVideo className="text-blue-600" />}
                            {material.type === 'document' && <FiFileText className="text-blue-600" />}
                            {material.type === 'assignment' && <FiPlay className="text-blue-600" />}
                          </div>
                          <div className="flex-grow">
                            <h3 className="font-medium text-gray-900">{material.title}</h3>
                            <p className="text-sm text-gray-500 capitalize">{material.type}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (material.type === 'assignment') {
                                  // Navigate to quiz page using the URL from backend which is like /quizzes/1
                                  // or construct it if backend doesn't provide it fully
                                  const quizId = material.id;
                                  router.push(`/quizzes/${quizId}`);
                                } else {
                                  window.open(material.url, '_blank');
                                }
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No course materials yet</h3>
                        <p className="mt-2 text-gray-500">The tutor hasn&apos;t added any materials to this course yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">₹{course.price}</div>
                  <div className="text-gray-500 text-sm">One-time payment</div>
                </div>

                {enrollmentSuccess ? (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-800 font-medium">Successfully enrolled!</span>
                    </div>
                    <p className="mt-2 text-sm text-green-700">
                      You&apos;ve been enrolled in this course. You can now access all course materials.
                    </p>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="w-full mb-4"
                    onClick={handleEnroll}
                    disabled={enrollmentLoading}
                  >
                    {enrollmentLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enrolling...
                      </>
                    ) : (
                      `Enroll Now`
                    )}
                  </Button>
                )}

                {enrollmentError && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <FiFileText className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-800 font-medium">Enrollment Error</span>
                    </div>
                    <p className="mt-2 text-sm text-red-700">{enrollmentError}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">This course includes:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <FiVideo className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-gray-700">Video content</span>
                    </li>
                    <li className="flex items-center">
                      <FiFileText className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-gray-700">Documents & resources</span>
                    </li>
                    <li className="flex items-center">
                      <FiPlay className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Assignments & quizzes</span>
                    </li>
                    <li className="flex items-center">
                      <FiUser className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-gray-700">Access to instructor</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="mt-6 overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">About the Instructor</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 font-medium">
                        {course.tutor.first_name.charAt(0)}{course.tutor.last_name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium text-gray-900">{course.tutor.first_name} {course.tutor.last_name}</h4>
                    <p className="text-sm text-gray-500">{course.tutor.email}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Experienced instructor with expertise in {course.subject.name}. Dedicated to helping students achieve their learning goals.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}