"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type DashboardContextType = {
  isDashboardDisabled: boolean;
  disableDashboard: () => void;
  enableDashboard: () => void;
};

const DashboardContext = createContext<DashboardContextType>({
  isDashboardDisabled: false,
  disableDashboard: () => {},
  enableDashboard: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isDashboardDisabled, setIsDashboardDisabled] = useState(false);
  const pathname = usePathname();

  const disableDashboard = () => {
    setIsDashboardDisabled(true);
  };

  const enableDashboard = () => {
    setIsDashboardDisabled(false);
  };

  useEffect(() => {

    const isExamsPage = pathname === '/dashboard/exams';
    if (!isExamsPage) {
      enableDashboard();
    } 
  }, [pathname]);

  return (
    <DashboardContext.Provider value={{ 
      isDashboardDisabled, 
      disableDashboard,
      enableDashboard
    }}>
      {children}
    </DashboardContext.Provider>
  );
}