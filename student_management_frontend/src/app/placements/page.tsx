'use client';

import { motion } from 'framer-motion';
import { FiBriefcase, FiAward, FiTrendingUp, FiCheckCircle, FiArrowRight, FiUser } from 'react-icons/fi';
import { Button } from '@/components';
import { consultancyAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

interface SuccessStory {
  id: number;
  name: string;
  role: string;
  story: string;
  photo: string | null;
  is_job_placement: boolean;
}

export default function PlacementsPage() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await consultancyAPI.getSuccessStories();
        // Filter only job placement stories
        const placementStories = res.data.filter((s: SuccessStory) => s.is_job_placement);
        setStories(placementStories);
      } catch (error) {
        console.error('Error fetching success stories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 mb-4"
          >
            Job Placement Assistance
          </motion.h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We don&apos;t just train you; we ensure you get the career you deserve with our dedicated placement support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <FiBriefcase className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Hiring Partners</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our network includes top-tier tech companies, startups, and global enterprises. 
              We directly connect our eligible students with recruiters looking for fresh talent.
            </p>
            <ul className="space-y-3">
              {[
                "Direct referrals to hiring managers",
                "Exclusive access to job boards",
                "Priority screening for partner roles",
                "Negotiation support and guidance"
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-gray-700">
                  <FiCheckCircle className="text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <FiAward className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Placement Statistics</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">95%</div>
                <div className="text-sm text-gray-500">Placement Rate</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">12 LPA</div>
                <div className="text-sm text-gray-500">Average Package</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-sm text-gray-500">Alumni Hired</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600">50+</div>
                <div className="text-sm text-gray-500">Partner Companies</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Success Stories</h2>
          <p className="text-gray-600 mt-2">Hear from our students who landed their dream jobs.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full"
              >
                <div className="flex items-center space-x-4 mb-6">
                  {story.photo ? (
                    <img 
                      src={story.photo} 
                      alt={story.name} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <FiUser className="w-8 h-8" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">{story.name}</h4>
                    <p className="text-sm text-blue-600">{story.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic leading-relaxed flex-grow">
                  &quot;{story.story}&quot;
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500">More success stories coming soon!</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Our Placement Guarantee</h2>
          <p className="text-blue-100 mb-10 max-w-3xl mx-auto text-lg">
            We stand by our training. If you complete our premium program and don&apos;t get a job offer 
            within 90 days, we provide a 50% refund as per our policies.
          </p>
          <Button 
            onClick={() => { window.location.href = '/dashboard/student' }}
            className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-4 text-lg font-bold rounded-xl"
          >
            Check Your Eligibility
          </Button>
        </div>
      </div>
    </div>
  );
}
