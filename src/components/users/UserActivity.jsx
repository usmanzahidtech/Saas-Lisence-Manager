import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/helpers';
import { Activity, CheckCircle, XCircle, Smartphone, Monitor, Clock } from 'lucide-react';

const UserActivity = () => {
  const { userData } = useAuth();

  // Mock data - Replace with real data from Firestore
  const recentActivity = [
    { 
      id: 1,
      date: new Date(),
      device: 'Android 13',
      ip: '192.168.1.5',
      status: 'success',
      location: 'Pakistan'
    },
    { 
      id: 2,
      date: new Date(Date.now() - 86400000),
      device: 'Windows 11',
      ip: '192.168.1.8',
      status: 'success',
      location: 'Pakistan'
    },
    { 
      id: 3,
      date: new Date(Date.now() - 172800000),
      device: 'Android 13',
      ip: '192.168.1.5',
      status: 'success',
      location: 'Pakistan'
    },
    { 
      id: 4,
      date: new Date(Date.now() - 259200000),
      device: 'Windows 11',
      ip: '192.168.1.8',
      status: 'failed',
      location: 'Pakistan'
    },
  ];

  const getDeviceIcon = (device) => {
    if (device.toLowerCase().includes('android') || device.toLowerCase().includes('ios')) {
      return <Smartphone className="w-5 h-5 text-blue-600" />;
    }
    return <Monitor className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-blue-600" />
          Recent Activity
        </h1>
        <p className="text-gray-600">View your recent login history and account activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-700 mb-1 uppercase tracking-wide">Successful Logins</p>
              <p className="text-4xl font-extrabold text-green-900">
                {recentActivity.filter(a => a.status === 'success').length}
              </p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-green-200">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-700 mb-1 uppercase tracking-wide">Failed Attempts</p>
              <p className="text-4xl font-extrabold text-red-900">
                {recentActivity.filter(a => a.status === 'failed').length}
              </p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-red-200">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-700 mb-1 uppercase tracking-wide">Active Devices</p>
              <p className="text-4xl font-extrabold text-blue-900">2</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-blue-200">
              <Smartphone className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Login History</h2>
          <span className="text-sm text-gray-600">Last 30 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Device</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 font-medium">{formatDateTime(activity.date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getDeviceIcon(activity.device)}
                      <span className="text-sm text-gray-600 ml-2">{activity.device}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{activity.ip}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{activity.location}</td>
                  <td className="px-4 py-3">
                    {activity.status === 'success' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
          <div className="flex items-start">
            <div className="p-2 bg-white rounded-lg border border-blue-100 shadow-sm mr-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-lg">Security Notice</h3>
              <p className="text-blue-800 leading-relaxed">
                Your account is monitored 24/7 for suspicious activity. If you notice any unfamiliar login attempts, please contact support immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;
