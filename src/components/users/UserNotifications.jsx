import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { checkExpiryStatus, formatDateTime } from '../../utils/helpers';
import { Bell, AlertTriangle, CheckCircle, Info, XCircle, RefreshCw } from 'lucide-react';

const UserNotifications = () => {
  const { currentUser, userData, companyData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'important'

  useEffect(() => {
    if (currentUser && companyData) {
      buildNotifications();
    }
  }, [currentUser, companyData]);

  const buildNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = [];
      let notifId = 1;

      // 1. License-based notifications (derived from companyData)
      if (companyData) {
        const expiryStatus = checkExpiryStatus(companyData.expiryDate);

        if (expiryStatus.status === 'expired') {
          allNotifications.push({
            id: notifId++,
            type: 'error',
            title: 'License Expired',
            message: `Your company license has expired. Please contact your administrator to renew immediately.`,
            date: new Date(),
            read: false,
            important: true,
          });
        } else if (expiryStatus.isExpiringSoon) {
          allNotifications.push({
            id: notifId++,
            type: 'warning',
            title: 'License Expiring Soon',
            message: `Your company license will expire in ${expiryStatus.daysRemaining} days. Please contact your administrator to renew.`,
            date: new Date(),
            read: false,
            important: true,
          });
        } else if (expiryStatus.daysRemaining <= 60) {
          allNotifications.push({
            id: notifId++,
            type: 'info',
            title: 'License Renewal Reminder',
            message: `Your company license has ${expiryStatus.daysRemaining} days remaining. Consider planning your renewal.`,
            date: new Date(),
            read: true,
            important: false,
          });
        }
      }

      // 2. Fetch recent audit log events for this user
      try {
        const q = query(
          collection(db, 'auditLogs'),
          where('performedBy', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const log = doc.data();
          const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);

          if (log.action === 'login_success') {
            allNotifications.push({
              id: notifId++,
              type: 'success',
              title: 'Login Successful',
              message: log.details || 'You successfully logged into your account.',
              date: logDate,
              read: true,
              important: false,
            });
          } else if (log.action === 'login_failed') {
            allNotifications.push({
              id: notifId++,
              type: 'error',
              title: 'Failed Login Attempt',
              message: log.details || 'A failed login attempt was detected on your account.',
              date: logDate,
              read: false,
              important: true,
            });
          } else if (log.action === 'edit_user' && log.targetUser === currentUser.uid) {
            allNotifications.push({
              id: notifId++,
              type: 'info',
              title: 'Profile Updated',
              message: log.details || 'Your profile information was updated.',
              date: logDate,
              read: true,
              important: false,
            });
          }
        });
      } catch (err) {
        // If index is not ready, just skip audit-based notifications
        console.warn('Could not fetch audit logs for notifications:', err.message);
      }

      // Sort all notifications by date (newest first)
      allNotifications.sort((a, b) => b.date - a.date);

      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error building notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getNotificationBg = (type, read) => {
    if (!read) return 'bg-blue-50 border-l-4 border-blue-500';

    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  // Apply filters
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'important') return n.important;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-blue-600" />
              Notifications
            </h1>
            <p className="text-gray-600">Stay updated with important alerts and announcements</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
            <button
              onClick={buildNotifications}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notification Filters */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            filter === 'unread'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('important')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            filter === 'important'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          Important ({notifications.filter((n) => n.important).length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading notifications...</p>
        </div>
      ) : (
        <>
          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border-2 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 ${getNotificationBg(notification.type, notification.read)} ${!notification.read ? 'border-blue-400' : 'border-gray-200'}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {notification.important && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                            Important
                          </span>
                        )}
                        {!notification.read && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {notification.date instanceof Date
                        ? formatDateTime(notification.date)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 shadow-sm text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? "You're all caught up! Check back later for updates."
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserNotifications;
