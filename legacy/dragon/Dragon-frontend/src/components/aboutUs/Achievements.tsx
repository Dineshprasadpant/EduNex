import React, { useState, useEffect, useRef } from 'react';
import { Users, GraduationCap, BookOpen, ThumbsUp } from 'lucide-react';

interface AnimationProps {
  setter: React.Dispatch<React.SetStateAction<number>>;
  start: number;
  end: number;
  duration: number;
}

export const AchievementsSection: React.FC = () => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [learnerCount, setLearnerCount] = useState<number>(0);
  const [instructorCount, setInstructorCount] = useState<number>(0);
  const [satisfactionRate, setSatisfactionRate] = useState<number>(0);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const animationTriggered = useRef<boolean>(false);

  const animateValue = ({ setter, start, end, duration }: AnimationProps): void => {
    let startTimestamp: number | null = null;

    const step = (timestamp: number): void => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      setter(value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animationTriggered.current) {
          animationTriggered.current = true;
          animateValue({ setter: setStudentCount, start: 0, end: 12, duration: 1500 });
          animateValue({ setter: setLearnerCount, start: 0, end: 1200, duration: 1500 });
          animateValue({ setter: setInstructorCount, start: 0, end: 70, duration: 1500 });
          animateValue({ setter: setSatisfactionRate, start: 0, end: 98, duration: 1500 });
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const stats = [
    {
      icon: <Users className="w-5 h-5 text-[#08049c]" />,
      value: `${studentCount}k+`,
      label: "Happy Students"
    },
    {
      icon: <GraduationCap className="w-5 h-5 text-[#08049c]" />,
      value: `${learnerCount}+`,
      label: "Currently Studying"
    },
    {
      icon: <BookOpen className="w-5 h-5 text-[#08049c]" />,
      value: `${instructorCount}+`,
      label: "Expert Instructors"
    },
    {
      icon: <ThumbsUp className="w-5 h-5 text-[#08049c]" />,
      value: `${satisfactionRate}%`,
      label: "Satisfaction Rate"
    }
  ];

  return (
    <div className="w-full bg-white py-12 sm:py-16 lg:py-18 font-Urbanist" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Our <span className="text-[#08049c]">Achievements</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of students and instructors worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-lg border border-gray-200  transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-indigo-50 p-3 rounded-full mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-600">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsSection;