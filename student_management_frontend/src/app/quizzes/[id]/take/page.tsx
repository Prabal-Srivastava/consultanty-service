'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizAPI } from '@/lib/api';
import { Button, Card } from '@/components';
import { FiClock, FiCheck, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TakeQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> choiceId
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize quiz attempt
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const quizId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
        // We call startQuiz to ensure we have an active attempt or get the existing one
        const res = await quizAPI.startQuiz(quizId);
        
        // If the attempt is already completed, redirect to results
        if (res.data.is_completed || res.data.attempt?.is_completed) {
          const attemptId = res.data.id || res.data.attempt?.id;
          router.replace(`/quizzes/${quizId}/results`);
          return;
        }

        const attemptData = res.data.attempt || res.data;
        setAttempt(attemptData);
        
        // Restore answers from existing attempt if any
        if (attemptData.answers) {
          const existingAnswers: Record<number, number> = {};
          attemptData.answers.forEach((ans: any) => {
            if (ans.choice) {
              existingAnswers[ans.question] = ans.choice;
            }
          });
          setAnswers(existingAnswers);
        }

        // Calculate time left
        if (attemptData.quiz.duration) {
          const startTime = new Date(attemptData.start_time).getTime();
          const endTime = startTime + (attemptData.quiz.duration * 60 * 1000);
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error('Error initializing quiz:', error);
        toast.error('Failed to start quiz');
        router.push(`/quizzes/${id}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      initQuiz();
    }
  }, [id, router]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitting && attempt) {
      handleFinishQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleAnswerSelect = async (questionId: number, choiceId: number) => {
    // Optimistic update
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));

    try {
      await quizAPI.submitAnswer(attempt.id, {
        question_id: questionId,
        choice_id: choiceId
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const handleFinishQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    
    try {
      await quizAPI.completeQuiz(attempt.id);
      toast.success('Quiz completed successfully!');
      router.replace(`/quizzes/${id}/results`);
    } catch (error) {
      console.error('Error completing quiz:', error);
      toast.error('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!attempt) return null;

  const currentQuestion = attempt.quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === attempt.quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-md">{attempt.quiz.title}</h1>
          <div className="flex items-center space-x-4">
            {timeLeft !== null && (
              <div className={`flex items-center font-mono font-medium ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
                <FiClock className="mr-2" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button 
              size="sm" 
              variant="primary" 
              onClick={handleFinishQuiz}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Finish Quiz'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card className="min-h-[400px] flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-sm font-medium text-gray-500">
                    Question {currentQuestionIndex + 1} of {attempt.quiz.questions.length}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {currentQuestion.marks} marks
                  </span>
                </div>
                
                <h2 className="text-xl font-medium text-gray-900 mb-8">
                  {currentQuestion.text}
                </h2>

                <div className="space-y-4">
                  {currentQuestion.choices.map((choice: any) => (
                    <div 
                      key={choice.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[currentQuestion.id] === choice.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          answers[currentQuestion.id] === choice.id
                            ? 'border-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion.id] === choice.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <span className={answers[currentQuestion.id] === choice.id ? 'text-primary-900 font-medium' : 'text-gray-700'}>
                          {choice.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <FiChevronLeft className="mr-1" /> Previous
                </Button>
                
                {isLastQuestion ? (
                  <Button
                    variant="primary"
                    onClick={handleFinishQuiz}
                    disabled={submitting}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(attempt.quiz.questions.length - 1, prev + 1))}
                  >
                    Next <FiChevronRight className="ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                  {attempt.quiz.questions.map((q: any, idx: number) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                        currentQuestionIndex === idx
                          ? 'bg-primary-600 text-white'
                          : answers[q.id]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
