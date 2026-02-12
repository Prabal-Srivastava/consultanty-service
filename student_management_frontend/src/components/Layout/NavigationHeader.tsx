'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiUser, FiLogOut, FiMessageSquare, FiBook, FiAward, FiInfo } from 'react-icons/fi';
import { Button } from '@/components';
import Link from 'next/link';

export default function NavigationHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const getDashboardLink = () => {
    switch(user.user_type) {
      case 'student': return '/dashboard/student';
      case 'tutor': return '/dashboard/tutor';
      case 'admin': return '/dashboard/admin';
      default: return '/dashboard';
    }
  };

  const getPortalTitle = () => {
    switch(user.user_type) {
      case 'student': return 'Student Portal';
      case 'tutor': return 'Tutor Portal';
      case 'admin': return 'Admin Portal';
      default: return 'Portal';
    }
  };

  const navItems = [
    { name: 'Dashboard', href: getDashboardLink(), icon: FiHome },
    { name: 'Courses', href: '/courses', icon: FiBook },
    { name: 'Chat', href: '/chat', icon: FiMessageSquare },
    { name: 'Quizzes', href: '/quizzes', icon: FiAward },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => router.push(getDashboardLink())}>
              <h1 className="text-xl font-bold text-gray-900">{getPortalTitle()}</h1>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/profile" className="flex items-center hover:bg-gray-50 p-2 rounded-md transition-colors">
              <FiUser className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {user.first_name} {user.last_name}
              </span>
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 uppercase">
                {user.user_type}
              </span>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="flex items-center"
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
