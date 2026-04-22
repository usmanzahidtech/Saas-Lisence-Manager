import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { formatDateTime } from '../../utils/helpers';
import { ClipboardList, Activity } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const logsList = [];
      querySnapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsList);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const badges = {
      'create_user': 'bg-green-100 text-green-800',
      'edit_user': 'bg-blue-100 text-blue-800',
      'suspend_user': 'bg-red-100 text-red-800',
      'login_success': 'bg-purple-100 text-purple-800',
      'login_failed': 'bg-orange-100 text-orange-800',
      'logout': 'bg-gray-100 text-gray-800'
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  const formatAction = (action) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
          Audit Logs
        </h1>
        <p className="text-gray-600">Complete system activity history</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performed By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.timestamp ? formatDateTime(log.timestamp) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getActionBadge(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.performedByEmail || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
