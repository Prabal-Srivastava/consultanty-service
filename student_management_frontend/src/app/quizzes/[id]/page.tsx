'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizAPI } from '@/lib/api';
import { Button, Card } from '@/components';
import { FiClock, FiAward, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QuizDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
        const res = await quizAPI.getQuiz(quizId);
        setQuiz(res.data);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const handleStartQuiz = async () => {
    const quizId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
    setStarting(true);
    try {
      // Backend creates an attempt and returns it
      const res = await quizAPI.startQuiz(quizId);
      
      // If successful, redirect to the taking page
      // Ideally pass the attempt ID if needed, but the taking page can also fetch the active attempt
      // For now, let's assume we just navigate to /take and it handles the active attempt
      router.push(`/quizzes/${quizId}/take`);
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      if (error.response?.data?.message?.includes('already have an active')) {
         // If already active, just go to take page
         router.push(`/quizzes/${quizId}/take`);
      } else {
        toast.error(error.response?.data?.error || 'Failed to start quiz');
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-xl font-medium text-gray-900">Quiz not found</h3>
          <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <div className="bg-primary-600 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <p className="mt-2 text-primary-100">{quiz.course_title}</p>
          </div>
          
          <div className="px-6 py-8">
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <p className="text-gray-600">{quiz.description || 'No description available.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <FiClock className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">{quiz.duration} mins</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <FiAward className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-semibold text-gray-900">{quiz.total_marks}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                <FiCheckCircle className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-semibold text-gray-900">{quiz.questions?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleStartQuiz} 
                disabled={starting}
                className="w-full sm:w-auto px-12"
              >
                {starting ? 'Starting...' : 'Start Quiz'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
