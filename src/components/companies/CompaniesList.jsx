import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllCompanies, 
  getCompanyUserCount 
} from '../../utils/CompanyService';
import { checkExpiryStatus, formatDate, copyToClipboard } from '../../utils/helpers';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Users as UsersIcon, 
  Copy, 
  CheckCircle,
  Key,
  Globe,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

const CompaniesList = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);
  const [userCounts, setUserCounts] = useState({});

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAllCompanies();
      
      // Fetch user count for each company
      const counts = {};
      await Promise.all(
        data.map(async (company) => {
          counts[company.id] = await getCompanyUserCount(company.id);
        })
      );
      
      setUserCounts(counts);
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search effect
  useEffect(() => {
    let filtered = [...companies];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.licenseKey.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => {
        const expiryStatus = checkExpiryStatus(company.expiryDate);
        
        if (statusFilter === 'active') {
          return company.status === 'active' && expiryStatus.status !== 'expired';
        } else if (statusFilter === 'expiring') {
          return expiryStatus.isExpiringSoon && company.status === 'active';
        } else if (statusFilter === 'expired') {
          return expiryStatus.status === 'expired';
        } else if (statusFilter === 'suspended') {
          return company.status === 'suspended';
        }
        return true;
      });
    }

    setFilteredCompanies(filtered);
  }, [searchTerm, statusFilter, companies]);

  const handleCopyLicenseKey = async (licenseKey) => {
    const success = await copyToClipboard(licenseKey);
    if (success) {
      setCopiedKey(licenseKey);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getStatusBadge = (company) => {
    const expiryStatus = checkExpiryStatus(company.expiryDate);
    
    if (company.status === 'suspended') {
      return <span className="badge-suspended">Suspended</span>;
    }
    
    if (expiryStatus.status === 'expired') {
      return <span className="badge-expired">Expired</span>;
    }
    
    if (expiryStatus.isExpiringSoon) {
      return <span className="badge-expiring">Expiring Soon</span>;
    }
    
    return <span className="badge-active">Active</span>;
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => {
      const expiry = checkExpiryStatus(c.expiryDate);
      return c.status === 'active' && expiry.status !== 'expired';
    }).length,
    expiring: companies.filter(c => {
      const expiry = checkExpiryStatus(c.expiryDate);
      return expiry.isExpiringSoon && c.status === 'active';
    }).length,
    expired: companies.filter(c => checkExpiryStatus(c.expiryDate).status === 'expired').length,
    suspended: companies.filter(c => c.status === 'suspended').length
  };

  if (userRole !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only Super Admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-blue-600" />
            Companies Management
          </h1>
          <p className="text-gray-600">Manage all company licenses and configurations</p>
        </div>
        <button
          onClick={() => navigate('/companies/create')}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Company
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8 animate-slide-in">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg border-2 border-blue-400 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-wide">Total Companies</p>
              <h3 className="text-3xl font-extrabold">{stats.total}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg border-2 border-green-400 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-wide">Active</p>
              <h3 className="text-3xl font-extrabold">{stats.active}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg border-2 border-yellow-400 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-wide">Expiring Soon</p>
              <h3 className="text-3xl font-extrabold">{stats.expiring}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg border-2 border-red-400 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-wide">Expired</p>
              <h3 className="text-3xl font-extrabold">{stats.expired}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-lg border-2 border-gray-400 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-wide">Suspended</p>
              <h3 className="text-3xl font-extrabold">{stats.suspended}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl border border-white/30">
              <X className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm mb-6 animate-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by company name or license key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium appearance-none"
            >
              <option value="all">All Companies</option>
              <option value="active">Active Only</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden animate-slide-in">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading companies...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Companies Found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first company'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    License Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Server URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <div className="font-semibold text-gray-800">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {company.licenseKey}
                        </code>
                        <button
                          onClick={() => handleCopyLicenseKey(company.licenseKey)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Copy License Key"
                        >
                          {copiedKey === company.licenseKey ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-4 h-4 mr-1" />
                        <a 
                          href={company.serverUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 truncate max-w-xs"
                        >
                          {company.serverUrl}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(company.expiryDate)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {checkExpiryStatus(company.expiryDate).daysRemaining} days left
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/users?companyId=${company.id}`)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        title="View Company Users"
                      >
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {userCounts[company.id] || 0}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(company)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/companies/edit/${company.id}`)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
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

export default CompaniesList;
