import React, { useState } from "react";
import { GraduationCap, BookOpen, Users, Award, ArrowRight, Play, Contact } from "lucide-react";
import { Button } from "../ui/button";
import AdvertisementDialog from "./advertisement";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(true);
  const router = useRouter();

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden font-Urbanist">
        {/* Simple background accent */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-1/2 h-screen bg-blue-50  rounded-bl-[100px]" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-16">
            {/* Left content (previously right) */}
            <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-[#010794]  text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                #1 Engineering Education Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900  leading-tight">
                Master Skills 
                <span className="block">with Pulchowk's</span>
                <span className="text-[#010794]">
                  Finest Educators
                </span>
              </h1>

              <p className="text-xl text-slate-600  max-w-xl">
                Transform your engineering journey with expert-led courses from 
                <span className="text-[#010794]  font-semibold"> Pulchowk Engineering College</span>. 
                Join thousands of successful students.
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#010794] " />
                  <div>
                    <p className="font-bold text-slate-900 ">12K+</p>
                    <p className="text-sm text-slate-600 ">Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[#010794] " />
                  <div>
                    <p className="font-bold text-slate-900 ">20+</p>
                    <p className="text-sm text-slate-600 ">Courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#010794] " />
                  <div>
                    <p className="font-bold text-slate-900 ">95%</p>
                    <p className="text-sm text-slate-600 ">Success Rate</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => router.push("/courses")}
                  className="px-8 py-3 bg-[#010794] hover:bg-blue-800 text-white font-medium rounded-lg"
                >
                  Browse Courses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={() => router.push("/contact")}
                  className="px-8 py-3 bg-slate-100  hover:bg-slate-200  text-slate-900  font-medium rounded-lg"
                >
                  <Contact className="w-5 h-5 mr-2" />
                  Contact
                </Button>
              </div>
            </div>

            {/* Right content (previously left) */}
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <img
                  src="/images/home.png"
                  className="relative w-full "
                  alt="Teacher with students"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdvertisementDialog
        autoScrollInterval={5000}
        isOpen={isAdDialogOpen}
        setIsOpen={setIsAdDialogOpen}
      />
    </>
  );
};

export default HeroSection;