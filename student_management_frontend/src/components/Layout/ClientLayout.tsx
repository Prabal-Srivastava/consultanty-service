'use client';

import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster, toast } from 'react-hot-toast'
import NavigationHeader from '@/components/Layout/NavigationHeader'
import Breadcrumb from '@/components/Layout/Breadcrumb'
import ExitIntentModal from '@/components/Layout/ExitIntentModal'
import useExitIntent from '@/hooks/useExitIntent'
import { useState } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { showModal, closeModal } = useExitIntent(5000)
  const [leadData, setLeadData] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const getApiUrl = (path: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://student-management-backend-8s4c.onrender.com'
    if (path.startsWith('http')) return path
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    if (API_BASE_URL.startsWith('http')) {
      const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
      if (cleanPath.startsWith('api/')) {
        return `${base}${cleanPath}`
      }
      return `${base}api/${cleanPath}`
    }
    return path.startsWith('/') ? path : `/api/${path}`
  }

  const handleLeadSubmit = async (formData: { name: string; email: string; phone_number: string; message?: string }) => {
    try {
      const endpoint = getApiUrl('/leads/create/')
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Thank you! We will contact you soon.');
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    }
    
    setLeadData(formData);
  }

  return (
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
            <NavigationHeader />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Breadcrumb />
            </div>
            <main>
              {children}
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <ExitIntentModal
            isOpen={showModal}
            onClose={closeModal}
            onSubmit={handleLeadSubmit}
          />
        </AuthProvider>
  )
}
