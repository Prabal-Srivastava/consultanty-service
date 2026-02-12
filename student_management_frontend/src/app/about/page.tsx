'use client';

import { motion } from 'framer-motion';
import { FiTarget, FiZap, FiCheckCircle, FiUsers, FiAward } from 'react-icons/fi';
import { FaLinkedin, FaBriefcase } from 'react-icons/fa';
import Image from 'next/image';

const AboutPage = () => {
  const stats = [
    { label: 'Successful Placements', value: '500+' },
    { label: 'Courses Offered', value: '25+' },
    { label: 'Expert Tutors', value: '15+' },
    { label: 'Student Satisfaction', value: '98%' },
  ];

  const values = [
    {
      icon: <FiTarget className="w-8 h-8 text-blue-500" />,
      title: 'Our Vision',
      description: 'To bridge the gap between education and industry, empowering every student with the skills and confidence to excel in their careers.',
    },
    {
      icon: <FiZap className="w-8 h-8 text-yellow-500" />,
      title: 'Career Transformation',
      description: 'We don\'t just teach; we transform. Our programs are designed to take you from a learner to a leader in your chosen field.',
    },
    {
      icon: <FiAward className="w-8 h-8 text-purple-500" />,
      title: 'Guaranteed Growth',
      description: 'With our personalized mentorship and industry-aligned curriculum, we guarantee measurable growth in your professional journey.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="relative bg-blue-600 py-20 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
              Arpit Consultancy: Career Transformation
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Empowering the next generation of tech leaders through specialized training, 
              guaranteed placements, and one-on-one mentorship.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50 transform skew-y-2 translate-y-10"></div>
      </section>

      {/* Vision & Values */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{value.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full md:w-1/3"
            >
              <div className="relative w-64 h-64 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-blue-500 flex items-center justify-center text-white text-6xl font-bold">
                  AS
                </div>
                {/* Image placeholder - add real image later */}
              </div>
            </motion.div>
            
            <div className="w-full md:w-2/3">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Founder</h2>
              <div className="flex items-center space-x-3 mb-6">
                <h3 className="text-2xl font-bold text-blue-600">Arpit Srivastava</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Founder & Visionary</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600 mb-6">
                <FaBriefcase className="text-blue-500" />
                <span className="font-medium">Software Engineer at IBM</span>
              </div>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                With a passion for mentorship and a deep understanding of the global tech industry, 
                Arpit Srivastava founded this consultancy to provide students with the same 
                opportunities and guidance that led him to a successful career at IBM. 
                His vision is to ensure that no talent goes unrecognized due to a lack of guidance.
              </p>
              
              <a 
                href="https://linkedin.com/in/arpitsrivastava" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-lg"
              >
                <FaLinkedin className="w-5 h-5" />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide */}
      <section id="vision" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Vision & Mission</h2>
            <p className="text-gray-400">Arpit Consultancy is dedicated to career transformation and professional excellence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Industry Training', desc: 'Curriculum designed by industry experts from IBM and other tech giants.' },
              { title: 'Guaranteed Placements', desc: 'We stand by our training with placement support for all eligible students.' },
              { title: 'One-to-One Mentorship', desc: 'Direct guidance from top industry professionals like Arpit Srivastava.' },
              { title: 'Mock Interviews', desc: 'Prepare for the real world with expert feedback and industry standards.' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-gray-800 rounded-xl border border-gray-700">
                <FiCheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
            <p className="text-gray-600">Hear from those who transformed their careers with us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Ankit Kumar",
                role: "Software Developer",
                text: "The mentorship provided by Arpit sir was instrumental in my journey to landing a job at a top tech firm.",
              },
              {
                name: "Sanjana Rao",
                role: "Data Scientist",
                text: "The practical approach to learning and the placement support exceeded my expectations. Truly life-changing.",
              },
              {
                name: "Vikram Singh",
                role: "Cloud Engineer",
                text: "From basics to advanced cloud concepts, the training was comprehensive and industry-focused.",
              },
            ].map((t, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <FiAward key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 italic mb-6">&quot;{t.text}&quot;</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies Section */}
      <section id="policies" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Platform Policies</h2>
          <div className="space-y-8">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-3">Privacy Policy</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                We value your privacy. Your data is encrypted and used only to provide you with the best educational 
                experience and career opportunities. We never share your personal information with third parties 
                without your explicit consent.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h3 className="text-xl font-bold text-green-900 mb-3">Terms of Service</h3>
              <p className="text-green-800 text-sm leading-relaxed">
                By using Arpit Consultancy, you agree to our code of conduct. We promote a respectful and 
                collaborative learning environment. All materials provided are for personal educational use only.
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
              <h3 className="text-xl font-bold text-purple-900 mb-3">Refund & Placement Policy</h3>
              <p className="text-purple-800 text-sm leading-relaxed">
                We offer a 90-day money-back guarantee if our placement support doesn&apos;t result in successful 
                career outcomes for eligible students who complete their programs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
