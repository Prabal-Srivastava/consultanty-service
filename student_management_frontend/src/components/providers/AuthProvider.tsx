'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: 'student' | 'tutor' | 'admin'
  phone: string
  is_verified: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  loginWithOtp: (email: string, otp: string) => Promise<void>
  sendOtp: (email: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  user_type: 'student' | 'tutor' | 'admin'
  phone: string
}

// Store auth context globally
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configure axios defaults
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://student-management-backend-8s4c.onrender.com'

// Helper to get consistent API URLs
const getApiUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (API_BASE_URL.startsWith('http')) {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    
    // Ensure the path ends with a slash for Django compatibility
    let finalPath = cleanPath;
    if (!finalPath.endsWith('/') && !finalPath.includes('?')) {
      finalPath = `${finalPath}/`;
    }

    if (finalPath.startsWith('api/')) {
      return `${base}${finalPath}`;
    }
    return `${base}api/${finalPath}`;
  }
  
  // Relative path (standard Next.js behavior)
  return path.startsWith('/') ? path : `/api/${path}`;
}

axios.defaults.baseURL = API_BASE_URL

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Ensure we use the full API URL if needed
  if (config.url) {
    config.url = getApiUrl(config.url);
  }
  return config
})

// Handle token refresh on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post('/token/refresh/', {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`
          return axios(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const response = await axios.get('/api/auth/profile/')
      // Handle nested user object from ProfileSerializer
      const userData = response.data.user || response.data
      setUser(userData)
    } catch (error) {
      // Token might be invalid, clear storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/auth/login/', {
        username,
        password
      })
      
      const { access, refresh, user } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Set cookie for middleware
      document.cookie = `auth_token=${access}; path=/; max-age=86400; SameSite=Lax`
      document.cookie = `user_type=${user.user_type}; path=/; max-age=86400; SameSite=Lax`
      
      setUser(user)
      toast.success('Login successful!')
      
      // Redirect based on user type
      let targetPath = '/dashboard';
      switch (user.user_type) {
        case 'student':
          targetPath = '/dashboard/student'
          break
        case 'tutor':
          targetPath = '/dashboard/tutor'
          break
        case 'admin':
          targetPath = '/dashboard/admin'
          break
      }
      
      console.log('Login successful, redirecting to:', targetPath);
      router.push(targetPath);
      // Wait for navigation to start before clearing loading
      setTimeout(() => setLoading(false), 500);
    } catch (error: any) {
      setLoading(false)
      let errorMessage = 'Login failed'
      
      if (error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === 'object' 
          ? JSON.stringify(error.response.data.error) 
          : error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const sendOtp = async (email: string) => {
    try {
      const response = await axios.post('/api/auth/send-login-otp/', {
        email
      })
      
      toast.success(response.data.message || 'OTP sent successfully!')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP'
      toast.error(errorMessage)
      throw error
    }
  }

  const loginWithOtp = async (email: string, otp: string) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/auth/verify-login-otp/', {
        email,
        otp
      })
      
      const { access, refresh, user } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Set cookie for middleware
      document.cookie = `auth_token=${access}; path=/; max-age=86400; SameSite=Lax`
      document.cookie = `user_type=${user.user_type}; path=/; max-age=86400; SameSite=Lax`
      
      setUser(user)
      toast.success(response.data.message || 'Login successful!')
      
      // Redirect based on user type
      switch (user.user_type) {
        case 'student':
          router.push('/dashboard/student')
          break
        case 'tutor':
          router.push('/dashboard/tutor')
          break
        case 'admin':
          router.push('/dashboard/admin')
          break
        default:
          router.push('/dashboard')
      }
    } catch (error: any) {
      // Extract error message safely
      let errorMessage = 'Login failed. Please check your credentials.'
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else if (typeof error.response.data === 'object') {
          errorMessage = JSON.stringify(error.response.data)
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

 const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/auth/register/', userData)
      // Store email in localStorage for verification purposes
      localStorage.setItem('verificationEmail', userData.email)
      toast.success('Registration successful! Please check your email for verification.')
      router.push('/login')
    } catch (error: any) {
      const errors = error.response?.data || {}
      Object.keys(errors).forEach(key => {
        toast.error(`${key}: ${errors[key][0]}`)
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    loginWithOtp,
    sendOtp,
    register,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for authentication
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
