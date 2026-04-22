import { Bell, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const UserNotifications = () => {
  // Mock notifications - Replace with real data
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'License Expiring Soon',
      message: 'Your company license will expire in 30 days. Please contact your administrator.',
      date: new Date(),
      read: false
    },
    {
      id: 2,
      type: 'success',
      title: 'Login Successful',
      message: 'You successfully logged in from a new device (Android 13).',
      date: new Date(Date.now() - 86400000),
      read: true
    },
    {
      id: 3,
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM.',
      date: new Date(Date.now() - 172800000),
      read: true
    },
    {
      id: 4,
      type: 'error',
      title: 'Failed Login Attempt',
      message: 'Unusual login attempt detected from IP 203.45.67.89.',
      date: new Date(Date.now() - 259200000),
      read: true
    },
  ];

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

  const unreadCount = notifications.filter(n => !n.read).length;

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
          {unreadCount > 0 && (
            <span className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold">
              {unreadCount} New
            </span>
          )}
        </div>
      </div>

      {/* Notification Filters */}
      <div className="flex space-x-2 mb-6">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all duration-200">All</button>
        <button className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">Unread</button>
        <button className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">Important</button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
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
                  {!notification.read && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold ml-2">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  {notification.date.toLocaleDateString()} at {notification.date.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.length === 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 shadow-sm text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-800 mb-2">No Notifications</h3>
          <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-gray-700">Email notifications</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-gray-700">Security alerts</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-gray-700">License expiry warnings</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;
