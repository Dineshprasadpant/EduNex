import Analytics from '../models/userAnalytics.js';

export const findAnalyticsByMonthYear = async (month, year) => {
  return await Analytics.findOne({ month, year });
};

export const createNewMonthRecord = async (month, year) => {
  return await Analytics.create({ month, year });
};

export const updateOrCreateMonthRecord = async (month, year, updateData) => {
  return await Analytics.findOneAndUpdate(
    { month, year },
    updateData,
    { new: true, upsert: true }
  );
};

export const incrementVisits = async (month, year, isNewVisitor) => {
  const update = {
    $inc: { totalVisits: 1 }
  };

  if (isNewVisitor) {
    update.$inc.totalVisitors = 1;
  }

  return await Analytics.findOneAndUpdate(
    { month, year },
    update,
    { new: true, upsert: true }
  );
};

export const updateUtmSource = async (month, year, source) => {
    // First try to increment existing source
    const updated = await Analytics.findOneAndUpdate(
      { month, year, 'utmSources.source': source },
      { $inc: { 'utmSources.$.users': 1 } },
      { new: true }
    );
  
    // If no document was found with that source, add the new source
    if (!updated) {
      return await Analytics.findOneAndUpdate(
        { month, year },
        { 
          $push: { utmSources: { source, users: 1 } },
          $setOnInsert: { 
            totalVisitors: 0, 
            totalVisits: 0,
            subscribersGain: 0,
            enrolledPlan: { free: 0, half: 0, full: 0 }
          }
        },
        { 
          new: true,
          upsert: true 
        }
      );
    }
  
    return updated;
  };

  export const incrementSubscribers = async (month, year) => {
    const result = await Analytics.updateOne(
      { month, year },
      { $inc: { subscribersGain: 1 } },
      { upsert: true }
    );
  
    return result.modifiedCount;
  };
  

export const incrementEnrollment = async (month, year, planType) => {
  const field = `enrolledPlan.${planType}`;
  return await Analytics.findOneAndUpdate(
    { month, year },
    { $inc: { [field]: 1 } },
    { new: true, upsert: true }
  );
};

export const getMonthlyData = async (month, year) => {
  return await Analytics.findOne({ month, year });
};

export const getYearlyData = async (year) => {
  return await Analytics.find({ year }).sort({ month: 1 });
};

export const getAllData = async () => {
  return await Analytics.find().sort({ year: 1, month: 1 });
};