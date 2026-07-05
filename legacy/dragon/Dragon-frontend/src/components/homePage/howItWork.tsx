import React from "react";
import { GraduationCap, BookOpen, UserPlus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: string;
}

const HowItWorks: React.FC = () => {
  const router = useRouter();
  const steps: Step[] = [
    {
      icon: <GraduationCap size={24} className="text-[#010794]" />,
      title: "Choose A Course",
      description: "Browse through our extensive catalog and discover the perfect course that aligns with your career goals.",
      step: "01",
    },
    {
      icon: <UserPlus size={24} className="text-[#010794]" />,
      title: "Register for the Course", 
      description: "Complete your registration with our streamlined process and await admin verification.",
      step: "02",
    },
    {
      icon: <BookOpen size={24} className="text-[#010794]" />,
      title: "Begin Your Journey",
      description: "Start learning with our cutting-edge platform featuring interactive content and expert mentorship.",
      step: "03",
    },
  ];

  return (
    <div className="py-16 sm:py-24 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Header Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 sm:text-4xl font-Urbanist mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 font-Urbanist">
            Get started in three simple steps
          </p>
        </motion.div>

        {/* Steps Container */}
        <div className="relative">
          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:justify-between lg:items-center lg:space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="flex-1"
                >
                  <motion.div 
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-lg p-8 h-full border border-gray-200 hover:shadow-lg"
                  >
                    {/* Step Number & Icon */}
                    <div className="flex items-center mb-6">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mr-4"
                      >
                        {step.icon}
                      </motion.div>
                      <span className="text-sm font-medium text-[#010794]">
                        Step {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-Urbanist">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-base font-Urbanist">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>

                {/* Animated Arrow */}
                {index < steps.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.2 + 0.2 }}
                    className="flex items-center justify-center w-24"
                  >
                    <motion.div 
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="group flex items-center"
                    >
                      <div className="w-12 h-0.5 bg-[#010794] relative">
                        <div className="absolute right-0 w-3 h-3 border-t-2 border-r-2 border-[#010794] transform rotate-45 -translate-y-1"></div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md"
                >
                  <div className="flex items-center mb-4">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mr-4"
                    >
                      {step.icon}
                    </motion.div>
                    <span className="text-sm font-medium text-[#010794]">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 font-Urbanist">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-Urbanist">
                    {step.description}
                  </p>
                </motion.div>

                {/* Vertical Arrow for Mobile */}
                {index < steps.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.2 + 0.2 }}
                    className="flex justify-center my-4"
                  >
                    <motion.div 
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-0.5 h-8 bg-[#010794] relative"
                    >
                      <div className="absolute bottom-0 left-1/2 w-2 h-2 border-b-2 border-r-2 border-[#010794] transform rotate-45 translate-x-[-50%]"></div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/contact')}
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-full text-white bg-[#010794] hover:bg-blue-700 transition-colors duration-300 font-Urbanist"
          >
            Get Started Today
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HowItWorks;