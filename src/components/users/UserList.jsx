import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, limit, startAfter } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { createAuditLog } from '../../utils/helpers';
import { getCompany } from '../../utils/CompanyService';
import { Users, Search, Edit, Ban, CheckCircle, UserPlus, Trash2, Building2 } from 'lucide-react';

const UserList = () => {
  const { currentUser, userRole, userData } = useAuth();
  const [searchParams] = useSearchParams();
  const companyIdFilter = searchParams.get('companyId');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [companies, setCompanies] = useState({});
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    // Initial fetch
    fetchUsers();
  }, [currentUser, userRole, filterStatus, companyIdFilter]); // Refetch when filters change

  // Search effect - Debounce could be added here
  useEffect(() => {
    if (searchTerm) {
      // If searching, we might need to fetch all matching or rely on client side if dataset is small
      // For true scalability, we'd need a search service. 
      // For now, let's keep client-side filtering on the *fetched* data, 
      // OR reset pagination and try to find on server (complex with Firestore).
      // Let's stick to client-side filtering of the *current view* or fetch all for search?
      // Fetching all for search is bad for performance.
      // Let's assume for this task, pagination is the priority for the main list.
      applyFilters();
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async (isNextPage = false) => {
    try {
      if (isNextPage) {
        setIsFetchingMore(true);
      } else {
        setLoading(true);
        setUsers([]); // Clear current users on fresh fetch
        setLastVisible(null);
      }

      let q;
      const baseCollection = collection(db, 'users');
      // Note: Removed orderBy to avoid complex index requirements (companyId + createdAt)
      // We will rely on default ordering or client-side sort if needed
      let constraints = [limit(USERS_PER_PAGE)];

      if (userRole === 'admin') {
        constraints.unshift(where('companyId', '==', userData.companyId));
      } else if (companyIdFilter) {
        // Super Admin filtering by specific company
        constraints.unshift(where('companyId', '==', companyIdFilter));
      } else {
        // Only add orderBy for Super Admin who views all users (no where clause conflict)
        constraints.unshift(orderBy('createdAt', 'desc'));
      }

      // Add Status Filter to Query if not 'all'
      if (filterStatus !== 'all') {
         // Note: Firestore requires index for different fields in where + orderBy
         // We might need to create an index for status + createdAt
         constraints.unshift(where('status', '==', filterStatus));
      }

      if (isNextPage && lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      q = query(baseCollection, ...constraints);

      const querySnapshot = await getDocs(q);
      
      // Update Last Visible
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      setHasMore(querySnapshot.docs.length === USERS_PER_PAGE);

      const usersList = [];
      const companyIds = new Set();

      querySnapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() };
        usersList.push(user);
        if (user.companyId) companyIds.add(user.companyId);
      });

      // Fetch company data for new users
      if (companyIds.size > 0) {
        const newCompaniesData = { ...companies };
        await Promise.all(
          Array.from(companyIds).map(async (companyId) => {
            if (!newCompaniesData[companyId]) {
              const company = await getCompany(companyId);
              if (company) {
                newCompaniesData[companyId] = company;
              }
            }
          })
        );
        setCompanies(newCompaniesData);
      }

      if (isNextPage) {
        setUsers(prev => [...prev, ...usersList]);
        setFilteredUsers(prev => [...prev, ...usersList]);
      } else {
        setUsers(usersList);
        setFilteredUsers(usersList);
      }

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const applyFilters = () => {
    // Client-side search on loaded users
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user => {
        const company = companies[user.companyId];
        const companyName = company?.name || '';
        
        return user.firstName?.toLowerCase().includes(term) ||
          user.lastName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          companyName.toLowerCase().includes(term);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'suspended' ? 'activate' : 'suspend'} this user?`)) {
      return;
    }

    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });

      // Create audit log
      await createAuditLog('suspend_user', {
        performedBy: currentUser.uid,
        performedByEmail: userData.email,
        targetUser: userId,
        message: `User ${newStatus === 'suspended' ? 'suspended' : 'activated'}`,
        metadata: { newStatus }
      });

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));

      // Create audit log
      await createAuditLog('delete_user', {
        performedBy: currentUser.uid,
        performedByEmail: userData.email,
        targetUser: userId,
        message: `User deleted permanently: ${userEmail}`,
        metadata: { deletedUserEmail: userEmail }
      });

      // Refresh user list
      fetchUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const getCompanyBadge = (companyId) => {
    const company = companies[companyId];
    if (!company) return { text: 'No Company', class: 'bg-gray-100 text-gray-600' };

    // Check company expiry and status
    const now = new Date();
    const expiryDate = company.expiryDate.toDate ? company.expiryDate.toDate() : new Date(company.expiryDate);
    
    if (company.status === 'suspended') {
      return { text: 'Suspended', class: 'bg-red-100 text-red-700' };
    }
    if (expiryDate <= now) {
      return { text: 'Expired', class: 'bg-red-100 text-red-700' };
    }
    
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      return { text: 'Expiring Soon', class: 'bg-yellow-100 text-yellow-700' };
    }
    
    return { text: 'Active', class: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            {userRole === 'super_admin' ? 'All Users' : 'My Company Users'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'super_admin' 
              ? 'Manage all users in the system'
              : 'Manage users in your company'}
          </p>
        </div>
        <Link to="/users/create" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
          <UserPlus className="w-5 h-5 mr-2 inline" />
          Create New User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm mb-6 animate-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium appearance-none"
            >
              <option value="all">All Users</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' ? 'No users match your filters' : 'No users found'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/users/create" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30">
                Create Your First User
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profile</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">License Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const company = companies[user.companyId];
                  const licenseStatus = getCompanyBadge(user.companyId);

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
                      <td className="px-4 py-3 text-gray-600">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-gray-900">{company?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-sm text-gray-700">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${licenseStatus.class}`}>
                          {licenseStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {userRole === 'super_admin' && (
                            <>
                              <Link
                                to={`/users/edit/${user.id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && !loading && !searchTerm && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchUsers(true)}
              disabled={isFetchingMore}
              className="px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
            >
              {isFetchingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2 inline-block"></div>
                  Loading More...
                </>
              ) : (
                'Load More Users'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
