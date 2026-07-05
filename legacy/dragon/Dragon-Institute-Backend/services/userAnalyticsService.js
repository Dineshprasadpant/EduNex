import {
    findAnalyticsByMonthYear,
    incrementVisits,
    updateUtmSource,
    incrementSubscribers,
    incrementEnrollment,
    getMonthlyData,
    getYearlyData,
    getAllData
  } from '../repository/userAnalyticsRepository.js';
  
  export const trackVisit = async (month, year, source, isNewVisitor) => {
    // First update visits/visitors
    const result = await incrementVisits(month, year, isNewVisitor);
    console.log(result, source, isNewVisitor)
    
    // Then update UTM source if provided
    if (result && source && isNewVisitor) {
      return await updateUtmSource(month, year, source);
    }
    return result;
  };
  
  export const trackSubscriber = async (month, year) => {
    return await incrementSubscribers(month, year);
  };
  
  export const trackEnrollment = async (month, year, planType) => {
    const validPlans = ['free', 'half', 'full'];
    if (!validPlans.includes(planType)) {
      throw new Error('Invalid plan type');
    }
    return await incrementEnrollment(month, year, planType);
  };
  
  export const fetchMonthlyData = async (month, year) => {
    return await getMonthlyData(month, year);
  };
  
  export const fetchYearlyData = async (year) => {
    return await getYearlyData(year);
  };
  
  export const fetchAllData = async () => {
    return await getAllData();
  };