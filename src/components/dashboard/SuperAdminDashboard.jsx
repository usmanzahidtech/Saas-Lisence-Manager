import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { getAllCompanies, getCompanyStats, getCompany } from '../../utils/CompanyService';
import { checkExpiryStatus, formatDateTime } from '../../utils/helpers';
import { Users, TrendingUp, AlertTriangle, XCircle, Activity, UserPlus, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    withCompany: 0,
    withoutCompany: 0
  });
  const [companyStats, setCompanyStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    suspended: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Company Stats (Aggregation - Super Fast)
      const stats = await getCompanyStats();
      setCompanyStats(stats);

      // 2. Fetch Recent Users (Limit 10)
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
      const usersSnapshot = await getDocs(usersQuery);
      const users = [];
      const companyIds = new Set();

      usersSnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        users.push(data);
        if (data.companyId) {
          companyIds.add(data.companyId);
        }
      });

      setAllUsers(users);

      // 3. Fetch only relevant companies for the recent users
      const relevantCompanies = [];
      if (companyIds.size > 0) {
        // We can't use 'in' with > 10 items easily, but for 10 users max 10 companies, it's fine.
        // Or just Promise.all getDoc
        await Promise.all(Array.from(companyIds).map(async (id) => {
          const comp = await getCompany(id);
          if (comp) relevantCompanies.push(comp);
        }));
      }
      setCompanies(relevantCompanies);

      // 4. User Stats (We need aggregation for this too, but for now let's use a rough estimate or separate aggregation function)
      // For now, let's just use the total count from metadata if available, or fetch count
      // Let's add getUserStats to CompanyService or helpers? 
      // For now, I'll use getCountFromServer for users too.
      
      const usersColl = collection(db, 'users');
      const totalUsersSnap = await getCountFromServer(usersColl);
      const totalUsers = totalUsersSnap.data().count;
      
      // We can't easily distinguish withCompany/withoutCompany without an index or denormalization
      // So we might skip that breakdown or do a count query with where('companyId', '!=', null) if index exists
      // Let's just show Total Users for now to be fast
      
      setUserStats({
        total: totalUsers,
        withCompany: 0, // Placeholder or need index
        withoutCompany: 0 // Placeholder
      });

      // 5. Fetch recent audit logs
      const logsQuery = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logs = [];
      logsSnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setRecentActivity(logs);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, gradient }) => (
    <div className={`card p-4 rounded-2xl bg-gradient-to-br ${gradient} transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold mb-1 text-white/90">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getActionBadge = (action) => {
    const badges = {
      'create_user': 'bg-green-100 text-green-800',
      'create_company': 'bg-blue-100 text-blue-800',
      'update_company': 'bg-indigo-100 text-indigo-800',
      'edit_user': 'bg-blue-100 text-blue-800',
      'suspend_user': 'bg-red-100 text-red-800',
      'delete_user': 'bg-red-100 text-red-800',
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
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-600">Complete system overview and management</p>
      </div>

      {/* Company Stats Cards */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Company Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 animate-slide-in">
          <StatCard
            icon={Building2}
            label="Total Companies"
            value={companyStats.total}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Active"
            value={companyStats.active}
            gradient="from-green-500 to-green-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Expiring Soon"
            value={companyStats.expiringSoon}
            gradient="from-yellow-500 to-yellow-600"
          />
          <StatCard
            icon={XCircle}
            label="Expired"
            value={companyStats.expired}
            gradient="from-red-500 to-red-600"
          />
          <StatCard
            icon={XCircle}
            label="Suspended"
            value={companyStats.suspended}
            gradient="from-gray-500 to-gray-600"
          />
        </div>
      </div>

      {/* User Stats Cards */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in">
          <StatCard
            icon={Users}
            label="Total Users"
            value={userStats.total}
            gradient="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={Building2}
            label="Company Users"
            value={userStats.withCompany}
            gradient="from-indigo-500 to-indigo-600"
          />
          <StatCard
            icon={Users}
            label="Legacy Users"
            value={userStats.withoutCompany}
            gradient="from-gray-500 to-gray-600"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4 flex-wrap">
        <Link to="/companies/create" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
          <Building2 className="w-5 h-5 mr-2 inline" />
          Create Company
        </Link>
        <Link to="/users/create" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
          <UserPlus className="w-5 h-5 mr-2 inline" />
          Create User
        </Link>
        <Link to="/companies" className="px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200">
          <Building2 className="w-5 h-5 mr-2 inline" />
          View All Companies
        </Link>
        <Link to="/users" className="px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200">
          <Users className="w-5 h-5 mr-2 inline" />
          View All Users
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            </div>
            <Link to="/audit-logs" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No activity yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getActionBadge(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {log.timestamp ? formatDateTime(log.timestamp) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{log.details}</p>
                  {log.performedByEmail && (
                    <p className="text-xs text-gray-500 mt-1">By: {log.performedByEmail}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recently Created Users</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600 mx-auto"></div>
            </div>
          ) : allUsers.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No users yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allUsers.slice(0, 10).map((user) => {
                const company = companies.find(c => c.id === user.companyId);
                
                return (
                  <div key={user.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {company ? company.name : 'No Company'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
