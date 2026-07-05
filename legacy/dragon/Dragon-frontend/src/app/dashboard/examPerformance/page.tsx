"use client"
import { useState, useEffect } from 'react';
import {
  fetchBatches,
  fetchBatchPerformanceSummary,
  fetchBatchAllPerformance,
  checkPreviousRecords,
  cleanupPreviousRecords
} from '../../../../apiCalls/fetchExamPerformance';

import BatchList from '../../../../components/ExamPerformanceComponents/batchList';
import PerformanceSummary from '../../../../components/ExamPerformanceComponents/performanceSummary';
import PerformanceDetails from '../../../../components/ExamPerformanceComponents/performanceDetails';
import PerformanceComparison from '../../../../components/ExamPerformanceComponents/performanceComparison';
import TopPerformers from '../../../../components/ExamPerformanceComponents/topPerformers';
import ReportGenerator from '../../../../components/ExamPerformanceComponents/reportGeneration';
import ConfirmationDialog from '../../../../components/ExamPerformanceComponents/confirmationDialogue';

import {
  Batch,
  PerformanceSummary as PerformanceSummaryType,
  PerformanceDetails as PerformanceDetailsType,
  PaginationState,
  RecurringTopPerformer
} from '../../../../components/ExamPerformanceComponents/examPerformanceTypes';
import { formatProgressionData, identifyRecurringTopPerformers } from '../../../../components/ExamPerformanceComponents/examPerofrmanceUtil';

const getCurrentAcademicYear = (): string => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const academicYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;
  return `${academicYearStart}-${academicYearStart + 1}`;
};

const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();

