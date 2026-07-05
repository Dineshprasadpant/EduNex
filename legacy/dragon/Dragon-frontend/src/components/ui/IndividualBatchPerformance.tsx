// Individual Batch Performance Component
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BatchPerformanceProps {
  batchId: string;
  batchName: string;
  academicYear: string;
}

interface PerformanceMetric {
  examId: string;
  examTitle: string;
  percentage: number;
  date: string;
  totalStudents: number;
  passRate: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  overallPercentage: number;
  examResults: {
    examId: string;
    examTitle: string;
    score: number;
    date: string;
  }[];
}

interface BatchPerformanceData {
  overallStats: {
    averagePerformance: number;
    highestPerformance: number;
    lowestPerformance: number;
    examCount: number;
    passRate: number;
  };
  performanceOverTime: PerformanceMetric[];
  topPerformers: StudentPerformance[];
  performanceDistribution: {
    range: string;
    count: number;
  }[];
}

// Mock function for fetching batch performance data
// In a real application, replace this with an actual API call
const fetchBatchPerformanceData = async (
  batchId: string, 
  academicYear: string
): Promise<BatchPerformanceData> => {
  // This is a placeholder. In reality, you would fetch this data from your API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        overallStats: {
          averagePerformance: 78.5,
          highestPerformance: 92.3,
          lowestPerformance: 65.2,
          examCount: 5,
          passRate: 87.5
        },
        performanceOverTime: [
          { examId: 'e1', examTitle: 'Midterm 1', percentage: 76.2, date: '2023-09-15', totalStudents: 45, passRate: 82.2 },
          { examId: 'e2', examTitle: 'Midterm 2', percentage: 79.5, date: '2023-10-20', totalStudents: 44, passRate: 86.4 },
          { examId: 'e3', examTitle: 'Quiz 1', percentage: 81.3, date: '2023-11-05', totalStudents: 46, passRate: 89.1 },
          { examId: 'e4', examTitle: 'Quiz 2', percentage: 75.8, date: '2023-11-25', totalStudents: 45, passRate: 84.4 },
          { examId: 'e5', examTitle: 'Final Exam', percentage: 80.2, date: '2023-12-15', totalStudents: 46, passRate: 91.3 }
        ],
        topPerformers: [
          {
            studentId: 's1',
            studentName: 'John Doe',
            overallPercentage: 92.3,
            examResults: [
              { examId: 'e1', examTitle: 'Midterm 1', score: 89.5, date: '2023-09-15' },
              { examId: 'e2', examTitle: 'Midterm 2', score: 94.2, date: '2023-10-20' },
              { examId: 'e3', examTitle: 'Quiz 1', score: 90.7, date: '2023-11-05' },
              { examId: 'e4', examTitle: 'Quiz 2', score: 93.8, date: '2023-11-25' },
              { examId: 'e5', examTitle: 'Final Exam', score: 93.3, date: '2023-12-15' }
            ]
          },
          {
            studentId: 's2',
            studentName: 'Jane Smith',
            overallPercentage: 89.7,
            examResults: [
              { examId: 'e1', examTitle: 'Midterm 1', score: 87.2, date: '2023-09-15' },
              { examId: 'e2', examTitle: 'Midterm 2', score: 92.1, date: '2023-10-20' },
              { examId: 'e3', examTitle: 'Quiz 1', score: 88.9, date: '2023-11-05' },
              { examId: 'e4', examTitle: 'Quiz 2', score: 90.2, date: '2023-11-25' },
              { examId: 'e5', examTitle: 'Final Exam', score: 90.1, date: '2023-12-15' }
            ]
          },
          {
            studentId: 's3',
            studentName: 'Mike Johnson',
            overallPercentage: 87.9,
            examResults: [
              { examId: 'e1', examTitle: 'Midterm 1', score: 85.5, date: '2023-09-15' },
              { examId: 'e2', examTitle: 'Midterm 2', score: 89.8, date: '2023-10-20' },
              { examId: 'e3', examTitle: 'Quiz 1', score: 86.4, date: '2023-11-05' },
              { examId: 'e4', examTitle: 'Quiz 2', score: 89.1, date: '2023-11-25' },
              { examId: 'e5', examTitle: 'Final Exam', score: 88.7, date: '2023-12-15' }
            ]
          }
        ],
        performanceDistribution: [
          { range: '90-100', count: 8 },
          { range: '80-89', count: 19 },
          { range: '70-79', count: 12 },
          { range: '60-69', count: 5 },
          { range: 'Below 60', count: 2 }
        ]
      });
    }, 800);
  });
};

