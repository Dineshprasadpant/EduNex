import React, { useState, useEffect, useRef } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { fetchPreviousYearRecords } from '../../apiCalls/fetchExamPerformance';
import { generatePdfReport } from './examPerofrmanceUtil';
import { ExportRecordResponse } from './examPerformanceTypes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface ReportGeneratorProps {
  academicYear: string;
  onComplete: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ academicYear, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportRecordResponse | null>(null);
  const reportGenerated = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (reportGenerated.current) return;

      try {
        setLoading(true);
        setProgress(10);

        const initialData = await fetchPreviousYearRecords(academicYear, 1, 50);
        setProgress(40);

        setExportData(initialData);
        setProgress(80);

        await generatePdfReport(initialData, academicYear);
        setProgress(100);

        reportGenerated.current = true;

        setTimeout(() => {
          onComplete();
        }, 1000);
      } catch (err) {
        console.error('Error generating report:', err);
        setError('Failed to generate report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      reportGenerated.current = false;
    };
  }, [academicYear, onComplete]);

  // Generate summary statistics if data is available
  const summaryStats = exportData ? {
    totalExams: exportData.records.length,
    avgPerformance: exportData.records.reduce((sum, record) => sum + record.overallPercentage, 0) / exportData.records.length,
    totalExaminees: exportData.records.reduce((sum, record) => sum + record.numberOfExaminees, 0),
    uniqueBatches: new Set(exportData.records.map(r => r.batchId._id)).size
  } : null;

  // Prepare data for charts
  const prepareChartData = () => {
    if (!exportData) return null;
    const examLabels = exportData.records.map(record =>
      record.examId && record.examId.title ? record.examId.title : "Unknown Exam"
    );

    const examPerformance = exportData.records.map(record => record.overallPercentage);

    // Batch performance chart
    const batchLabels = Array.from(new Set(exportData.records.map(record => record.batchId.batch_name)));
    const batchPerformance = batchLabels.map(batch => {
      const batchRecords = exportData.records.filter(record => record.batchId.batch_name === batch);
      return batchRecords.reduce((sum, record) => sum + record.overallPercentage, 0) / batchRecords.length;
    });

    // Top performers data
    const allTopPerformers = exportData.records.flatMap(record =>
      record.highestScorers.map(scorer => ({
        name: scorer.studentId?.fullname || "No Name",
        percentage: scorer.percentage,
        exam: record.examId?.title || "Unknown Exam",
        batch: record.batchId?.batch_name || "Unknown Batch"
      }))
    );


    return {
      examPerformance: {
        labels: examLabels,
        datasets: [
          {
            label: 'Average Performance (%)',
            data: examPerformance,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      batchPerformance: {
        labels: batchLabels,
        datasets: [
          {
            label: 'Average Performance (%)',
            data: batchPerformance,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      topPerformers: allTopPerformers.sort((a, b) => b.percentage - a.percentage).slice(0, 5)
    };
  };

  const chartData = prepareChartData();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {loading ? 'Generating Performance Report' : 'Report Generation Complete'}
        </h3>
      </div>

      <div className="p-6">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : loading ? (
          <>
            <div className="mb-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-blue-600">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                </div>
              </div>
            </div>

            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">{getProgressMessage(progress)}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Report successfully generated and downloaded!</p>
                </div>
              </div>
            </div>

            {summaryStats && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-600 font-medium">Total Exams</p>
                    <p className="text-2xl font-bold text-blue-700">{summaryStats.totalExams}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-600 font-medium">Avg. Performance</p>
                    <p className="text-2xl font-bold text-green-700">{summaryStats.avgPerformance.toFixed(2)}%</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-purple-600 font-medium">Total Examinees</p>
                    <p className="text-2xl font-bold text-purple-700">{summaryStats.totalExaminees}</p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-indigo-600 font-medium">Unique Batches</p>
                    <p className="text-2xl font-bold text-indigo-700">{summaryStats.uniqueBatches}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Exam Performance Chart */}
            {chartData && chartData.examPerformance.labels.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Exam Performance</h4>
                <div className="h-64">
                  <Bar
                    data={chartData.examPerformance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Average Performance by Exam',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Batch Performance Chart */}
            {chartData && chartData.batchPerformance.labels.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Batch Performance</h4>
                <div className="h-64">
                  <Line
                    data={chartData.batchPerformance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Average Performance by Batch',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Top Performers Section */}
            {chartData && chartData.topPerformers.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData.topPerformers.map((performer, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performer.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performer.percentage.toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performer.exam}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{performer.batch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Exam Records */}
            {exportData && exportData.records.length > 0 && (
              <div className="mb-6 p-4 border rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Exam Records</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examinees</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Scorers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportData.records.map((record, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.examId?.title || "Unknown Exam"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.batchId.batch_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.overallPercentage.toFixed(2)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.numberOfExaminees}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <ul className="list-disc pl-5">
                              {record.highestScorers.map((scorer, i) => (
                                <li key={i}>
                                  {scorer.studentId?.fullname} ({scorer.percentage.toFixed(2)}%)
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">What's Included in Your Report?</h4>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Comprehensive performance statistics for {academicYear}</li>
                <li>Batch performance comparison table</li>
                <li>Top performers analysis</li>
                <li>Performance trends over time</li>
                <li>Detailed exam-by-exam breakdown</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You will now be asked if you want to clean up the exported data from the system.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function getProgressMessage(progress: number): string {
  if (progress < 20) {
    return "Fetching performance records...";
  } else if (progress < 50) {
    return "Analyzing performance data...";
  } else if (progress < 80) {
    return "Generating performance charts and tables...";
  } else {
    return "Finalizing your PDF report...";
  }
}

export default ReportGenerator;