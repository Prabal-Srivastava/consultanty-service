'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { FiUsers, FiSettings, FiActivity, FiLogOut, FiBell, FiShield } from 'react-icons/fi'

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.user_type !== 'admin')) {
      router.push('/')
    }
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
    { title: 'Total Users', value: '1,234', icon: FiUsers, color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Sessions', value: '56', icon: FiActivity, color: 'bg-green-100 text-green-600' },
    { title: 'System Health', value: '98%', icon: FiShield, color: 'bg-purple-100 text-purple-600' },
    { title: 'Pending Approvals', value: '15', icon: FiBell, color: 'bg-red-100 text-red-600' },
  ]

  const quickActions = [
    { title: 'Manage Users', href: '/admin/users', icon: FiUsers },
    { title: 'System Settings', href: '/admin/settings', icon: FiSettings },
    { title: 'Audit Logs', href: '/admin/logs', icon: FiActivity },
    { title: 'Access Control', href: '/admin/access', icon: FiShield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link 
                key={index} 
                href={action.href}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 border border-gray-100 flex items-center space-x-4"
              >
                <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="font-semibold text-gray-900">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
