'use client';

import { motion } from 'framer-motion';
import { FiCompass, FiMap, FiTarget, FiActivity, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components';

export default function GuidancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 mb-4"
          >
            One-to-One Guidance
          </motion.h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Personalized career roadmaps and strategic planning tailored to your unique goals.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Career Compass</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Navigating the tech landscape can be overwhelming. Our guidance sessions provide you with a 
                clear path forward, identifying the skills you need to master and the roles that best 
                match your strengths.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Skill Gap Analysis",
                    desc: "We evaluate your current skills against industry requirements.",
                    icon: <FiTarget className="text-red-500" />
                  },
                  {
                    title: "Custom Roadmaps",
                    desc: "Step-by-step plans to reach your target job role.",
                    icon: <FiMap className="text-blue-500" />
                  },
                  {
                    title: "Progress Tracking",
                    desc: "Regular check-ins to ensure you're staying on course.",
                    icon: <FiActivity className="text-green-500" />
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-blue-600 rounded-3xl p-8 text-white relative z-10">
                <FiCompass className="w-16 h-16 text-blue-200 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Why Personalized Guidance?</h3>
                <p className="text-blue-100 mb-8">
                  Generic advice doesn&apos;t work in a specialized industry. 
                  Our mentors analyze your background, interests, and the current market 
                  to give you advice that actually moves the needle.
                </p>
                <div className="p-4 bg-blue-500 bg-opacity-30 rounded-2xl border border-blue-400 border-opacity-30">
                  <p className="text-sm italic">
                    &quot;The guidance session changed my entire perspective on how to approach 
                    system design interviews. I landed my senior role within weeks.&quot;
                  </p>
                  <p className="text-xs mt-2 font-bold">— Rahul, Alumni</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-blue-100 rounded-3xl -z-10"></div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => { window.location.href = '/dashboard/student' }}
            className="px-12 py-4 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Journey Now
          </Button>
        </div>
      </div>
    </div>
  );
}
