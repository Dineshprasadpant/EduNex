import {
  initializePerformanceRecord,
  updateStudentPerformance,
  getPerformanceByYear,
  getPerformanceById,
  getYearlySummary,
  checkForPreviousYearsRecords,
  cleanupPreviousYearsData,
  getAllPerformanceData,
getPreviousYearsData
} from '../services/examPerformanceService.js';

function getCurrentAcademicYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed, so January is 0, February is 1, etc.
  
  // Assuming academic year starts in August/September and runs until next year July
  // Adjust these months based on your specific academic calendar
  if (currentMonth >= 7) { // August onwards (since January is 0, August is 7)
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

export async function handleInitializePerformanceRecord(examData) {
  try {
    const { batches, examId } = examData;
    const academicYear = getCurrentAcademicYear(); 
    const records = [];
    const errors = [];

    for (const batchId of batches) {
      try {
        const record = await initializePerformanceRecord(batchId, academicYear, examId);
        records.push(record);
      } catch (batchError) {
        errors.push({ batchId, error: batchError.message });
      }
    }

    if (records.length !== batches.length) {
      return {
        success: false,
        message: "Could not record some exam performances",
        recordedCount: records.length,
        totalBatches: batches.length,
        errors
      };
    }
    
    return {
      success: true, 
      message: "Successfully recorded the exam performance",
      recordedCount: records.length
    };
  } catch (error) {
    // This will catch any errors in destructuring or other operations
    throw new Error(`Failed to record exam performance: ${error.message}`);
  }
}

export async function handleUpdateStudentPerformance(examDetails) {
  try {
    const { studentId, percentage, examId } = examDetails;
    const updatedRecord = await updateStudentPerformance(
      examId,
      studentId, 
      percentage
    );
    if(!updatedRecord){
      throw new Error(`Failed to record student performance`);
    }
    return {
      success: true, 
      message: "Successfully recorded the student performance",
    };
  } catch (error) {
    throw new Error(`Failed to record student performance: ${error.message}`);
  }
}

export async function handleGetPerformanceByYear(req, res) {
  try {
    const { academicYear, batchId } = req.params;
    const records = await getPerformanceByYear(academicYear, batchId);
    res.json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleGetPerformanceById(req, res) {
  try {
    const { id } = req.params;
    const record = await getPerformanceById(id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleGetYearlySummary(req, res) {
  try {
    const { academicYear, batchId } = req.params;
    const summary = await getYearlySummary(academicYear, batchId);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleCheckPreviousYearsData(req, res) {
  try {
    const { academicYear } = req.params;
    const hasPreviousRecords = await checkForPreviousYearsRecords(academicYear);
    res.json({ hasPreviousRecords });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleCleanupPreviousYearsData(req, res) {
  try {
    const { academicYear } = req.params;
    const result = await cleanupPreviousYearsData(academicYear);
    res.json({
      message: `Deleted ${result.deletedCount} previous years records`,
      academicYear
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getPreviousYearData(req, res) {
  try {
    const { academicYear } = req.params;
    const {page , limit} = req.query;
    const record = await getPreviousYearsData(academicYear, page , limit);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleGetAllPerformanceData(req, res) {
  try {
    const { batchId } = req.params;
    const records = await getAllPerformanceData(batchId);
    res.json(records);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
