'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
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
      const response = await apiClient.get('auth/profile/')
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
      const response = await apiClient.post('auth/login/', {
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
      
      console.error('Full login error response:', error.response?.data);
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.error) {
          errorMessage = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else {
          // If it's a field error object, pick the first error
          const firstKey = Object.keys(data)[0];
          const firstError = data[firstKey];
          errorMessage = `${firstKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const sendOtp = async (email: string) => {
    try {
      const response = await apiClient.post('auth/send-login-otp/', {
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
      const response = await apiClient.post('auth/verify-login-otp/', {
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
      const response = await apiClient.post('auth/register/', userData)
      
      // The user wants to be directed to login after registration
      toast.success('Registration successful! Please login with your credentials.')
      router.push('/login')
    } catch (error: any) {
      setLoading(false)
      console.error('Registration error:', error.response?.data || error.message)
      
      let errorMessage = 'Registration failed'
      
      if (error.response?.data) {
        const errors = error.response.data
        if (typeof errors === 'string') {
          errorMessage = errors
        } else if (errors.detail) {
          errorMessage = errors.detail
        } else if (typeof errors === 'object') {
          // Flatten field errors: { "username": ["Already exists"] } -> "username: Already exists"
          const errorList = Object.keys(errors).map(key => {
            const val = errors[key]
            const msg = Array.isArray(val) ? val[0] : val
            return `${key}: ${msg}`
          })
          errorMessage = errorList.join(' | ')
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
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
