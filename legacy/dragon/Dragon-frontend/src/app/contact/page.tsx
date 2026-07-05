"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Contact from "./contact";

const page = () => {
  return (
    <div>
      <Navbar />
<Contact></Contact>
      <Footer />
    </div>
  );
};

export default page;
