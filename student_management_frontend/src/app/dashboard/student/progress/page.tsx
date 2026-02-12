
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { courseAPI, interviewAPI, quizAPI } from '@/lib/api';
import { FiCalendar, FiBook, FiCheckCircle, FiClock, FiUser, FiAward } from 'react-icons/fi';
import { Card } from '@/components';

export default function MyProgressPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'student')) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [enrollmentsRes, interviewsRes, quizzesRes] = await Promise.all([
        courseAPI.getMyEnrollments(),
        interviewAPI.getMyBookings(),
        quizAPI.getMyAttempts()
      ]);
      setEnrollments(enrollmentsRes.data);
      setInterviews(interviewsRes.data);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Progress</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Progress Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiBook className="mr-2" /> Course Progress
          </h2>
          <div className="space-y-4">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{enrollment.course.title}</h3>
                      <p className="text-sm text-gray-500">Tutor: {enrollment.course.tutor.first_name} {enrollment.course.tutor.last_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${enrollment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {enrollment.is_active ? 'Active' : 'Completed'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${enrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border text-center text-gray-500">
                No active courses found.
              </div>
            )}
          </div>
        </section>

        {/* Interview Schedule Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiCalendar className="mr-2" /> Interview Schedule
          </h2>
          <div className="space-y-4">
            {interviews.length > 0 ? (
              interviews.map((interview) => (
                <Card key={interview.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{interview.title || 'Mock Interview'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      interview.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interview.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <FiClock className="mr-2" />
                      {new Date(interview.scheduled_time).toLocaleString()}
                    </div>
                    {interview.interviewer && (
                      <div className="flex items-center">
                        <FiUser className="mr-2" />
                        Interviewer: {interview.interviewer.first_name} {interview.interviewer.last_name}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border text-center text-gray-500">
                No interviews scheduled.
              </div>
            )}
          </div>
        </section>

        {/* Quiz Results Section */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiAward className="mr-2" /> Quiz Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.length > 0 ? (
              quizzes.map((attempt) => (
                <Card key={attempt.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{attempt.quiz?.title || 'Quiz'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      attempt.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {attempt.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium">
                        {attempt.obtained_marks !== null ? attempt.obtained_marks : '-'} / {attempt.quiz?.total_marks || '-'}
                      </span>
                    </div>
                    {attempt.is_completed && attempt.quiz?.total_marks > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(attempt.obtained_marks / attempt.quiz.total_marks) * 100}%` }}
                        ></div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Taken on: {new Date(attempt.start_time).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full bg-white p-6 rounded-lg shadow-sm border text-center text-gray-500">
                No quiz attempts found.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