const IndividualBatchPerformance: React.FC<BatchPerformanceProps> = ({ batchId, batchName, academicYear }) => {
  const [performanceData, setPerformanceData] = useState<BatchPerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const loadBatchPerformance = async () => {
      setLoading(true);
      try {
        const data = await fetchBatchPerformanceData(batchId, academicYear);
        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching batch performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBatchPerformance();
  }, [batchId, academicYear]);

  const handleStudentClick = (student: StudentPerformance) => {
    setSelectedStudent(student);
    setActiveSection('studentDetail');
  };

  const handleBackToTopPerformers = () => {
    setSelectedStudent(null);
    setActiveSection('topPerformers');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No performance data available for this batch.
      </div>
    );
  }

  // Navigation tabs
  const renderNavTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveSection('overview')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeSection === 'overview'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('performanceTrend')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeSection === 'performanceTrend'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Performance Trend
        </button>
        <button
          onClick={() => setActiveSection('topPerformers')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeSection === 'topPerformers' || activeSection === 'studentDetail'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Top Performers
        </button>
        <button
          onClick={() => setActiveSection('distribution')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeSection === 'distribution'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Distribution
        </button>
      </nav>
    </div>
  );

  // Overview section
  const renderOverview = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Performance</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{performanceData.overallStats.averagePerformance.toFixed(1)}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pass Rate</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{performanceData.overallStats.passRate.toFixed(1)}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Exams Conducted</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{performanceData.overallStats.examCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Range</h3>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Highest</span>
          <span className="text-sm font-medium text-gray-700">{performanceData.overallStats.highestPerformance.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${performanceData.overallStats.highestPerformance}%` }}></div>
        </div>

        <div className="flex items-center justify-between mb-1 mt-4">
          <span className="text-sm font-medium text-gray-700">Average</span>
          <span className="text-sm font-medium text-gray-700">{performanceData.overallStats.averagePerformance.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${performanceData.overallStats.averagePerformance}%` }}></div>
        </div>

        <div className="flex items-center justify-between mb-1 mt-4">
          <span className="text-sm font-medium text-gray-700">Lowest</span>
          <span className="text-sm font-medium text-gray-700">{performanceData.overallStats.lowestPerformance.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${performanceData.overallStats.lowestPerformance}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Exam Results</h3>
        </div>
        <div className="bg-gray-50 px-4 py-5 sm:p-6">
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {performanceData.performanceOverTime.slice(0, 3).map((exam, index) => (
                <li key={exam.examId} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                        exam.percentage >= 80 ? 'bg-green-100' : exam.percentage >= 70 ? 'bg-blue-100' : 'bg-yellow-100'
                      }`}>
                        <span className={`text-sm font-medium leading-none ${
                          exam.percentage >= 80 ? 'text-green-800' : exam.percentage >= 70 ? 'text-blue-800' : 'text-yellow-800'
                        }`}>{index + 1}</span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{exam.examTitle}</p>
                      <p className="text-sm text-gray-500">{exam.date}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exam.percentage >= 80 ? 'bg-green-100 text-green-800' : exam.percentage >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setActiveSection('performanceTrend')}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Exams
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Performance trend section
  const renderPerformanceTrend = () => (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData.performanceOverTime}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="examTitle" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Performance']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Performance"
              />
              <Line
                type="monotone"
                dataKey="passRate"
                stroke="#82ca9d"
                name="Pass Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Exam Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.performanceOverTime.map((exam) => (
                <tr key={exam.examId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.examTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.totalStudents}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      exam.percentage >= 80 ? 'bg-green-100 text-green-800' : exam.percentage >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      exam.passRate >= 80 ? 'bg-green-100 text-green-800' : exam.passRate >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.passRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Top performers section
  const renderTopPerformers = () => (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Top Performing Students</h3>
          <p className="mt-1 text-sm text-gray-500">Students who have demonstrated excellence throughout the academic year.</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {performanceData.topPerformers.map((student) => (
            <li key={student.studentId} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" onClick={() => handleStudentClick(student)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium text-sm">{student.studentName.split(' ').map(name => name[0]).join('')}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                    <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                  </div>
                </div>
                <div>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {student.overallPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Student detail section
  const renderStudentDetail = () => {
    if (!selectedStudent) return null;

    return (
      <div>
        <div className="mb-4">
          <button
            onClick={handleBackToTopPerformers}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Top Performers
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedStudent.studentName}</h3>
                <p className="text-sm text-gray-500">Student ID: {selectedStudent.studentId}</p>
              </div>
              <div>
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Overall: {selectedStudent.overallPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">Performance by Exam</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedStudent.examResults}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="examTitle"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Score']} />
                  <Legend />
                  <Bar dataKey="score" name="Score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8">
              <h4 className="text-base font-medium text-gray-900 mb-4">Exam Details</h4>
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedStudent.examResults.map((exam) => (
                      <tr key={exam.examId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exam.examTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.score.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  exam.score >= 90 ? 'bg-green-500' : 
                                  exam.score >= 80 ? 'bg-blue-500' : 
                                  exam.score >= 70 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`} 
                                style={{ width: `${exam.score}%` }}
                              ></div>
                            </div>
                            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                              exam.score >= 90 ? 'bg-green-100 text-green-800' : 
                              exam.score >= 80 ? 'bg-blue-100 text-blue-800' : 
                              exam.score >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {exam.score >= 90 ? 'Excellent' : 
                               exam.score >= 80 ? 'Very Good' : 
                               exam.score >= 70 ? 'Good' : 
                               exam.score >= 60 ? 'Satisfactory' : 
                               'Needs Improvement'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Distribution section
  const renderDistribution = () => (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={performanceData.performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="range"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {performanceData.performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} students`, props.payload.range]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <h4 className="text-base font-medium text-gray-900 mb-3">Score Distribution</h4>
          <div className="space-y-4">
            {performanceData.performanceDistribution.map((range, index) => (
              <div key={range.range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{range.range}%</span>
                  <span className="text-sm font-medium text-gray-700">{range.count} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${(range.count / performanceData.performanceDistribution.reduce((a, b) => a + b.count, 0)) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Performance Insights</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Top Performers (90-100%)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {performanceData.performanceDistribution.find(d => d.range === '90-100')?.count || 0} students 
                ({((performanceData.performanceDistribution.find(d => d.range === '90-100')?.count || 0) / 
                  performanceData.performanceDistribution.reduce((a, b) => a + b.count, 0) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Good Performers (80-89%)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {performanceData.performanceDistribution.find(d => d.range === '80-89')?.count || 0} students
                ({((performanceData.performanceDistribution.find(d => d.range === '80-89')?.count || 0) / 
                  performanceData.performanceDistribution.reduce((a, b) => a + b.count, 0) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Average Performers (70-79%)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {performanceData.performanceDistribution.find(d => d.range === '70-79')?.count || 0} students
                ({((performanceData.performanceDistribution.find(d => d.range === '70-79')?.count || 0) / 
                  performanceData.performanceDistribution.reduce((a, b) => a + b.count, 0) * 100).toFixed(1)}%)
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Below Average (Below 70%)</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(performanceData.performanceDistribution.find(d => d.range === '60-69')?.count || 0) + 
                 (performanceData.performanceDistribution.find(d => d.range === 'Below 60')?.count || 0)} students
                ({(((performanceData.performanceDistribution.find(d => d.range === '60-69')?.count || 0) + 
                   (performanceData.performanceDistribution.find(d => d.range === 'Below 60')?.count || 0)) / 
                  performanceData.performanceDistribution.reduce((a, b) => a + b.count, 0) * 100).toFixed(1)}%)
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{batchName}</h2>
          <p className="text-gray-600">Academic Year: {academicYear}</p>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {performanceData.overallStats.averagePerformance.toFixed(1)}% Avg. Performance
          </span>
        </div>
      </div>

      {renderNavTabs()}

      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'performanceTrend' && renderPerformanceTrend()}
      {activeSection === 'topPerformers' && !selectedStudent && renderTopPerformers()}
      {activeSection === 'studentDetail' && selectedStudent && renderStudentDetail()}
      {activeSection === 'distribution' && renderDistribution()}
    </div>
  );
};

export default IndividualBatchPerformance;