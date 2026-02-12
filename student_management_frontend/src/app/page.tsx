'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiCheck, FiX, FiInfo, FiZap, FiDollarSign, FiCalendar, FiAward as FiAwardIcon, FiMessageSquare, FiLock, FiChevronRight } from 'react-icons/fi'
import { FaGraduationCap, FaLaptopCode, FaProjectDiagram } from 'react-icons/fa'

import SuccessStories from '@/components/SuccessStories'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      console.log('User detected, redirecting...', user.user_type);
      const dashboardPath = user.user_type === 'student' 
        ? '/dashboard/student' 
        : user.user_type === 'tutor' 
        ? '/dashboard/tutor' 
        : user.user_type === 'admin'
        ? '/dashboard/admin'
        : '/dashboard';
      router.replace(dashboardPath)
    }
    setIsVisible(true);
  }, [user, loading, router])

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full"></div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white py-4 border-b">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="animate-pulse bg-gray-200 rounded h-8 w-48"></div>
            <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
          </div>
        </header>

        {/* Hero Section Skeleton */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="animate-pulse bg-gray-200 rounded h-10 w-80 mx-auto mb-4"></div>
            <div className="animate-pulse bg-gray-200 rounded h-6 w-64 mx-auto mb-8"></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <div className="animate-pulse bg-gray-200 rounded h-12 w-40"></div>
              <div className="animate-pulse bg-gray-200 rounded h-12 w-40"></div>
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  // Tooltip component
  const Tooltip = ({ content, children, id }: { content: string; children: React.ReactNode; id: string }) => (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(id)}
      onMouseLeave={() => setShowTooltip(null)}
    >
      {children}
      {showTooltip === id && (
        <div className="absolute z-10 w-48 p-2 text-xs text-white bg-gray-800 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2">
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 rotate-45 top-full left-1/2 transform -translate-x-1/2 -mt-1"></div>
        </div>
      )}
    </div>
  );

  const services = [
    {
      title: "50/50 Payment",
      description: "Pay half upfront, half after job guarantee",
      icon: FiDollarSign,
      tooltip: "Unique payment model: pay 50% upfront, 50% after securing a job. Money-back guarantee if unsuccessful."
    },
    {
      title: "15+ Mock Interviews",
      description: "Comprehensive interview prep",
      icon: FiCalendar,
      tooltip: "Over 15 mock interviews with industry experts to ensure you're fully prepared."
    },
    {
      title: "Tri-Quiz System",
      description: "3 quizzes per subject",
      icon: FiAwardIcon,
      tooltip: "Three mandatory assessments per topic for comprehensive learning."
    },
    {
      title: "24/7 Support",
      description: "Round-the-clock assistance",
      icon: FiMessageSquare,
      tooltip: "Our support team is available anytime you need help."
    }
  ];

  // Pros and Cons Data
  const prosConsData = {
    pros: [
      { text: "Job Guarantee", icon: FiCheck, tooltip: "90-day money-back guarantee if you don't land a job" },
      { text: "Expert Mentors", icon: FiCheck, tooltip: "Learn from industry professionals" },
      { text: "Flexible Schedule", icon: FiCheck, tooltip: "Study at your own pace" },
      { text: "Portfolio Building", icon: FiCheck, tooltip: "Real projects for your portfolio" },
    ],
    cons: [
      { text: "Intensive Pace", icon: FiX, tooltip: "Fast-paced curriculum may challenge beginners" },
      { text: "High Standards", icon: FiX, tooltip: "Quality maintained through strict assessments" },
      { text: "Limited Seats", icon: FiX, tooltip: "Small batches for personalized attention" },
      { text: "Requires Dedication", icon: FiX, tooltip: "Success needs consistent effort" },
    ]
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <header className="bg-white py-4 border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FaProjectDiagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Arpit Consultancy</h1>
              <p className="text-xs text-gray-500">Career Transformation</p>
            </div>
          </div>
          <nav className="flex space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm flex items-center">
              <FiLock className="mr-1" /> Login
            </Link>
            <Link href="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 delay-100">
            <span className="text-blue-600">Arpit Consultancy</span> Service
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-200">
            Transform your career with our comprehensive training, job guarantee programs, and personalized mentorship.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 transition-all duration-700 delay-300">
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <FiZap className="mr-2" /> Start Your Journey
            </Link>
            <Link 
              href="#services" 
              className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              Learn More
            </Link>
            <Link 
              href="/contact" 
              className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "50/50", label: "Payment" },
              { value: "90 Days", label: "Guarantee" },
              { value: "15+", label: "Interviews" },
              { value: "24/7", label: "Support" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="p-3 bg-white rounded border border-gray-100 transition-transform duration-300 hover:scale-105"
              >
                <div className="text-lg font-bold text-blue-600">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pros and Cons Section */}
      <section className="py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Why Choose Us</h2>
            <p className="text-gray-600 text-sm">Understanding our program&apos;s benefits and expectations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pros */}
            <div className="bg-green-50 p-5 rounded border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center mr-3">
                  <FiCheck className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Advantages</h3>
              </div>
              <ul className="space-y-2">
                {prosConsData.pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <Tooltip content={pro.tooltip} id={`pro-${index}`}>
                      <div className="flex items-start">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <pro.icon className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">{pro.text}</span>
                        <FiInfo className="ml-1 h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Cons */}
            <div className="bg-red-50 p-5 rounded border border-red-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center mr-3">
                  <FiX className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Considerations</h3>
              </div>
              <ul className="space-y-2">
                {prosConsData.cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <Tooltip content={con.tooltip} id={`con-${index}`}>
                      <div className="flex items-start">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <con.icon className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-sm text-gray-700">{con.text}</span>
                        <FiInfo className="ml-1 h-3 w-3 text-gray-400 mt-0.5" />
                      </div>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section id="services" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Our Services</h2>
            <p className="text-gray-600 text-sm">Professional solutions for career transformation</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, index) => (
              <div 
                key={index}
                className="bg-white p-4 rounded border border-gray-100 transition-all duration-300 hover:shadow-sm"
              >
                <Tooltip content={service.tooltip} id={`service-${index}`}>
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mb-3">
                    <service.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </Tooltip>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{service.title}</h3>
                <p className="text-gray-600 text-xs">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Why Choose Arpit Consultancy?</h2>
            <p className="text-gray-600 text-sm">Our unique approach to career development</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FaGraduationCap,
                title: "Expert Training",
                description: "Learn from industry professionals with years of experience."
              },
              {
                icon: FiDollarSign,
                title: "Job Guarantee",
                description: "90-day money-back guarantee ensures your investment is protected."
              },
              {
                icon: FaLaptopCode,
                title: "Hands-On Projects",
                description: "Build a portfolio of real projects for employer showcasing."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="text-center p-5 border border-gray-100 rounded transition-all duration-300 hover:border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-xs">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section id="success-stories" className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Success Stories</h2>
            <p className="text-gray-600 text-sm">Real transformations from our students</p>
          </div>
          <SuccessStories />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Ready to Transform Your Career?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Join professionals who transformed their careers with our program
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/register" 
              className="bg-white text-blue-600 px-6 py-2.5 rounded text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              <FiZap className="mr-2" /> Enroll Now
            </Link>
            <Link 
              href="/contact" 
              className="border-2 border-white text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              <FiMessageSquare className="mr-2" /> Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FaProjectDiagram className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">Arpit Consultancy</span>
              </div>
              <p className="text-gray-400 text-xs mb-4">
                Transforming careers with training, guarantees, and mentorship.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/courses" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Career Training</Link></li>
                <li><Link href="/placements" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Job Placement</Link></li>
                <li><Link href="/mentorship" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Mentorship</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/help-center" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> FAQ</Link></li>
                <li className="mt-2 text-blue-400 font-medium">arpitshivamsrivastava@gmail.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> About Us</Link></li>
                <li><Link href="#success-stories" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Success Stories</Link></li>
                <li><Link href="/about#vision" className="hover:text-white transition-colors flex items-center"><FiChevronRight className="mr-1 text-[10px]" /> Vision</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-xs">
            <p>&copy; 2026 Arpit Consultancy Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}