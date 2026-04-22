import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { secondaryAuth, db } from '../../utils/firebase';
import { createAuditLog } from '../../utils/helpers';
import { getActiveCompanies } from '../../utils/CompanyService';
import { uploadProfileImage, validateImageFile } from '../../utils/imageUtils';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Image as ImageIcon,
  Phone
} from 'lucide-react';

const CreateUser = () => {
  const { currentUser, userData, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyId: '',
    role: 'user'
  });

  // Profile image
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');

  // Load companies on mount (only for Super Admin)
  useEffect(() => {
    if (userRole === 'super_admin') {
      loadActiveCompanies();
    } else if (userRole === 'admin') {
      // Company Admin: Auto-assign their company
      setFormData(prev => ({ ...prev, companyId: userData.companyId }));
    }
  }, [userRole, userData]);

  const loadActiveCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const activeCompanies = await getActiveCompanies();
      setCompanies(activeCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      setError('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError('');
    
    if (!file) {
      setProfileImage(null);
      setImagePreview(null);
      return;
    }

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setImageError(validation.error);
      setProfileImage(null);
      setImagePreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setProfileImage(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setImageError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || 
        !formData.lastName || !formData.companyId) {
      setError('Please fill in all required fields');
      return;
    }

    // Role validation - Admins can only create users, not other admins
    if (userRole === 'admin' && formData.role !== 'user') {
      setError('You can only create User accounts, not Admin accounts');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth account using SECONDARY auth to prevent logout
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      const newUser = userCredential.user;

      // IMPORTANT: Sign out from secondary auth immediately to prevent session conflicts
      await signOut(secondaryAuth);

      // Upload profile image if provided
      let photoUrl = null;
      if (profileImage) {
        try {
          photoUrl = await uploadProfileImage(newUser.uid, profileImage);
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          // Continue with user creation even if image upload fails
          setError('User created but profile image upload failed');
        }
      }

      // Create Firestore document with company-based structure
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: formData.email,
        visiblePassword: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        companyId: formData.companyId,
        photoUrl: photoUrl,
        role: formData.role,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp()
      });

      // Get company name for audit log
      const companyName = userRole === 'super_admin' 
        ? companies.find(c => c.id === formData.companyId)?.name 
        : userData.companyName || 'Unknown';

      // Create audit log
      await createAuditLog('create_user', {
        performedBy: currentUser.uid,
        performedByEmail: userData.email,
        targetUser: newUser.uid,
        message: `Created new ${formData.role} account for ${formData.firstName} ${formData.lastName} (${formData.email})`,
        metadata: {
          role: formData.role,
          companyId: formData.companyId,
          companyName: companyName
        }
      });

      setSuccess(`User created successfully!`);
      
      // Reset form after 2 seconds
      const timer = setTimeout(() => {
        navigate('/users');
      }, 2000);
      
      return () => clearTimeout(timer);

    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <UserPlus className="w-8 h-8 mr-3 text-blue-600" />
          Create New User
        </h1>
        <p className="text-gray-600">Add a new user to the system</p>
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

      <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in">
        {/* Profile Image Upload */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
            Profile Photo
          </h3>
          
          <div className="flex items-start space-x-6">
            {/* Image Preview */}
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden ${!imagePreview ? 'bg-gray-100' : ''}`}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 pt-2">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200">
                <Upload className="w-5 h-5 mr-2" />
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Max size 500KB. Supported formats: JPEG, PNG, GIF, WebP.
              </p>
              {imageError && (
                <p className="text-sm text-red-600 mt-2">{imageError}</p>
              )}
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-blue-600" />
            Account Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-medium"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company & Role Assignment */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Company & Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Selection - Only for Super Admin */}
            {userRole === 'super_admin' ? (
              <div>
                <label htmlFor="companyId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign Company *
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium appearance-none"
                  required
                  disabled={loadingCompanies}
                >
                  <option value="">Select a company</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {loadingCompanies && <p className="text-xs text-gray-500 mt-1">Loading companies...</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium">
                  {userData.companyName || 'Your Company'}
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                User Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 text-gray-900 font-medium appearance-none"
              >
                <option value="user">User</option>
                <option value="admin">Company Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {formData.role === 'user' && 'Can access dashboard and view their own data.'}
                {formData.role === 'admin' && 'Can manage users within their company.'}
                {formData.role === 'super_admin' && 'Full system access.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            disabled={loading}
            className="px-6 py-3 border-2 border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
