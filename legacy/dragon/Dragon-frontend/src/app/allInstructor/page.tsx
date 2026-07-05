"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Instructor from "./allinstructor";

const page = () => {
  return (
    <div>
      <Navbar />
<Instructor></Instructor>
      <Footer />
    </div>
  );
};

export default page;
