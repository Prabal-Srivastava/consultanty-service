'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiBook, FiUsers, FiMessageSquare, FiCreditCard, FiCalendar, FiAward, FiLogOut, FiBell, FiBarChart2, FiCheckSquare, FiBriefcase } from 'react-icons/fi'
import { FaChalkboardTeacher, FaRupeeSign } from 'react-icons/fa'
import axios from 'axios'
import toast from 'react-hot-toast'

interface DashboardStat {
  title: string
  value: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
}

export default function StudentDashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Icon mapping
  const iconMap: { [key: string]: any } = {
    'FiBook': FiBook,
    'FiCheckSquare': FiCheckSquare,
    'FiCalendar': FiCalendar,
    'FiMessageSquare': FiMessageSquare,
    'FiAward': FiAward
  }

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/auth/dashboard/student/')
      const backendStats = response.data.stats
      
      // Transform backend stats to frontend format
      const formattedStats = backendStats.map((stat: any) => {
        const Icon = iconMap[stat.icon] || FiBook
        // Derive colors based on icon/title or use backend color if it matches Tailwind classes
        // For simplicity, we'll map based on title or index, or just use what we have
        
        let colorClass = 'bg-blue-100 text-blue-600'
        let bgClass = 'bg-blue-50'
        let borderClass = 'border-blue-200'

        if (stat.title.includes('Quiz')) {
           colorClass = 'bg-green-100 text-green-600'
           bgClass = 'bg-green-50'
           borderClass = 'border-green-200'
        } else if (stat.title.includes('Interview')) {
           colorClass = 'bg-purple-100 text-purple-600'
           bgClass = 'bg-purple-50'
           borderClass = 'border-purple-200'
        } else if (stat.title.includes('Message')) {
           colorClass = 'bg-yellow-100 text-yellow-600'
           bgClass = 'bg-yellow-50'
           borderClass = 'border-yellow-200'
        }

        return {
          title: stat.title,
          value: stat.value,
          icon: Icon,
          color: colorClass,
          bgColor: bgClass,
          borderColor: borderClass
        }
      })
      
      setStats(formattedStats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard data')
      // Fallback to default stats if error
      setStats([
        { title: 'Enrolled Courses', value: '0', icon: FiBook, color: 'bg-blue-100 text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { title: 'Completed Quizzes', value: '0', icon: FiAward, color: 'bg-green-100 text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        { title: 'Upcoming Interviews', value: '0', icon: FiCalendar, color: 'bg-purple-100 text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
        { title: 'Messages', value: '0', icon: FiMessageSquare, color: 'bg-yellow-100 text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
      ])
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'student')) {
      router.push('/')
    } else if (user) {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const dashboardStats = [
    { title: 'Enrolled Courses', value: '5', icon: FiBook, color: 'bg-blue-100 text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { title: 'Completed Quizzes', value: '12', icon: FiAward, color: 'bg-green-100 text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { title: 'Upcoming Interviews', value: '3', icon: FiCalendar, color: 'bg-purple-100 text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { title: 'Messages', value: '8', icon: FiMessageSquare, color: 'bg-yellow-100 text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  ]

  const quickActions = [
    { title: 'Browse Courses', href: '/courses', icon: FiBook, color: 'bg-blue-100 text-blue-600' },
    { title: 'Take Quiz', href: '/quizzes', icon: FiAward, color: 'bg-green-100 text-green-600' },
    { title: 'Chat with Tutor', href: '/chat', icon: FiMessageSquare, color: 'bg-purple-100 text-purple-600' },
    { title: 'Mentorship', href: '/mentorship', icon: FiUsers, color: 'bg-blue-100 text-blue-600' },
    { title: 'Job Placements', href: '/placements', icon: FiBriefcase, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'One-to-One Guidance', href: '/guidance', icon: FaChalkboardTeacher, color: 'bg-red-100 text-red-600' },
    { title: 'Make Payment', href: '/payment', icon: FiCreditCard, color: 'bg-yellow-100 text-yellow-600' },
    { title: 'Book Interview', href: '/interviews', icon: FiCalendar, color: 'bg-red-100 text-red-600' },
    { title: 'My Progress', href: '/dashboard/student/progress', icon: FiBarChart2, color: 'bg-indigo-100 text-indigo-600' },
    { title: 'Help Center', href: '/help-center', icon: FiMessageSquare, color: 'bg-green-100 text-green-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.first_name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600 transition-colors">
                <FiBell className="h-5 w-5" />
              </button>
              <button 
                onClick={logout}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FiLogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-sm p-6 border ${stat.borderColor} hover:shadow-md transition-shadow`}>
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingStats ? <span className="animate-pulse">...</span> : stat.value}
                  </p>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                href={action.href}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-center">
                  <div className={`${action.color} p-3 rounded-lg`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Courses</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FiBook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Advanced Mathematics</h3>
                      <p className="text-sm text-gray-500">Progress: 75%</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">In Progress</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Interviews</h2>
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FiCalendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">Technical Interview</h3>
                      <p className="text-sm text-gray-500">Tomorrow at 2:00 PM</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Scheduled</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaRupeeSign className="mr-2 text-green-600" />
            Payment Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Paid (50%)
              </h3>
              <p className="text-2xl font-bold text-green-600 mt-2">₹2,500</p>
              <p className="text-sm text-green-700 mt-1">Initial Payment</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800 flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Pending (50%)
              </h3>
              <p className="text-2xl font-bold text-yellow-600 mt-2">₹2,500</p>
              <p className="text-sm text-yellow-700 mt-1">After Job Offer</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Guarantee Period
              </h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">90 days</p>
              <p className="text-sm text-blue-700 mt-1">Money-back Guarantee</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutor Support</h3>
            <p className="text-gray-600 mb-4">Connect with expert tutors for personalized guidance and mentorship.</p>
            <Link 
              href="/chat" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FiMessageSquare className="mr-2" />
              Chat with Tutor
            </Link>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Guidance</h3>
            <p className="text-gray-600 mb-4">Get career advice and job placement assistance from our experts.</p>
            <Link 
              href="/interviews" 
              className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <FiCalendar className="mr-2" />
              Book Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}