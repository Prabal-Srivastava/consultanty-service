'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizAPI } from '@/lib/api';
import { Button, Card } from '@/components';
import { FiCheckCircle, FiXCircle, FiAward, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QuizResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const quizId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
        const res = await quizAPI.getQuizResults(quizId);
        setResults(res.data);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResults();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900">No results found</h3>
          <Button className="mt-4" onClick={() => router.push(`/quizzes/${id}`)}>Go to Quiz</Button>
        </div>
      </div>
    );
  }

  // Get the latest attempt (assuming the API returns sorted or we just take the last one)
  // Actually the API returns all attempts. Let's take the latest one (by end_time or id).
  const latestAttempt = results.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0];
  const percentage = parseFloat(latestAttempt.percentage);
  
  // Determine pass/fail (e.g., 50%)
  const isPassed = percentage >= 50;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Score Card */}
        <Card className="mb-8 overflow-hidden">
          <div className={`px-6 py-8 text-white text-center ${isPassed ? 'bg-green-600' : 'bg-red-500'}`}>
            <FiAward className="mx-auto h-16 w-16 mb-4 opacity-90" />
            <h1 className="text-4xl font-bold mb-2">{percentage.toFixed(1)}%</h1>
            <p className="text-lg opacity-90">
              You scored {latestAttempt.obtained_marks} out of {latestAttempt.total_marks}
            </p>
            <p className="mt-4 font-medium text-xl">
              {isPassed ? 'Congratulations! You Passed!' : 'Keep Practicing!'}
            </p>
          </div>
          
          <div className="px-6 py-6 bg-white flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push(`/courses/${latestAttempt.quiz.course}`)}>
              <FiArrowLeft className="mr-2" /> Back to Course
            </Button>
            <Button variant="primary" onClick={() => router.push(`/quizzes/${id}`)}>
              <FiRefreshCw className="mr-2" /> Retake Quiz
            </Button>
          </div>
        </Card>

        {/* Question Review */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Answers</h2>
        <div className="space-y-6">
          {latestAttempt.quiz.questions.map((question: any, index: number) => {
            // Find user's answer for this question
            const userAnswer = latestAttempt.answers.find((a: any) => a.question === question.id);
            const isCorrect = userAnswer?.is_correct;
            
            return (
              <Card key={question.id} className={`overflow-hidden border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600 mr-3">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-medium text-gray-900 mt-1">{question.text}</h3>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {isCorrect ? (
                        <div className="flex items-center text-green-600 font-medium">
                          <FiCheckCircle className="mr-1.5" /> Correct
                          <span className="ml-2 text-sm bg-green-100 px-2 py-0.5 rounded">
                            +{userAnswer?.marks_obtained || question.marks} marks
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500 font-medium">
                          <FiXCircle className="mr-1.5" /> Incorrect
                          <span className="ml-2 text-sm bg-red-100 px-2 py-0.5 rounded">
                            0 / {question.marks} marks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pl-11 space-y-3">
                    {question.choices.map((choice: any) => {
                      const isSelected = userAnswer?.choice === choice.id;
                      const isCorrectChoice = choice.is_correct;
                      
                      let choiceClass = "p-3 rounded-lg border flex items-center justify-between ";
                      
                      if (isCorrectChoice) {
                        choiceClass += "bg-green-50 border-green-200 text-green-800";
                      } else if (isSelected && !isCorrectChoice) {
                        choiceClass += "bg-red-50 border-red-200 text-red-800";
                      } else {
                        choiceClass += "bg-white border-gray-200 text-gray-700";
                      }

                      return (
                        <div key={choice.id} className={choiceClass}>
                          <span className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                              isSelected || isCorrectChoice ? 'border-current' : 'border-gray-400'
                            }`}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                            </div>
                            {choice.text}
                          </span>
                          {isCorrectChoice && <span className="text-xs font-semibold uppercase tracking-wider">Correct Answer</span>}
                          {isSelected && !isCorrectChoice && <span className="text-xs font-semibold uppercase tracking-wider">Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
