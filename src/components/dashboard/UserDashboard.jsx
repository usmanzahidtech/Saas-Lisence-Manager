import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { checkExpiryStatus, formatDate, formatDateTime, copyToClipboard, parseDate } from '../../utils/helpers';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { 
  Key, 
  Calendar, 
  Globe, 
  Building2, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  TrendingUp,
  Shield
} from 'lucide-react';

const UserDashboard = () => {
  const { userData, companyData, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch real activity from auditLogs
  useEffect(() => {
    if (currentUser) {
      fetchRecentActivity();
    }
  }, [currentUser]);

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const q = query(
        collection(db, 'auditLogs'),
        where('performedBy', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setRecentActivity(logs);
    } catch (err) {
      // Index might not exist yet — gracefully handle
      console.warn('Could not fetch activity:', err.message);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const formatActionName = (action) => {
    const names = {
      login_success: 'Login Successful',
      login_failed: 'Failed Login',
      logout: 'Logged Out',
      create_user: 'Created User',
      edit_user: 'Updated Profile',
      create_company: 'Created Company',
      update_company: 'Updated Company',
    };
    return names[action] || action?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (!userData || !companyData) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const expiryStatus = checkExpiryStatus(companyData.expiryDate);

  // Calculate progress percentage
  const calculateProgress = () => {
    const start = parseDate(companyData.startDate);
    const expiry = parseDate(companyData.expiryDate);
    const now = new Date();
    
    const totalDays = Math.ceil((expiry - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const percentage = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
    
    return {
      percentage: percentage.toFixed(1),
      elapsed: Math.max(elapsedDays, 0),
      total: totalDays
    };
  };

  const progress = calculateProgress();

  const handleCopyLicenseKey = async () => {
    const success = await copyToClipboard(companyData.licenseKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const StatusIcon = () => {
    switch (expiryStatus.status) {
      case 'active':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'expiring_soon':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'expired':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    const badges = {
      active: { text: 'Active', class: 'badge-active' },
      expiring_soon: { text: 'Expiring Soon', class: 'badge-expiring' },
      expired: { text: 'Expired', class: 'badge-expired' }
    };
    const badge = badges[expiryStatus.status] || { text: 'Unknown', class: 'badge-expired bg-gray-100 text-gray-800' };
    return <span className={badge.class}>{badge.text}</span>;
  };

  const getProgressBarColor = () => {
    if (expiryStatus.status === 'expired') return 'bg-red-500';
    if (expiryStatus.status === 'expiring_soon') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {userData.firstName}! 👋
        </h1>
        <p className="text-gray-600">Here's your company license overview</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-700 mb-1 uppercase tracking-wide">Days Active</p>
              <p className="text-4xl font-extrabold text-blue-900">{progress.elapsed}</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-blue-200">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-700 mb-1 uppercase tracking-wide">Server Status</p>
              <p className="text-2xl font-extrabold text-green-900 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Online
              </p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-green-200">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-700 mb-1 uppercase tracking-wide">License Type</p>
              <p className="text-2xl font-extrabold text-purple-900">Premium</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-purple-200">
              <Shield className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main License Card with Progress */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200 mb-8 animate-slide-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{companyData.name}</h2>
              <p className="text-gray-600">Company License</p>
            </div>
          </div>
          <div className="text-right">
            <StatusIcon />
            <div className="mt-2">{getStatusBadge()}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">License Progress</span>
            <span className="text-sm text-gray-600">{progress.percentage}% elapsed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 ${getProgressBarColor()} transition-all duration-500 rounded-full`}
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* License Key Section */}
        <div className="bg-gray-50 rounded-xl p-5 mb-4 border-2 border-gray-200 hover:border-blue-300 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">License Key</p>
                <p className="text-lg font-mono text-gray-900 break-all">{companyData.licenseKey}</p>
              </div>
            </div>
            <button
              onClick={handleCopyLicenseKey}
              className="ml-4 p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Server URL */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border-2 border-gray-200 hover:border-blue-300 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Server URL</p>
              <a
                href={companyData.serverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all font-medium"
              >
                {companyData.serverUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Start Date</p>
            </div>
            <p className="text-gray-900 font-bold text-lg">{formatDate(companyData.startDate)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Expiry Date</p>
            </div>
            <p className="text-gray-900 font-bold text-lg">{formatDate(companyData.expiryDate)}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Days Remaining</p>
            </div>
            <p className={`text-2xl font-bold ${
              expiryStatus.status === 'expired' ? 'text-red-600' :
              expiryStatus.status === 'expiring_soon' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {expiryStatus.daysRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {expiryStatus.status === 'expiring_soon' && (
        <div className="card mb-6 border-l-4 border-yellow-500 bg-yellow-50 animate-fade-in">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">License Expiring Soon</h3>
              <p className="text-yellow-700">
                Your company license will expire in {expiryStatus.daysRemaining} days. Please contact your administrator to renew.
              </p>
            </div>
          </div>
        </div>
      )}

      {expiryStatus.status === 'expired' && (
        <div className="card mb-6 border-l-4 border-red-500 bg-red-50 animate-fade-in">
          <div className="flex items-start">
            <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">License Expired</h3>
              <p className="text-red-700">
                Your company license has expired. Please contact your administrator immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="font-semibold text-gray-800 mb-3">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Full Name:</span>
              <span className="font-medium text-gray-900">{userData.firstName} {userData.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{userData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium text-gray-900 capitalize">{userData.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="font-semibold text-gray-800 mb-3">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your license or need assistance, please contact your administrator.
          </p>
          <button className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
            Contact Support
          </button>
        </div>
      </div>

      {/* Activity and Session Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity — Real Data from Firestore */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Recent Activity
          </h3>
          {activityLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Loading...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => {
                const isSuccess = log.action === 'login_success' || log.action === 'create_user' || log.action === 'logout';
                const isFailed = log.action === 'login_failed';
                return (
                  <div key={log.id} className="flex items-start p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-colors duration-200">
                    <div className={`w-2 h-2 mt-2 rounded-full mr-3 ${isFailed ? 'bg-red-500' : isSuccess ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{formatActionName(log.action)}</p>
                      <p className="text-xs text-gray-500">
                        {log.timestamp ? formatDateTime(log.timestamp) : 'N/A'}
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{log.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Session — Real Browser Info */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Current Session
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mr-3">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                     navigator.userAgent.includes('Firefox') ? 'Firefox' :
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'}
                    {' on '}
                    {navigator.userAgent.includes('Windows') ? 'Windows' :
                     navigator.userAgent.includes('Mac') ? 'macOS' :
                     navigator.userAgent.includes('Linux') ? 'Linux' :
                     navigator.userAgent.includes('Android') ? 'Android' :
                     navigator.userAgent.includes('iPhone') ? 'iOS' : 'Unknown OS'}
                  </p>
                  <p className="text-xs text-green-700 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Active Now
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-white px-2 py-1 rounded border border-green-200 text-green-700">Live</span>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Session Details</h4>
              <div className="space-y-1 text-xs text-blue-700">
                <p><span className="font-medium">Logged in as:</span> {userData?.email}</p>
                <p><span className="font-medium">Role:</span> <span className="capitalize">{userData?.role?.replace('_', ' ')}</span></p>
                <p><span className="font-medium">Language:</span> {navigator.language || 'en'}</p>
                <p><span className="font-medium">Screen:</span> {window.screen?.width}x{window.screen?.height}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
