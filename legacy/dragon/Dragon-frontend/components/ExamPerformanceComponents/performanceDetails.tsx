import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PerformanceDetails as PerformanceDetailsType } from './examPerformanceTypes';

interface PerformanceDetailsProps {
  performance: PerformanceDetailsType;
  onBack: () => void;
}

const PerformanceDetails: React.FC<PerformanceDetailsProps> = ({ performance, onBack }) => {
  // Format top performers data for the chart
  console.log(performance)
  const topPerformersData = performance.highestScorers.map((scorer, index) => ({
    name: `Top ${index + 1}`,
    score: scorer.percentage
  }));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Exam Performance Details</h3>
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
        >
          Back
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Overall Percentage</p>
              <p className="text-2xl font-bold text-blue-600">{performance.overallPercentage.toFixed(2)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Number of Examinees</p>
              <p className="text-2xl font-bold text-green-600">{performance.numberOfExaminees}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">Academic Year: {performance.academicYear}</p>
          <p className="text-sm text-gray-500">Date: {new Date(performance.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Performance Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topPerformersData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                <Legend />
                <Bar dataKey="score" fill="#8884d8" name="Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Top Performers</h4>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Rank</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Student Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {performance.highestScorers.map((scorer, index) => (
                  <tr key={scorer._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{scorer.studentId?.fullname || 'Anonymous'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scorer.percentage >= 90 ? 'bg-green-100 text-green-800' : scorer.percentage >= 75 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {scorer.percentage.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetails;