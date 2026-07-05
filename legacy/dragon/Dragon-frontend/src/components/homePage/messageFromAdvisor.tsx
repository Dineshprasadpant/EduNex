import { useState } from 'react';

export default function AdvisorMessage() {
  return (
    <div className=" overflow-hidden max-w-6xl mx-auto my-8 font-Urbanist">
      <div className="flex flex-col md:flex-row">
        {/* Message Section - Left Side */}
        <div className="p-6 md:w-2/3 bg-gray-50">
          <h2 className="text-4xl font-bold  mb-4  font-Urbanist tracking-tight">Message from our advisor</h2>
          
          <p className="text-gray-700 mb-4">
            I am pleased to extend my best wishes to Dragon Academy, which has been instrumental 
            in preparing students for B.E., B.Arch., and B.Sc. CSIT entrance exams. As the Campus 
            Chief of Patan Multiple Campus, I commend the academy's dedication to 
            academic excellence and skill development.
          </p>
          
          <p className="text-gray-700 mb-4">
            With a team of highly experienced educators and mentors, Dragon Academy ensures that 
            students receive the best guidance and support. With the right effort and determination, students can achieve their goals and make meaningful contributions to society. I encourage all 
            learners to stay committed and get benefited from the opportunities provided.
          </p>
          

        </div>
        
        {/* Advisor Image and Title - Right Side */}
        <div className="bg-[#010794] text-white p-6 md:w-1/3 flex flex-col items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gray-300 mb-4 overflow-hidden">
            {/* Placeholder for advisor image */}
            <img 
              src="/images/teachers/advisor.png" 
              alt="Advisor" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-xl font-bold mb-1 text-center">Dipak Subedi</h3>
          <p className="text-center text-indigo-200">Assistant Professor of Physics</p>
        </div>
      </div>
    </div>
  );
}