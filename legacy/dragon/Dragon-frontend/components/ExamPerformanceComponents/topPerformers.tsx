import React from 'react';
import { RecurringTopPerformer } from './examPerformanceTypes';

interface TopPerformersProps {
  topPerformers: RecurringTopPerformer[];
}

const TopPerformers: React.FC<TopPerformersProps> = ({ topPerformers }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recurring Top Performers</h3>
      </div>

      <div className="p-6">
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h5 className="font-medium text-green-900 mb-2">Students who consistently excel</h5>
          <p className="text-sm text-green-800">
            This section highlights students who have appeared in the top performer list for multiple exams.
            These students have demonstrated consistent excellence in their academic performance.
          </p>
        </div>

        {topPerformers.length > 0 ? (
          <div className="space-y-6">
            {topPerformers.map((student) => (
              <div key={student.studentId || 'unknown'} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">Student Name: {student.studentName || 'Anonymous'}</h5>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {student.occurrences} appearances
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Performance History</h6>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {student.appearances.map((appearance, appearanceIndex) => (
                          <tr key={appearanceIndex} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900">{appearance.examTitle}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{appearance.academicYear}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{appearance.date}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-right">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appearance.percentage >= 90 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {appearance.percentage.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add performance trend */}
                  {student.appearances.length >= 2 && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-md">
                      <h6 className="text-xs font-medium text-indigo-800 mb-1">Performance Trend:</h6>
                      <p className="text-xs text-indigo-700">
                        {(() => {
                          const firstScore = student.appearances[0].percentage;
                          const lastScore = student.appearances[student.appearances.length - 1].percentage;
                          const diff = lastScore - firstScore;
                          return diff > 0
                            ? `Improved by ${diff.toFixed(2)}% over time`
                            : diff < 0
                              ? `Decreased by ${Math.abs(diff).toFixed(2)}% over time`
                              : `Maintained consistent performance`;
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recurring top performers found in the data.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformers;