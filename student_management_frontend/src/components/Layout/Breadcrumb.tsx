'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { AuthContext } from '../providers/AuthProvider';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items = [], className = '' }) => {
  const pathname = usePathname();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const loading = authContext?.loading;
  
  // Generate default breadcrumbs from the current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;
    
    const pathSegments = (pathname || '').split('/').filter(segment => segment !== '');
    
    // Determine home link based on user role
    let homeHref = '/';
    
    if (user) {
      switch (user.user_type) {
        case 'student': homeHref = '/dashboard/student'; break;
        case 'tutor': homeHref = '/dashboard/tutor'; break;
        case 'admin': homeHref = '/dashboard/admin'; break;
        default: homeHref = '/dashboard';
      }
    } else if (pathname) {
      // Fallback inference if user not loaded yet to prevent breadcrumb flicker
      if (pathname.startsWith('/dashboard/student')) homeHref = '/dashboard/student';
      else if (pathname.startsWith('/dashboard/tutor')) homeHref = '/dashboard/tutor';
      else if (pathname.startsWith('/dashboard/admin')) homeHref = '/dashboard/admin';
      else if (pathname.startsWith('/dashboard')) homeHref = '/dashboard';
    }
    
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: homeHref }];
    
    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      
      // Skip if this path is part of the home path (e.g., /dashboard or /dashboard/student)
      if (homeHref !== '/' && (homeHref === currentPath || homeHref.startsWith(currentPath + '/'))) {
        return;
      }
      
      const capitalizedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
      // Remove IDs or make them more readable if possible, but for now just capitalize
      // Check if segment is a number (likely an ID)
      const label = !isNaN(Number(segment)) ? segment : capitalizedSegment;
      
      breadcrumbs.push({ label: label, href: currentPath });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = index === 0;
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <FiChevronRight className="mx-2 text-gray-400" />
              )}
              {isLast ? (
                <span className="text-sm font-medium text-gray-500 md:ml-2">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '/'}
                  className="text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  {isHome ? <FiHome className="mr-1 h-4 w-4" /> : null}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;