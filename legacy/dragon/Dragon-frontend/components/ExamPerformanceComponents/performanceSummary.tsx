import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceDetails, PerformanceSummary as PerformanceSummaryType } from './examPerformanceTypes';
import { formatChartData } from './examPerofrmanceUtil';

interface PerformanceSummaryProps {
  selectedBatch: string | null;
  performanceData: PerformanceSummaryType[] | PerformanceDetails[];
  academicYear: string;
  viewMode: 'yearly' | 'all';
  loading: boolean;
  onPerformanceClick: (performanceId: string) => void;
  onChangeAcademicYear: (year: string) => void;
  onChangeViewMode: (mode: 'yearly' | 'all') => void;
  onToggleCompareMode: () => void;
  onToggleTopPerformers: () => void;
  compareMode: boolean;
  showTopPerformers: boolean;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  selectedBatch,
  performanceData,
  academicYear,
  viewMode,
  loading,
  onPerformanceClick,
  onChangeAcademicYear,
  onChangeViewMode,
  onToggleCompareMode,
  onToggleTopPerformers,
  compareMode,
  showTopPerformers
}) => {
  // Type guard to check if we have PerformanceSummaryType data
  const isPerformanceSummary = (data: any): data is PerformanceSummaryType => {
    return data && 'batchId' in data;
  };

  // Format data for display based on the type
  const formattedData = React.useMemo(() => {
    if (performanceData.length === 0) return [];

    if (isPerformanceSummary(performanceData[0])) {
      return formatChartData(performanceData as PerformanceSummaryType[]);
    } else {
      return formatChartData(performanceData as PerformanceDetails[]);
    }
  }, [performanceData]);

  // Generate academic years for dropdown (5 years back and 5 years forward)
  const academicYearOptions = React.useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const years = [];

    for (let i = -5; i <= 5; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }

    return years.reverse();
  }, []);

  // Render performance items with proper type checking
  const renderPerformanceItems = () => {
    return performanceData.map((performance: PerformanceSummaryType | PerformanceDetails) => {
      // Type-safe property access
      const id = performance._id; // Both types have _id
      const examTitle = isPerformanceSummary(performance) && performance.examId
        ? performance.examId.title
        : 'Overall Performance';
      const percentage = performance.overallPercentage;
      const examinees = performance.numberOfExaminees;
      const date = new Date(performance.createdAt).toLocaleDateString();
      const academicYearValue = isPerformanceSummary(performance)
        ? performance.academicYear
        : academicYear;

      return (
        <div
          key={id}
          onClick={() => onPerformanceClick(id)}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">{examTitle}</h5>
              {viewMode === 'all' && (
                <p className="text-sm text-gray-500">{academicYearValue}</p>
              )}
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${percentage >= 75 ? 'bg-green-100 text-green-800' : percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {percentage.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>{examinees} examinees</span>
            <span>{date}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {selectedBatch ? `Performance Data` : 'Select a batch to view performance'}
          </h3>
          {selectedBatch && (
            <div className="flex space-x-2">
              <select
                value={academicYear}
                onChange={(e) => onChangeAcademicYear(e.target.value)}
                className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {academicYearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => onChangeViewMode('yearly')}
                  className={`relative inline-flex items-center px-3 py-1.5 rounded-l-md border border-gray-300 text-sm font-medium ${viewMode === 'yearly' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => onChangeViewMode('all')}
                  className={`relative inline-flex items-center px-3 py-1.5 rounded-r-md border border-gray-300 text-sm font-medium ${viewMode === 'all' ? 'bg-blue-50 text-blue-600 border-blue-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  All Time
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedBatch && (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onToggleCompareMode}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 ${compareMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              {compareMode ? 'Hide Comparison' : 'Compare Progress'}
            </button>
            <button
              onClick={onToggleTopPerformers}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 ${showTopPerformers ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              {showTopPerformers ? 'Hide Top Performers' : 'Recurring Top Performers'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedBatch ? (
        <div className="p-8 text-center text-gray-500">
          Please select a batch to view performance data
        </div>
      ) : formattedData.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No performance data available for the selected batch
        </div>
      ) : (
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {viewMode === 'yearly' ? `Performance for ${academicYear}` : 'All Performance Data'}
          </h4>

          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'percentage' ? `${value}%` : value,
                    name === 'percentage' ? 'Percentage' : 'Number of Examinees'
                  ]}
                />
                <Legend />
                <Bar dataKey="percentage" fill="#8884d8" name="Percentage" />
                <Bar dataKey="examinees" fill="#82ca9d" name="Examinees" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {renderPerformanceItems()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceSummary;