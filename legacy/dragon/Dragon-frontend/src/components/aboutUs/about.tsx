import React from 'react';
import { Lightbulb, ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const HeroSection: React.FC = () => {
  const router = useRouter();
  return (
    <div className="relative w-full min-h-screen bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-12 sm:py-16 md:py-20 overflow-hidden font-Urbanist">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-slate-50 rounded-full blur-2xl opacity-40"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-12 h-12 border border-blue-200 rounded-lg rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-32 left-16 w-8 h-8 bg-blue-100 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-1/3 left-1/2 w-6 h-6 bg-slate-200 rotate-45 animate-pulse delay-1500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          
          {/* Left Side - Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {/* Section Header */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full mb-6">
              <span className="text-sm font-medium text-[#08049c]">Step Up. Stand Out</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl  font-bold mb-6 leading-tight text-gray-900">
              Elevate Your
              <span className="text-[#08049c]"> Skills.</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Welcome to our premier educational institute dedicated to preparing students for success in engineering, CSIT, and specialized bridge courses. With expert faculty, comprehensive curriculum, and proven methodologies, we transform academic aspirations into achievements.
            </p>

            {/* Feature Points */}
            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                  <Lightbulb className="w-6 h-6 text-[#08049c]" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Academic Excellence</h3>
                  <p className="text-gray-600">Our specialized programs are designed to help students master complex concepts and excel in engineering entrance exams, CSIT admissions, and bridge courses.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                  <ClipboardList className="w-6 h-6 text-[#08049c]" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Career Preparation</h3>
                  <p className="text-gray-600">Beyond exam preparation, we equip students with problem-solving skills, technical knowledge, and practical expertise needed for successful careers in technology fields.</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => router.push("/courses")}
                className="group relative overflow-hidden bg-[#08049c] hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Explore Programs
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
          </div>

          {/* Right Side - Visual Elements */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative z-10 space-y-6">
              {/* First Image */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-200 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white border border-gray-100 rounded-3xl overflow-hidden p-2 shadow-xl">
                  <img
                    src="/images/students/student.jpg"
                    alt="Student studying at a desk with laptop and books"
                    className="w-full h-64 sm:h-80 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Second Image */}
              <div className="relative group ml-8 -mt-16">
                <div className="absolute inset-0 bg-slate-200 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-white border border-gray-100 rounded-3xl overflow-hidden p-2 shadow-xl">
                  <img
                    src="/images/students/student3.jpg"
                    alt="Group of diverse students collaborating on a project"
                    className="w-full h-64 sm:h-80 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30 -z-10"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;