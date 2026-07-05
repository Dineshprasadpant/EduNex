import React, { useState } from 'react';
import { BookOpen, BarChart2, Award, ChevronRight, Star } from 'lucide-react';
import {useRouter} from 'next/navigation';

const PricingCard = ({ plan, isHighlighted }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <div
      className={`relative font-Urbanist group bg-white transition-all duration-500 ease-out mt-8 ${isHighlighted ? 'lg:-translate-y-6' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-white backdrop-blur-xl rounded-2xl sm:rounded-3xl transition-all duration-500 
        ${isHovered ? 'scale-[1.02]' : ''} 
        ${isHighlighted ? 'border-1 border-[#d1e0fb]' : 'border border-[#def1f6]'}`}
      />

      <div className="relative p-6 sm:p-8">
        <div className={`inline-flex mb-4 sm:mb-6 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br
          ${isHighlighted
            ? 'bg-[#010794] text-[white]'
            : plan.name === 'Free' 
              ? 'from-gray-100 to-gray-200 text-gray-600'
              : 'from-slate-100 to-slate-50 text-slate-700'}`}>
          {plan.icon}
        </div>

        <div className="mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{plan.description}</p>
        </div>

    

        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {plan.features.map((feature: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 sm:gap-3">
              <div className={`mt-1 p-0.5 rounded-full ${isHighlighted ? 'bg-[#ebf2ff] text-[#010794]' : 
                plan.name === 'Free' ? 'bg-gray-200 text-gray-600' : 'bg-[#dcf2f7] text-[#082c34]'}`}>
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <span className="text-slate-700 text-xs sm:text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <button
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-medium transition-all duration-300 text-sm sm:text-base
            ${isHighlighted
              ? 'bg-[#010794] text-white hover:bg-blue-800'
              : 'bg-[#082c34] text-white hover:bg-slate-800'
            } ${isHovered ? 'scale-[1.02]' : ''}`}
             onClick={() => router.push('/courses')}
        >
          <span className="flex items-center justify-center gap-2">Get Started
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </button>
      </div>
    </div>
  );
};

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "Free",
      description: "Basic access with limited features",
      icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />,
      features: [
        "Few mock exams available",
        "User verification required",
        "No access to class material",
        "Basic profile with exam feedback",
        "Event announcements and news"
      ]
    },
    {
      name: "Standard",
      description: "Enhanced access with classes",
      icon: <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />,
      features: [
        "Access to limited class materials",
        "More mock exams available",
        "Profile with performance feedback",
        "Event announcements and news",
        "Zoom meeting links included",
      ]
    },
    {
      name: "Premium",
      description: "Complete access with all features",
      icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" />,
      features: [
        "Access to premium class materials",
        "Weekly mock practice sessions",
        "Zoom meeting links included",
        "Full profile with detailed feedback",
        "All event announcements and news"
      ]
    }
  ];

  return (
    <div className="relative w-full mt-10 bg-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 font-Urbanist">Choose Your Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <PricingCard plan={plans[0]} isHighlighted={false} />
          <PricingCard plan={plans[1]} isHighlighted={true} />
          <PricingCard plan={plans[2]} isHighlighted={false} />
        </div>
      </div>
    </div>
  );
};

export default PricingSection;