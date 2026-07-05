import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProgressionDataPoint } from './examPerformanceTypes';

interface PerformanceComparisonProps {
  progressionData: ProgressionDataPoint[];
}

const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({ progressionData }) => {
  // Calculate trend analysis
  const hasEnoughData = progressionData.length >= 2;
  const firstExam = hasEnoughData ? progressionData[0] : null;
  const lastExam = hasEnoughData ? progressionData[progressionData.length - 1] : null;

  const performanceChange = hasEnoughData && lastExam && firstExam
    ? lastExam.percentage - firstExam.percentage
    : 0;

  const trendDescription = hasEnoughData
    ? performanceChange > 0
      ? `Improvement of ${performanceChange.toFixed(2)}% from first to most recent exam.`
      : performanceChange < 0
        ? `Decline of ${Math.abs(performanceChange).toFixed(2)}% from first to most recent exam.`
        : 'No change in overall percentage from first to most recent exam.'
    : 'Insufficient data to analyze performance trends.';

  // Calculate average performance
  const avgPerformance = progressionData.length > 0
    ? progressionData.reduce((sum, item) => sum + item.percentage, 0) / progressionData.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Performance Progress Analysis</h3>
      </div>

      <div className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Progression Over Time</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Average Performance</p>
            <p className="text-2xl font-bold text-blue-700">{avgPerformance.toFixed(2)}%</p>
          </div>

          <div className={`p-4 rounded-lg ${performanceChange > 0 ? 'bg-green-50' : performanceChange < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-sm font-medium 
              ${performanceChange > 0 ? 'text-green-600' : performanceChange < 0 ? 'text-red-600' : 'text-gray-600'}">
              Overall Trend
            </p>
            <p className={`text-2xl font-bold ${performanceChange > 0 ? 'text-green-700' : performanceChange < 0 ? 'text-red-700' : 'text-gray-700'}`}>
              {performanceChange > 0 ? '+' : ''}{performanceChange.toFixed(2)}%
            </p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-600 font-medium">Total Exams</p>
            <p className="text-2xl font-bold text-indigo-700">{progressionData.length}</p>
          </div>
        </div>

        <div className="h-72 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={progressionData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === 'percentage' ? `${value}%` : value,
                  name === 'percentage' ? 'Percentage' : 'Examinees'
                ]}
                labelFormatter={(label) => `Exam: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Percentage"
              />
              <Line
                type="monotone"
                dataKey="examinees"
                stroke="#82ca9d"
                name="Examinees"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h5 className="font-medium text-blue-900 mb-2">Performance Analysis</h5>
          <p className="text-sm text-blue-800">
            This chart visualizes the batch's performance trend over time. Each point represents an exam, showing the overall percentage achieved and the number of examinees who participated.
          </p>
          {hasEnoughData && (
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-900">Performance Change:</p>
              <p className="text-sm text-blue-800">{trendDescription}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h5 className="font-medium text-gray-900">Exam Performance Summary</h5>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Exam</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Percentage</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {progressionData.map((item, index) => {
                  // Calculate change from previous exam
                  const prevPercentage = index > 0 ? progressionData[index - 1].percentage : null;
                  const change = prevPercentage !== null ? item.percentage - prevPercentage : null;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.date}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        {item.percentage.toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                        {change !== null ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${change > 0 ? 'bg-green-100 text-green-800' : change < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;