import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://student-management-backend-8s4c.onrender.com'
// Ensure API_ROOT always ends with a slash and includes 'api/'
const API_ROOT = API_BASE_URL.endsWith('/') 
  ? `${API_BASE_URL}api/` 
  : `${API_BASE_URL}/api/`

/**
 * Normalizes a path to be used with apiClient.
 * Removes leading slashes and ensures trailing slashes for Django compatibility.
 */
const normalizePath = (path: string) => {
  if (path.startsWith('http')) return path;
  
  // Remove leading slash and redundant 'api/'
  let cleanPath = path;
  while (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  if (cleanPath.startsWith('api/')) cleanPath = cleanPath.slice(4);
  while (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  
  // Ensure trailing slash if not present and no query params
  if (!cleanPath.endsWith('/') && !cleanPath.includes('?')) {
    cleanPath = `${cleanPath}/`;
  }
  
  return cleanPath;
}

// Helper to get consistent API URLs
const getFullApiUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${normalizePath(path)}`;
}

export const apiClient = axios.create({
  baseURL: API_ROOT,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (config.url) {
      const originalUrl = config.url;
      config.url = normalizePath(config.url);
      console.log(`API Request: ${originalUrl} -> ${config.baseURL}${config.url}`);
    }
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
      if (refreshToken) {
        try {
          // Use a fresh axios instance to avoid infinite loops with the interceptor
          const response = await axios.post(`${API_ROOT}token/refresh/`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`
          return apiClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(getFullApiUrl('/token/refresh/'), {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`
          return apiClient(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (data: { username: string; password: string }) => 
    apiClient.post('/auth/login/', data),
  register: (data: any) => 
    apiClient.post('/auth/register/', data),
  verifyEmail: (data: { token: string }) => 
    apiClient.post('/auth/verify-email/', data),
  sendLoginOtp: (data: { email: string }) => 
    apiClient.post('/auth/send-login-otp/', data),
  verifyLoginOtp: (data: { email: string; otp: string }) => 
    apiClient.post('/auth/verify-login-otp/', data),
  getProfile: () => 
    apiClient.get('/auth/profile/'),
  updateProfile: (data: any) => 
    apiClient.patch('/auth/profile/', data),
  getTutors: () =>
    apiClient.get('/auth/tutors/'),
  getStudents: () =>
    apiClient.get('/auth/students/'),
  getUsers: () =>
    apiClient.get('/auth/users/'),
  updateUser: (id: number, data: any) =>
    apiClient.patch(`/auth/users/${id}/`, data),
  deleteUser: (id: number) =>
    apiClient.delete(`/auth/users/${id}/`),
  approveTutor: (id: number) =>
    apiClient.post(`/auth/tutors/${id}/approve/`),
}

export const courseAPI = {
  getCourses: (params?: any) => 
    apiClient.get('/courses/courses/', { params }),
  getCourse: (id: number) => 
    apiClient.get(`/courses/courses/${id}/`),
  createCourse: (data: any) => 
    apiClient.post('/courses/courses/', data),
  enrollInCourse: (id: number) => 
    apiClient.post(`/courses/courses/${id}/enroll/`),
  getMyEnrollments: () => 
    apiClient.get('/courses/my-enrollments/'),
  getMyCourses: () =>
    apiClient.get('/courses/my-courses/'),
  updateProgress: (id: number, progress: number) => 
    apiClient.post(`/courses/enrollments/${id}/progress/`, { progress }),
  updateCourse: (id: number, data: any) =>
    apiClient.patch(`/courses/courses/${id}/`, data),
  deleteCourse: (id: number) =>
    apiClient.delete(`/courses/courses/${id}/`),
}

export const quizAPI = {
  getQuizzes: (params?: any) => 
    apiClient.get('/quizzes/quizzes/', { params }),
  getQuiz: (id: number) => 
    apiClient.get(`/quizzes/quizzes/${id}/`),
  createQuiz: (data: any) => 
    apiClient.post('/quizzes/quizzes/', data),
  updateQuiz: (id: number, data: any) => 
    apiClient.put(`/quizzes/quizzes/${id}/`, data),
  deleteQuiz: (id: number) => 
    apiClient.delete(`/quizzes/quizzes/${id}/`),
  startQuiz: (id: number) => 
    apiClient.post(`/quizzes/quizzes/${id}/start/`),
  submitAnswer: (attemptId: number, data: any) => 
    apiClient.post(`/quizzes/attempts/${attemptId}/submit/`, data),
  completeQuiz: (attemptId: number) => 
    apiClient.post(`/quizzes/attempts/${attemptId}/complete/`),
  getQuizResults: (id: number) => 
    apiClient.get(`/quizzes/quizzes/${id}/results/`),
  getMyAttempts: () => 
    apiClient.get('/quizzes/attempts/'),
}

export const paymentAPI = {
  createPaymentIntent: (data: any) => 
    apiClient.post('/payments/create-payment-intent/', data),
  confirmPayment: (data: any) => 
    apiClient.post('/payments/confirm/', data),
  getMyPayments: () => 
    apiClient.get('/payments/payments/'),
  requestRefund: (id: number) => 
    apiClient.post(`/payments/${id}/refund/`),
  getInstallments: () => 
    apiClient.get('/payments/installments/'),
  generateUPI: (data: any) =>
    apiClient.post('/payments/payments/upi/generate/', data),
  verifyUPI: (data: any) =>
    apiClient.post('/payments/payments/upi/verify/', data),
}

export const consultancyAPI = {
  getSessions: () =>
    apiClient.get('/consultancy/sessions/'),
  getServices: () =>
    apiClient.get('/consultancy/services/'),
  createSession: (data: any) =>
    apiClient.post('/consultancy/sessions/', data),
  getSession: (id: number) =>
    apiClient.get(`/consultancy/sessions/${id}/`),
  getSuccessStories: () =>
    apiClient.get('/consultancy/success-stories/'),
  getFaqs: () =>
    apiClient.get('/consultancy/faqs/'),
}

export const earningsAPI = {
  getStats: () =>
    apiClient.get('/earnings/earnings/stats/'),
  getEarnings: () =>
    apiClient.get('/earnings/earnings/'),
  requestPayout: (data: any) =>
    apiClient.post('/earnings/payouts/', data),
  getPayouts: () =>
    apiClient.get('/earnings/payouts/'),
}

export const chatAPI = {
  getRooms: () => 
    apiClient.get('/chat/rooms/'),
  createRoom: (data: any) => 
    apiClient.post('/chat/rooms/create/', data),
  getMessages: (roomId: number) => 
    apiClient.get(`/chat/rooms/${roomId}/messages/`),
  createSupportChat: () => 
    apiClient.post('/chat/rooms/support/'),
  sendMessage: (roomId: number, data: any) => 
    apiClient.post(`/chat/rooms/${roomId}/messages/`, data),
  startVideoCall: (roomId: number, audioOnly: boolean = false) =>
    apiClient.post(`/chat/rooms/${roomId}/video-call/start/`, { audio_only: audioOnly }),
  acceptVideoCall: (callId: number) =>
    apiClient.post(`/chat/video-calls/${callId}/accept/`),
  endVideoCall: (callId: number) =>
    apiClient.post(`/chat/video-calls/${callId}/end/`),
}

export const interviewAPI = {
  getMockInterviews: () => 
    apiClient.get('/interviews/mock-interviews/'),
  createMockInterview: (data: any) => 
    apiClient.post('/interviews/mock-interviews/', data),
  getAvailableSlots: (params?: any) => 
    apiClient.get('/interviews/slots/available/', { params }),
  bookSlot: (data: any) => 
    apiClient.post('/interviews/slots/book/', data),
  getMyBookings: () => 
    apiClient.get('/interviews/slots/my-bookings/'),
  getTutorSlots: () =>
    apiClient.get('/interviews/slots/tutor-slots/'),
  createSlots: (data: any) =>
    apiClient.post('/interviews/slots/create/', data),
}

export default apiClient
