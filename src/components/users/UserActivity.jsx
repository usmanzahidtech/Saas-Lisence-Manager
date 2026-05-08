import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { formatDateTime } from '../../utils/helpers';
import { Activity, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const UserActivity = () => {
  const { currentUser, userData } = useAuth();
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchActivity();
    }
  }, [currentUser]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch audit logs for the current user
      const q = query(
        collection(db, 'auditLogs'),
        where('performedBy', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      setActivityLogs(logs);
    } catch (err) {
      console.error('Error fetching activity:', err);
      // If index is missing, show helpful message
      if (err.code === 'failed-precondition') {
        setError('Activity index is being built. Please try again in a few minutes.');
      } else {
        setError('Failed to load activity. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const successCount = activityLogs.filter(
    (a) => a.action === 'login_success'
  ).length;
  const failedCount = activityLogs.filter(
    (a) => a.action === 'login_failed'
  ).length;

  const getActionIcon = (action) => {
    if (action === 'login_success' || action === 'create_user' || action === 'logout') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (action === 'login_failed' || action === 'suspend_user' || action === 'delete_user') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  const getActionBadge = (action) => {
    const badges = {
      login_success: { text: 'Login', class: 'bg-green-100 text-green-700' },
      login_failed: { text: 'Failed Login', class: 'bg-red-100 text-red-700' },
      logout: { text: 'Logout', class: 'bg-gray-100 text-gray-700' },
      create_user: { text: 'Created User', class: 'bg-blue-100 text-blue-700' },
      edit_user: { text: 'Edited User', class: 'bg-indigo-100 text-indigo-700' },
      suspend_user: { text: 'Suspended User', class: 'bg-orange-100 text-orange-700' },
      delete_user: { text: 'Deleted User', class: 'bg-red-100 text-red-700' },
      create_company: { text: 'Created Company', class: 'bg-purple-100 text-purple-700' },
      update_company: { text: 'Updated Company', class: 'bg-indigo-100 text-indigo-700' },
    };
    const badge = badges[action] || { text: action, class: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-blue-600" />
          Recent Activity
        </h1>
        <p className="text-gray-600">View your recent account activity and login history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-700 mb-1 uppercase tracking-wide">Successful Logins</p>
              <p className="text-4xl font-extrabold text-green-900">{successCount}</p>
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
              <p className="text-4xl font-extrabold text-red-900">{failedCount}</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-red-200">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-700 mb-1 uppercase tracking-wide">Total Actions</p>
              <p className="text-4xl font-extrabold text-blue-900">{activityLogs.length}</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-blue-200">
              <Activity className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Activity History</h2>
          <button
            onClick={fetchActivity}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading activity...</p>
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">No Activity Yet</h3>
            <p className="text-gray-600">Your activity history will appear here as you use the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">
                          {log.timestamp ? formatDateTime(log.timestamp) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.details || 'No details'}
                    </td>
                    <td className="px-4 py-3">
                      {getActionIcon(log.action)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm">
          <div className="flex items-start">
            <div className="p-2 bg-white rounded-lg border border-blue-100 shadow-sm mr-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2 text-lg">Security Notice</h3>
              <p className="text-blue-800 leading-relaxed">
                Your account activity is monitored for security purposes. If you notice any unfamiliar actions, please contact your administrator immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;
