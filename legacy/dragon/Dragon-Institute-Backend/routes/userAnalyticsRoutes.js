import { Router } from 'express';
import {
  recordVisit,
  recordSubscriber,
  getMonthlyAnalytics,
  getYearlyAnalytics,
  getAllAnalytics
} from '../controllers/userAnalyticsController.js';
import Analytics from '../models/userAnalytics.js';
import { authenticateToken, isAdmin} from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/visits', recordVisit);
router.post('/subscribers', recordSubscriber);
router.get('/monthly', authenticateToken, isAdmin, getMonthlyAnalytics);
router.get('/yearly', authenticateToken, isAdmin, getYearlyAnalytics);
router.get('/', authenticateToken, isAdmin, getAllAnalytics);
router.post("/postdataAnalytics", async (req, res) => {
  try {
    const {
      isNewVisitor = false,
      source = null,
      incrementSubscriber = false,
      enrollmentPlan = null,
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear()
    } = req.body;

    // Validate enrollment plan
    if (enrollmentPlan && !['free', 'half', 'full'].includes(enrollmentPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enrollment plan. Must be one of: free, half, full'
      });
    }

    // Prepare base update
    const update = {
      $setOnInsert: {
        totalVisitors: isNewVisitor ? 1 : 0,
        totalVisits: 1,
        subscribersGain: incrementSubscriber ? 1 : 0,
        enrolledPlan: { 
          free: enrollmentPlan === 'free' ? 1 : 0,
          half: enrollmentPlan === 'half' ? 1 : 0,
          full: enrollmentPlan === 'full' ? 1 : 0
        },
        utmSources: source ? [{ source, users: 1 }] : []
      }
    };

    // For existing documents, use $inc instead
    const incUpdate = {
      $inc: {
        totalVisits: 1,
        ...(isNewVisitor && { totalVisitors: 1 }),
        ...(incrementSubscriber && { subscribersGain: 1 }),
        ...(enrollmentPlan && { [`enrolledPlan.${enrollmentPlan}`]: 1 })
      }
    };

    // Handle UTM source for existing documents
    if (source) {
      const existingRecord = await Analytics.findOne({
        month,
        year,
        'utmSources.source': source
      });

      if (existingRecord) {
        incUpdate.$inc['utmSources.$[elem].users'] = 1;
        incUpdate.arrayFilters = [{ 'elem.source': source }];
      } else {
        incUpdate.$push = { utmSources: { source, users: 1 } };
      }
    }

    // First try to update existing document
    let result = await Analytics.findOneAndUpdate(
      { month, year },
      incUpdate,
      { new: true }
    );

    // If no document exists, create with initial values
    if (!result) {
      result = await Analytics.findOneAndUpdate(
        { month, year },
        update,
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      data: result,
      message: 'Analytics recorded successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


export default router;