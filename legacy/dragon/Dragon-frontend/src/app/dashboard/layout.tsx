"use client"; // Mark this as a Client Component in Next.js

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import DashboardSidebar from "./dashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Check if the user is authenticated
  useEffect(() => {
    const token = Cookies.get("token");
    const user = Cookies.get("user") ? JSON.parse(Cookies.get("user")!) : null;

    if (!token || !user) {
      // Redirect to login if the user is not authenticated
      router.push("/login");
    }
  }, [router]);

  // Render the DashboardSidebar and children if authenticated
  return (
    <DashboardSidebar>
      {children}
    </DashboardSidebar>
  );
}