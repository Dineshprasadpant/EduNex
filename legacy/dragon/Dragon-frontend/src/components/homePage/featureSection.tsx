"use client"
import React, { useEffect, useState } from 'react';
import { UserSquare2, PlaySquare, DollarSign, Book } from 'lucide-react';

const features = [
  {
    icon: UserSquare2,
    title: "Exclusive Advisor",
    description: "Study from the Experts.",
    color: "from-blue-500 to-[#010794]"
  },
  {
    icon: PlaySquare,
    title: "Class Materials",
    description: "Learn more from the class materials we provide",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: DollarSign,
    title: "Affordable Price",
    description: "Quality Education at Student-Friendly Prices",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Book,
    title: "Mock Test",
    description: "Take mock exams to enhance your practice.",
    color: "from-orange-500 to-orange-600"
  }
];

const FeatureSection = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <section className="py-20 font-Urbanist">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-base font-semibold text-[#010794] tracking-wide uppercase mb-3">
            Features
          </h2>
          <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            A Unified Platform, <span className="text-[#010794]">Endless Opportunities</span>
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Everything you need to excel in your journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm  transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 mb-6 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h4>
                
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;