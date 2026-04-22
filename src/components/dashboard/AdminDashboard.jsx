import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { getCompany } from '../../utils/CompanyService';
import { checkExpiryStatus, formatDate } from '../../utils/helpers';
import { Users, UserPlus, TrendingUp, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { userData, currentUser, companyData } = useAuth();
  const [myUsers, setMyUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyUsers();
  }, [currentUser, userData]);

  const fetchMyUsers = async () => {
    try {
      setLoading(true);
      // Fetch users in admin's company
      if (!userData?.companyId) {
        console.error('Company ID missing for admin user');
        setLoading(false);
        return;
      }

      // Fetch users in admin's company
      // Note: Removed orderBy to avoid index requirements. Sorting client-side if needed.
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', userData.companyId)
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        users.push(data);
      });

      setMyUsers(users);
      setStats({
        total: users.length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1 uppercase tracking-wide">{label}</p>
          <p className={`text-4xl font-extrabold ${color}`}>{value}</p>
        </div>
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center shadow-sm border-2 border-white`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </div>
  );

  const getCompanyStatus = () => {
    if (!companyData) return { text: 'No Company', class: 'bg-gray-100 text-gray-700' };

    const expiryStatus = checkExpiryStatus(companyData.expiryDate);
    
    if (companyData.status === 'suspended') {
      return { text: 'Suspended', class: 'bg-red-100 text-red-700', icon: AlertTriangle };
    }
    if (expiryStatus.status === 'expired') {
      return { text: 'Expired', class: 'bg-red-100 text-red-700', icon: AlertTriangle };
    }
    if (expiryStatus.isExpiringSoon) {
      return { text: `Expiring in ${expiryStatus.daysRemaining} days`, class: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    }
    
    return { text: `Active (${expiryStatus.daysRemaining} days left)`, class: 'bg-green-100 text-green-700', icon: TrendingUp };
  };

  const companyStatus = getCompanyStatus();

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage your company users and view license status</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Company License Status */}
      {companyData && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-200 mb-8 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 mr-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{companyData.name}</h2>
                  <p className="text-blue-600 font-medium">Company Dashboard</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="bg-white/60 p-3 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">License Key</p>
                  <code className="font-mono text-sm text-gray-800 break-all">{companyData.licenseKey}</code>
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-blue-100 flex items-center">
                  <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Expires On</p>
                    <p className="text-sm font-bold text-gray-800">{formatDate(companyData.expiryDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ml-6 text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-xl border-2 ${
                companyStatus.class.includes('green') ? 'bg-green-50 border-green-200 text-green-700' : 
                companyStatus.class.includes('yellow') ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                'bg-red-50 border-red-200 text-red-700'
              }`}>
                {companyStatus.icon && <companyStatus.icon className="w-5 h-5 mr-2" />}
                <span className="font-bold">{companyStatus.text}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-slide-in">
        <StatCard
          icon={Users}
          label="Total Company Users"
          value={stats.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Building2}
          label="Company Users"
          value={stats.total}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link
          to="/users/create"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create New User
        </Link>
      </div>

      {/* Users Table */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Company Users</h2>
          <span className="text-sm text-gray-600">{stats.total} total</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : myUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No users yet</p>
            <Link to="/users/create" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
              Create Your First User
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profile</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myUsers.map((user) => {
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-sm text-gray-700">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
