
"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Results from "@/components/results/result";

const page = () => {
  return (
    <div>
      <Navbar />
      <Results/>
      <Footer />
    </div>
  );
};

export default page;
