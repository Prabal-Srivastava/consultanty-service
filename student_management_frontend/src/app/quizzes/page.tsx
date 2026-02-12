'use client';

import { useState, useEffect } from 'react';
import { quizAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { FiBook, FiClock, FiAward, FiSearch, FiFilter, FiPlus, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Button, Card, Input } from '@/components';
import Link from 'next/link';

interface Quiz {
  id: number;
  title: string;
  description: string;
  course_title: string;
  total_marks: number;
  duration: number;
  questions_count: number;
  created_at: string;
}

export default function QuizzesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchQuizzes();
    }
  }, [user, loading, router]);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const response = await quizAPI.getQuizzes();
      setQuizzes(response.data);
      setFilteredQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    let result = quizzes;
    
    if (searchTerm) {
      result = result.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredQuizzes(result);
  }, [searchTerm, quizzes]);

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
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
            <p className="text-gray-600">
              Test your knowledge and track your progress.
            </p>
          </div>
          {user.user_type === 'tutor' && (
            <Link href="/quizzes/create">
              <Button variant="primary" size="md" className="flex items-center">
                <FiPlus className="mr-2" />
                Add Quiz
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Quizzes</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        {loadingQuizzes ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto border border-gray-100">
              <FiAward className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No quizzes found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm ? 'Try adjusting your search.' : 'There are currently no quizzes available.'}
              </p>
              {user.user_type === 'tutor' && (
                 <Link href="/quizzes/create" className="mt-4 inline-block">
                    <Button variant="primary" size="sm">Create First Quiz</Button>
                 </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{quiz.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {quiz.total_marks} Marks
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {quiz.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                    <div className="flex items-center">
                      <FiClock className="mr-1" />
                      <span>{quiz.duration} mins</span>
                    </div>
                    {quiz.course_title && (
                      <div className="flex items-center">
                        <FiBook className="mr-1" />
                        <span className="truncate max-w-[100px]">{quiz.course_title}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Link href={`/quizzes/${quiz.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex items-center"
                        >
                          Start Quiz <FiArrowRight className="ml-1" />
                        </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
