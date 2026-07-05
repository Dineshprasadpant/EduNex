"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import About from "@/components/aboutUs/about"
import FAQ from "@/components/aboutUs/FAQ";
import Achievements from '@/components/aboutUs/Achievements';
import Explore from "@/components/aboutUs/exploreourcourses";


const page = () => {
  return (
    <div>
      <Navbar />
      <About />
      <Achievements />
      <Explore />
      <FAQ />
      <Footer />
    </div>
  );
};

export default page;