export default function ExamDashboard() {
  // Batch state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    hasNext: false,
    hasPrev: false,
    totalPages: 1
  });
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Performance state
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceSummaryType[]>([]);
  const [allPerformanceData, setAllPerformanceData] = useState<PerformanceDetailsType[]>([]);
  const [performanceDetails, setPerformanceDetails] = useState<PerformanceDetailsType[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<PerformanceDetailsType | null>(null);
  const [academicYear, setAcademicYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [viewMode, setViewMode] = useState<'yearly' | 'all'>('yearly');
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Report state
  const [hasPreviousRecords, setHasPreviousRecords] = useState(false);
  const [exportYear, setExportYear] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Analysis state
  const [progressionData, setProgressionData] = useState<any[]>([]);
  const [recurringTopPerformers, setRecurringTopPerformers] = useState<RecurringTopPerformer[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showTopPerformers, setShowTopPerformers] = useState(false);

  // Fetch batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true);
        const data = await fetchBatches({
          page: pagination.page,
          limit: pagination.limit
        });
        setBatches(data.data);
        setPagination({
          page: data.meta.page,
          limit: data.meta.limit,
          total: data.meta.total,
          hasNext: data.meta.hasNext,
          hasPrev: data.meta.hasPrev,
          totalPages: data.meta.totalPages
        });
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setLoadingBatches(false);
      }
    };

    loadBatches();
  }, [pagination.page]);

  // Check for previous records
  useEffect(() => {
    const checkRecords = async () => {
      try {
        const result = await checkPreviousRecords(CURRENT_ACADEMIC_YEAR);
        setHasPreviousRecords(result.hasPreviousRecords);
        const years = allPerformanceData.length > 0
          ? Array.from(new Set(allPerformanceData.map(p => p.academicYear)))
          : [CURRENT_ACADEMIC_YEAR];
        setAvailableYears(years);
      } catch (error) {
        console.error('Error checking previous records:', error);
      }
    };

    checkRecords();
  }, [academicYear, allPerformanceData]);

  // Load performance data
  useEffect(() => {
    if (!selectedBatch) return;

    const loadPerformanceData = async () => {
      try {
        setLoadingPerformance(true);
        let data: PerformanceDetailsType[];

        if (viewMode === 'yearly') {
          data = await fetchBatchPerformanceSummary(selectedBatch, academicYear);
          setPerformanceData(data as PerformanceSummaryType[]);
        } else {
          data = await fetchBatchAllPerformance(selectedBatch);
          setAllPerformanceData(data as PerformanceDetailsType[]);
        }

        setPerformanceDetails(data);
        setProgressionData(formatProgressionData(data));
        setRecurringTopPerformers(identifyRecurringTopPerformers(data));
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setLoadingPerformance(false);
      }
    };

    loadPerformanceData();
  }, [selectedBatch, academicYear, viewMode]);

  const handleSelectBatch = (batchId: string) => {
    setSelectedBatch(batchId);
    setSelectedPerformance(null);
    setCompareMode(false);
    setShowTopPerformers(false);
    setShowReport(false);
  };

  const handlePerformanceClick = async (performanceId: string) => {
    try {
      setLoadingPerformance(true);
      const selected = performanceDetails.find(p => p._id === performanceId);
      if (selected) {
        setSelectedPerformance(selected);
      }
      setCompareMode(false);
      setShowTopPerformers(false);
      setShowReport(false);
    } catch (error) {
      console.error('Error fetching performance details:', error);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleExportClick = () => {
    setExportYear(CURRENT_ACADEMIC_YEAR);
    setShowExportDialog(true);
  };

  const handleExportData = async () => {
    if (!exportYear || generatingReport) return;
    try {
      setExporting(true);
      setGeneratingReport(true);
      setShowExportDialog(false);
      setShowReport(true);
    } catch (error) {
      console.error('Error preparing export:', error);
      setShowReport(false);
      setGeneratingReport(false);
    } finally {
      setExporting(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupPreviousRecords(exportYear);
      setShowDeleteConfirm(false);
      setExportYear('');
      setShowReport(false);
      alert(`Successfully cleaned up records for ${exportYear}`);
    } catch (error) {
      console.error('Error cleaning up records:', error);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedPerformance(null);
    setShowTopPerformers(false);
    setShowReport(false);
  };

  const toggleTopPerformers = () => {
    setShowTopPerformers(!showTopPerformers);
    setSelectedPerformance(null);
    setCompareMode(false);
    setShowReport(false);
  };

  const handleReportComplete = () => {
    setGeneratingReport(false);
    setShowDeleteConfirm(true);
    setShowReport(false);
  };

  const handleCancelExport = () => {
    setShowExportDialog(false);
    setExportYear('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Batch Performance Dashboard</h1>
        <p className="text-gray-600">Track and analyze batch performance over time</p>
      </header>

      {hasPreviousRecords && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Performance data is available for export. Generate a comprehensive report to analyze batch performance.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={handleExportClick}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Performance Report</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                This will generate a comprehensive performance report for {exportYear}.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                <p className="text-sm text-yellow-700">
                  Note: This process may take a moment to compile all performance data.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelExport}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {exporting ? 'Preparing...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmationDialog
          title="Data Export Complete"
          message={`The report for ${exportYear} has been successfully generated. Would you like to clean up these records?`}
          confirmText="Delete Records"
          cancelText="Keep Data"
          onConfirm={handleCleanup}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BatchList
          batches={batches}
          selectedBatch={selectedBatch}
          pagination={pagination}
          loading={loadingBatches}
          onSelectBatch={handleSelectBatch}
          onPageChange={handlePageChange}
        />

        <div className="lg:col-span-2">
          {showReport ? (
            <ReportGenerator
              academicYear={exportYear}
              onComplete={handleReportComplete}
              key={`report-${exportYear}-${Date.now()}`}
            />
          ) : selectedPerformance ? (
            <PerformanceDetails
              performance={selectedPerformance}
              onBack={() => setSelectedPerformance(null)}
            />
          ) : compareMode && progressionData.length > 0 ? (
            <PerformanceComparison
              progressionData={progressionData}
            />
          ) : showTopPerformers && recurringTopPerformers.length > 0 ? (
            <TopPerformers
              topPerformers={recurringTopPerformers}
            />
          ) : (
            <PerformanceSummary
              selectedBatch={selectedBatch}
              performanceData={viewMode === 'yearly' ? performanceData : allPerformanceData}
              academicYear={academicYear}
              viewMode={viewMode}
              loading={loadingPerformance}
              onPerformanceClick={handlePerformanceClick}
              onChangeAcademicYear={setAcademicYear}
              onChangeViewMode={setViewMode}
              onToggleCompareMode={toggleCompareMode}
              onToggleTopPerformers={toggleTopPerformers}
              compareMode={compareMode}
              showTopPerformers={showTopPerformers}
            />
          )}
        </div>
      </div>
    </div>
  );
}