'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiBriefcase } from 'react-icons/fi';
import { FaQuoteRight } from 'react-icons/fa';
import { apiClient } from '@/lib/api';

interface Story {
  id: number;
  name: string;
  role: string;
  story: string;
  photo?: string;
  is_job_placement: boolean;
}

const SuccessStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await apiClient.get('consultancy/success-stories/');
        setStories(response.data);
      } catch (error) {
        console.error('Error fetching success stories:', error);
        // Fallback stories
        setStories([
          {
            id: 1,
            name: 'Priya Sharma',
            role: 'Software Engineer at EXL',
            story: 'The mentorship at Arpit Consultancy was life-changing. They guided me through every step of the interview process.',
            is_job_placement: true
          },
          {
            id: 2,
            name: 'Rahul Verma',
            role: 'Data Analyst at DXC',
            story: 'The practical projects helped me build a portfolio that stood out to recruiters. Highly recommend their programs!',
            is_job_placement: true
          },
          {
            id: 3,
            name: 'Sneha Patel',
            role: 'Full Stack Developer at Genpact',
            story: 'Career transformation is real. I went from zero coding knowledge to a professional developer in 6 months.',
            is_job_placement: true
          },
          {
            id: 4,
            name: 'Ankit Kumar',
            role: 'Cloud Engineer at IBM',
            story: 'The training and interview prep were top-notch. I secured my dream role thanks to the team.',
            is_job_placement: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl"></div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
      {stories.map((story, index) => (
        <motion.div
          key={story.id}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FaQuoteRight className="w-12 h-12 text-blue-500" />
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              {story.photo ? (
                <img src={story.photo} alt={story.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <FiUser className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{story.name}</h4>
              <div className="flex items-center text-xs text-gray-500">
                <FiBriefcase className="mr-1" />
                <span>{story.role}</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm italic leading-relaxed">
            &quot;{story.story}&quot;
          </p>
          
          {story.is_job_placement && (
            <div className="mt-4 inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">
              Success Story
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default SuccessStories;
