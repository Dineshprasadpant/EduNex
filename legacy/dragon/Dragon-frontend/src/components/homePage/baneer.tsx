import { useRef, useEffect, useState } from "react";
import { motion, useAnimationControls, useInView,Variants } from "framer-motion";

const logos = [
  {
    name: "Pathshala",
    image: "/images/banner/pathshala.png",
  },
  {
    name: "Dragon Education Foundation",
    image: "/images/banner/dragon.png",
  },
];

// Create multiple sets for continuous scroll
const duplicatedLogos = [...logos, ...logos, ...logos, ...logos];

const LogoSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const controls = useAnimationControls();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
};

  return (
    <section
      className="py-16 sm:py-20 lg:py-24 "
      ref={containerRef}
    >
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        {/* Header Section */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-Urbanist font-bold text-gray-900 mb-4">
            Trusted Partners
          </h2>
          <div className="w-16 h-px bg-gray-400 mx-auto"></div>
        </motion.div>

        {/* Logos Display - Static Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 max-w-4xl mx-auto"
          variants={itemVariants}
        >
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              className="group relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Card Container */}
              <div className="bg-white  p-8 sm:p-12 ">
                {/* Logo Container */}
                <div className="flex items-center justify-center h-20 sm:h-24 lg:h-28">
                  <img
                    src={logo.image}
                    alt={`${logo.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                
                {/* Logo Name */}
                <div className="mt-6 text-center">
                  <p className="text-sm sm:text-base font-Urbanist text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                    {logo.name}
                  </p>
                </div>

                {/* Subtle hover effect line */}
                <motion.div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gray-900 origin-center"
                  initial={{ width: 0 }}
                  whileHover={{ width: "60%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Alternative: Minimal Scrolling Version */}
        <motion.div 
          className="mt-20 relative overflow-hidden"
          variants={itemVariants}
        >
          <div className="border-t border-b border-gray-200 py-8">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-gray-50 to-transparent z-10" />
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-gray-50 to-transparent z-10" />
            
            {/* Scrolling container */}
            <div 
              className="flex items-center"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <motion.div
                className="flex items-center gap-16 sm:gap-20 lg:gap-24"
                animate={isPaused ? {} : {
                  x: [0, -400]
                }}
                transition={{
                  x: {
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                  },
                }}
              >
                {duplicatedLogos.map((logo, index) => (
                  <div
                    key={`scroll-${logo.name}-${index}`}
                    className="flex-shrink-0 group"
                  >
                    <img
                      src={logo.image}
                      alt={`${logo.name} logo`}
                      className="h-8 sm:h-10 lg:h-12 w-auto object-contain filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Text */}
        <motion.div 
          className="text-center mt-12"
          variants={itemVariants}
        >
          <p className="text-sm text-gray-500 font-Urbanist">
            Collaborating with leading educational organizations
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default LogoSection;