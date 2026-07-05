
"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Allcourses from "@/components/courses/allcourses";

const page = () => {
  return (
    <div>
      <Navbar />
      <Allcourses />
      <Footer />
    </div>
  );
};

export default page;
