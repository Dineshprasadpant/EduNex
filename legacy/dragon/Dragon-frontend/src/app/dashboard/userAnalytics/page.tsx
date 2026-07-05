"use client"
import { useState, useEffect } from 'react';
import { fetchMonthlyAnalytics, fetchYearlyAnalytics } from '../../../../apiCalls/fetchUserAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { Select } from 'antd';
import moment from 'moment';

const { Option } = Select;

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

interface MonthOption {
  value: number;
  label: string;
}

interface PlanData {
  name: string;
  value: number;
}

interface UTMData {
  name: string;
  users: number;
}

interface MonthlyData {
  enrolledPlan: {
    free: number;
    half: number;
    full: number;
  };
  totalVisitors: number;
  totalVisits: number;
  subscribersGain: number;
  year: number;
  month: number;
  utmSources: {
    source: string;
    users: number;
  }[];
}

interface YearlyDataItem {
  year: number;
  month: number;
  subscribersGain: number;
  totalVisitors: number;
  totalVisits: number;
  enrolledPlan: {
    free: number;
    half: number;
    full: number;
  };
}

interface MonthlyComparisonData {
  name: string;
  subscribers: number;
  visitors: number;
  visits: number;
  free: number;
  half: number;
  full: number;
}

// Generate list of years from 2020 to current year
const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 2020; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

// Generate list of months with names
const getMonthOptions = (): MonthOption[] => {
  return [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
};

const AnalyticsDashboard = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(moment().year());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  
  // Available years and months for dropdowns
  const yearOptions = getYearOptions();
  const monthOptions = getMonthOptions();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (viewMode === 'monthly') {
          const data = await fetchMonthlyAnalytics(selectedMonth, selectedYear);
          setMonthlyData(data);
        } else {
          const data = await fetchYearlyAnalytics(selectedYear);
          setYearlyData(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, viewMode]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleViewModeChange = (mode: 'monthly' | 'yearly') => {
    setViewMode(mode);
    // Reset to current month when switching modes
    if (mode === 'monthly' && !monthlyData) {
      setSelectedMonth(moment().month() + 1);
    }
  };

  // Prepare data for charts
  const preparePlanData = (): PlanData[] => {
    if (!monthlyData) return [];
    return [
      { name: 'Free Plan', value: monthlyData.enrolledPlan.free },
      { name: 'Half Plan', value: monthlyData.enrolledPlan.half },
      { name: 'Full Plan', value: monthlyData.enrolledPlan.full }
    ];
  };

  const prepareMonthlyComparisonData = (): MonthlyComparisonData[] => {
    if (yearlyData.length === 0) return [];
    return yearlyData.map(monthData => ({
      name: new Date(monthData.year, monthData.month - 1).toLocaleString('default', { month: 'short' }),
      subscribers: monthData.subscribersGain,
      visitors: monthData.totalVisitors,
      visits: monthData.totalVisits,
      free: monthData.enrolledPlan.free,
      half: monthData.enrolledPlan.half,
      full: monthData.enrolledPlan.full
    }));
  };

  const prepareUTMSourceData = (): UTMData[] => {
    if (!monthlyData) return [];
    return monthlyData.utmSources.map((source) => ({
      name: source.source,
      users: source.users
    }));
  };

  // Plan Visualization Component
  const PlanVisualization = ({ planData }: { planData: PlanData[] }) => {
    const total = planData.reduce((sum, p) => sum + p.value, 0) || 1;
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution</h3>
        <div className="space-y-4">
          {planData.map((plan, index) => (
            <div key={plan.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  {plan.name}
                </span>
                <span className="text-gray-500">
                  {plan.value} ({Math.round((plan.value / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full" 
                  style={{ 
                    width: `${(plan.value / total) * 100}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simplified Time Period Selector Component
  const TimePeriodSelector = () => {
    return (
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div>
          <Select
            value={viewMode}
            className="w-full sm:w-32"
            onChange={handleViewModeChange}
          >
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
          </Select>
        </div>

        {viewMode === 'monthly' ? (
          <>
            <div>
              <Select
                value={selectedMonth}
                className="w-full sm:w-32"
                onChange={handleMonthChange}
              >
                {monthOptions.map(month => (
                  <Option key={month.value} value={month.value}>{month.label}</Option>
                ))}
              </Select>
            </div>
            <div>
              <Select
                value={selectedYear}
                className="w-full sm:w-24"
                onChange={handleYearChange}
              >
                {yearOptions.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>
          </>
        ) : (
          <div>
            <Select
              value={selectedYear}
              className="w-full sm:w-24"
              onChange={handleYearChange}
            >
              {yearOptions.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">User Analytics Dashboard</h1>
          
          {/* Simplified Time Period Selector */}
          <TimePeriodSelector />
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'monthly' && monthlyData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Visitors</h3>
                <p className="mt-2 text-3xl font-semibold text-indigo-600">{monthlyData.totalVisitors}</p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>Monthly visitors</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Visits</h3>
                <p className="mt-2 text-3xl font-semibold text-indigo-600">{monthlyData.totalVisits}</p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>Monthly visits</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">New Subscribers</h3>
                <p className="mt-2 text-3xl font-semibold text-indigo-600">{monthlyData.subscribersGain}</p>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>Monthly subscribers</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Current Period</h3>
                <p className="mt-2 text-xl font-semibold text-indigo-600">
                  {new Date(monthlyData.year, monthlyData.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Reporting period</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PlanVisualization planData={preparePlanData()} />

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution Chart</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePlanData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePlanData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} users`, 'Count']}
                        labelFormatter={(label: string) => `Plan: ${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">UTM Source Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareUTMSourceData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#6366F1" name="Users by Source" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {viewMode === 'yearly' && yearlyData.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Yearly Overview - {selectedYear}
              </h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={prepareMonthlyComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#6366F1" />
                    <YAxis yAxisId="right" orientation="right" stroke="#EC4899" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="subscribers" fill="#6366F1" name="Subscribers" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="visitors" stroke="#EC4899" name="Visitors" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Visits Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareMonthlyComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="visits" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.2}
                        name="Total Visits" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Enrollment Comparison</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareMonthlyComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="free" stackId="a" fill="#6366F1" name="Free Plan" />
                      <Bar dataKey="half" stackId="a" fill="#EC4899" name="Half Plan" />
                      <Bar dataKey="full" stackId="a" fill="#10B981" name="Full Plan" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;