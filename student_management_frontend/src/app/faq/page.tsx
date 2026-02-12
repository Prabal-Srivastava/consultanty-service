'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiSearch, FiHelpCircle } from 'react-icons/fi';
import { apiClient } from '@/lib/api';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const FALLBACK_FAQS: FAQ[] = [
  { id: 1, question: 'What is Arpit Consultancy?', answer: 'Arpit Consultancy is a career transformation platform providing industry-aligned training, guaranteed placements, and direct mentorship.' },
  { id: 2, question: 'Is placement guaranteed?', answer: 'Yes, we provide placement guarantees for our premium training programs, backed by our extensive network of hiring partners.' },
  { id: 3, question: 'Who is the founder?', answer: 'The consultancy was founded by Arpit Srivastava, a Software Engineer at IBM with a passion for career mentorship.' },
  { id: 4, question: 'Can I get one-on-one mentorship?', answer: 'Absolutely! Our mentorship program is a core part of our offering, connecting you directly with industry experts.' },
];

const FAQPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await apiClient.get('consultancy/faqs/');
        if (response.data && response.data.length > 0) {
          setFaqs(response.data);
        } else {
          setFaqs(FALLBACK_FAQS);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs(FALLBACK_FAQS);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block p-3 bg-blue-100 rounded-full text-blue-600 mb-4"
          >
            <FiHelpCircle className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600">
            Have questions? We have answers. If you can&apos;t find what you&apos;re looking for, feel free to contact us.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-900">{faq.question}</span>
                    {openIndex === index ? (
                      <FiChevronUp className="text-blue-500 w-5 h-5" />
                    ) : (
                      <FiChevronDown className="text-gray-400 w-5 h-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">No matching questions found.</p>
              </div>
            )}
          </div>
        )}

        {/* Help Footer */}
        <div className="mt-12 text-center p-8 bg-blue-600 rounded-3xl text-white shadow-xl">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-blue-100 mb-6">Our support team is here to help you 24/7.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/help-center"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Visit Help Center
            </a>
            <a
              href="/contact"
              className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors border border-blue-500"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
