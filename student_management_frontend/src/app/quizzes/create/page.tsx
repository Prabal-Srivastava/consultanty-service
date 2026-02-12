'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { courseAPI, quizAPI } from '@/lib/api';
import { Button, Card, Input } from '@/components';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Choice {
  text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  marks: number;
  order: number;
  choices_data: Choice[];
}

interface Course {
  id: number;
  title: string;
}

export default function CreateQuizPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    duration: 30,
    is_active: true,
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      question_type: 'multiple_choice',
      marks: 1,
      order: 1,
      choices_data: [
        { text: '', is_correct: true, order: 1 },
        { text: '', is_correct: false, order: 2 },
      ],
    },
  ]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      // Fetch courses taught by this tutor
      const response = await courseAPI.getCourses({ tutor: user?.id });
      setCourses(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, course: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'tutor')) {
      router.push('/quizzes');
      toast.error('Only tutors can create quizzes');
    } else if (user) {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    
    // Reset choices if type changes
    if (field === 'question_type') {
        if (value === 'true_false') {
            newQuestions[index].choices_data = [
                { text: 'True', is_correct: true, order: 1 },
                { text: 'False', is_correct: false, order: 2 }
            ];
        } else if (value === 'short_answer') {
            newQuestions[index].choices_data = [];
        } else if (value === 'multiple_choice' && newQuestions[index].choices_data.length === 0) {
            newQuestions[index].choices_data = [
                { text: '', is_correct: true, order: 1 },
                { text: '', is_correct: false, order: 2 }
            ];
        }
    }
    
    setQuestions(newQuestions);
  };

  const handleChoiceChange = (qIndex: number, cIndex: number, field: keyof Choice, value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices_data[cIndex] = { 
        ...newQuestions[qIndex].choices_data[cIndex], 
        [field]: value 
    };
    
    // Ensure only one correct answer for True/False (though logic handles it by radio usually)
    // For MCQ, we might allow multiple correct? Backend usually supports it but let's stick to single correct for simplicity or checkbox for multiple.
    // The backend model has is_correct on Choice, so multiple can be correct.
    
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        question_type: 'multiple_choice',
        marks: 1,
        order: questions.length + 1,
        choices_data: [
          { text: '', is_correct: true, order: 1 },
          { text: '', is_correct: false, order: 2 },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder
    newQuestions.forEach((q, i) => q.order = i + 1);
    setQuestions(newQuestions);
  };

  const addChoice = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices_data.push({
      text: '',
      is_correct: false,
      order: newQuestions[qIndex].choices_data.length + 1,
    });
    setQuestions(newQuestions);
  };

  const removeChoice = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices_data = newQuestions[qIndex].choices_data.filter((_, i) => i !== cIndex);
    newQuestions[qIndex].choices_data.forEach((c, i) => c.order = i + 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course) {
      toast.error('Please select a course');
      return;
    }

    // Validation
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
            toast.error(`Question ${i + 1} text is required`);
            return;
        }
        if (q.question_type === 'multiple_choice') {
            if (q.choices_data.length < 2) {
                toast.error(`Question ${i + 1} must have at least 2 choices`);
                return;
            }
            if (!q.choices_data.some(c => c.is_correct)) {
                toast.error(`Question ${i + 1} must have at least one correct answer`);
                return;
            }
            if (q.choices_data.some(c => !c.text.trim())) {
                toast.error(`All choices in Question ${i + 1} must have text`);
                return;
            }
        }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        course: parseInt(formData.course),
        questions_data: questions,
      };

      await quizAPI.createQuiz(payload);
      toast.success('Quiz created successfully!');
      router.push('/quizzes');
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Button variant="secondary" size="sm" onClick={() => router.back()} className="mr-4">
            <FiArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Quiz Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Introduction to Python Final Quiz"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe what this quiz covers..."
                    />
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                  <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                    <FiPlus className="mr-2" /> Add Question
                  </Button>
                </div>

                {questions.map((question, qIndex) => (
                  <Card key={qIndex} className="overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-medium text-gray-700">Question {qIndex + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={question.question_type}
                            onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                          <Input
                            type="number"
                            min="1"
                            value={question.marks.toString()}
                            onChange={(e) => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                        <textarea
                          rows={2}
                          value={question.text}
                          onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your question here..."
                          required
                        />
                      </div>

                      {question.question_type === 'multiple_choice' && (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Choices</label>
                          {question.choices_data.map((choice, cIndex) => (
                            <div key={cIndex} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={choice.is_correct}
                                onChange={(e) => handleChoiceChange(qIndex, cIndex, 'is_correct', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <Input
                                value={choice.text}
                                onChange={(e) => handleChoiceChange(qIndex, cIndex, 'text', e.target.value)}
                                placeholder={`Option ${cIndex + 1}`}
                                className="flex-1"
                              />
                              {question.choices_data.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeChoice(qIndex, cIndex)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <FiX />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(qIndex)}>
                            <FiPlus className="mr-1" /> Add Option
                          </Button>
                        </div>
                      )}
                      
                      {question.question_type === 'true_false' && (
                         <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                            <div className="flex space-x-4">
                                {question.choices_data.map((choice, cIndex) => (
                                    <label key={cIndex} className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name={`q_${qIndex}_tf`}
                                            checked={choice.is_correct}
                                            onChange={() => {
                                                // Set this one to true, other to false
                                                const newQuestions = [...questions];
                                                newQuestions[qIndex].choices_data.forEach((c, idx) => {
                                                    c.is_correct = idx === cIndex;
                                                });
                                                setQuestions(newQuestions);
                                            }}
                                            className="form-radio h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2">{choice.text}</span>
                                    </label>
                                ))}
                            </div>
                         </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                    {courses.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">You haven&apos;t created any courses yet.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <Input
                      type="number"
                      name="duration"
                      min="1"
                      value={formData.duration.toString()}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active (Visible to students)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center"
                      disabled={submitting}
                    >
                      {submitting ? 'Creating...' : 'Create Quiz'}
                    </Button>
                  </div>
                </div>
              </Card>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Give clear and concise questions.</li>
                    <li>Ensure every MCQ has a correct answer.</li>
                    <li>Set appropriate time duration.</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
