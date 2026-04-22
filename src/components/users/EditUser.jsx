import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { createAuditLog } from '../../utils/helpers';
import { 
  Edit, 
  User, 
  Building2, 
  Globe, 
  Calendar,
  Key,
  AlertCircle,
  CheckCircle,
  Save,
  Phone
} from 'lucide-react';

const EditUser = () => {
  const { id } = useParams();
  const { currentUser, userData, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active'
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', id));
      
      if (!userDoc.exists()) {
        setError('User not found');
        return;
      }

      const fetchedUser = userDoc.data();
      setUser(fetchedUser);

      setFormData({
        firstName: fetchedUser.firstName || '',
        lastName: fetchedUser.lastName || '',
        email: fetchedUser.email || '',
        phone: fetchedUser.phone || '',
        role: fetchedUser.role || 'user',
        status: fetchedUser.status || 'active'
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      let updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };

      // Super Admin can also change role and status
      if (userRole === 'super_admin') {
        updateData.role = formData.role;
        updateData.status = formData.status;
      }

      await updateDoc(doc(db, 'users', id), updateData);

      // Create audit log
      await createAuditLog('edit_user', {
        performedBy: currentUser.uid,
        performedByEmail: userData.email,
        targetUser: id,
        message: `Updated user information for ${formData.firstName} ${formData.lastName}`,
        metadata: { updatedFields: Object.keys(updateData) }
      });

      setSuccess('User updated successfully!');
      
      setTimeout(() => {
        navigate('/users');
      }, 1500);

    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-6">
        <div className="card border-l-4 border-red-500 bg-red-50">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
          <button onClick={() => navigate('/users')} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30 mt-4">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const canEditField = (field) => {
    if (userRole === 'super_admin') return true;
    // Admin can only edit firstName, lastName
    return ['firstName', 'lastName', 'phone'].includes(field);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Edit className="w-8 h-8 mr-3 text-blue-600" />
          Edit User
        </h1>
        <p className="text-gray-600">Update user information</p>
        {userRole === 'admin' && (
          <p className="text-sm text-yellow-600 mt-2">
            ⚠️ As an Admin, you can only edit basic information (name and company)
          </p>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-green-800">Success</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card animate-slide-in space-y-6">
        {/* Read-Only IDs */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">User IDs (Read-Only)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom ID</label>
              <div className="bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm">
                {user?.customId}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="bg-white px-3 py-2 rounded border border-gray-300 text-sm">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={!canEditField('firstName')}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={!canEditField('lastName')}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={!canEditField('phone')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Settings (Super Admin Only) */}
        {userRole === 'super_admin' && (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-blue-600" />
              User Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2 inline" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
